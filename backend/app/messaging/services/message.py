from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.messaging.models.conversation import Conversation
from app.messaging.models.message import Message
from app.messaging.repository.conversation import ConversationRepository
from app.messaging.repository.message import MessageRepository
from app.messaging.schemas.conversation import (
    ConversationParticipantResponse,
    ConversationResponse,
    UnreadCountResponse,
)
from app.messaging.schemas.message import (
    DirectMessageCreate,
    MessageCreate,
    MessageResponse,
)

COMMUNICATION_HIERARCHY: dict[str, set[str]] = {
    "student": {"*"},
    "students": {"*"},
    "faculty": {"*"},
    "hod": {"*"},
    "controller": {"*"},
    "alumni": {"*"},
    "tpo": {"*"},
    "dean": {"*"},
    "principal": {"*"},
    "ceo": {"*"},
    "central admin": {"*"},
    "admin": {"*"},
    "super admin": {"*"},
    "superadmin": {"*"},
    "management": {"*"},
    "recruiter": {"*"},
}


def validate_communication_hierarchy(
    sender_role: str | None, recipient_role: str | None
) -> bool:
    """Validate if sender role is authorized to communicate with recipient role (open communication)."""
    if not sender_role or not recipient_role:
        return True
    s_role = sender_role.strip().lower()
    r_role = recipient_role.strip().lower()

    allowed = COMMUNICATION_HIERARCHY.get(s_role, {"*"})
    if "*" in allowed:
        return True
    return any(r in r_role for r in allowed)


class MessagingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.message_repo = MessageRepository(db)
        self.conversation_repo = ConversationRepository(db)

    async def _check_hierarchy_permission(
        self, sender_id: int, receiver_id: int, enforce_tie: bool = False
    ) -> None:
        """Check if sender can initiate communication with receiver based on hierarchy & ties."""
        from sqlalchemy import and_, or_, select
        from sqlalchemy.orm import selectinload
        from app.connections.models.connection import Connection, ConnectionStatus
        from app.users.models.user import User

        sender_res = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.id == sender_id)
        )
        receiver_res = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.id == receiver_id)
        )

        sender_user = (
            sender_res.scalars().first() if hasattr(sender_res, "scalars") else None
        )
        receiver_user = (
            receiver_res.scalars().first() if hasattr(receiver_res, "scalars") else None
        )

        if not receiver_user:
            raise NotFoundError("Recipient not found")

        sender_role_name = (
            getattr(sender_user.role, "name", None)
            if sender_user and getattr(sender_user, "role", None)
            else "Student"
        )
        receiver_role_name = (
            getattr(receiver_user.role, "name", None)
            if receiver_user and getattr(receiver_user, "role", None)
            else "Student"
        )

        # Stealth check: Block direct messages to Super Admin from regular users
        is_sender_sa = sender_role_name.lower() in ("super admin", "superadmin")
        is_receiver_sa = receiver_role_name.lower() in ("super admin", "superadmin")
        if is_receiver_sa and not is_sender_sa:
            raise NotFoundError("Recipient not found")

        # Hierarchy validation
        if not validate_communication_hierarchy(sender_role_name, receiver_role_name):
            raise AuthorizationError(
                f"Communication restriction: Students cannot message {receiver_role_name} directly. Please contact your Faculty or HOD."
            )

        # Check tie status if student is sending to student or alumni
        if enforce_tie:
            s_low = sender_role_name.lower()
            r_low = receiver_role_name.lower()
            if s_low in ("student", "students") and (
                "student" in r_low or "alumni" in r_low
            ):
                conn_stmt = select(Connection).where(
                    or_(
                        and_(
                            Connection.requester_id == sender_id,
                            Connection.addressee_id == receiver_id,
                        ),
                        and_(
                            Connection.requester_id == receiver_id,
                            Connection.addressee_id == sender_id,
                        ),
                    )
                )
                conn_res = await self.db.execute(conn_stmt)
                conn = conn_res.scalars().first()
                if not conn or conn.status != ConnectionStatus.ACCEPTED:
                    raise ValidationError(
                        "You must be connected as ties before sending direct messages. Please send a message request first."
                    )

    async def send_message(self, sender_id: int, msg_in: MessageCreate) -> Message:
        """Send a message to a conversation or direct recipient."""
        from sqlalchemy import and_, select
        from app.messaging.models.conversation import ConversationParticipant

        if not msg_in.conversation_id and not msg_in.receiver_id:
            raise ValidationError(
                "Either conversation_id or receiver_id must be provided"
            )

        conversation_id = msg_in.conversation_id
        receiver_id = msg_in.receiver_id

        if conversation_id:
            # Check user is participant
            is_part = await self.conversation_repo.is_participant(
                conversation_id, sender_id
            )
            if not is_part:
                raise AuthorizationError(
                    "You are not a participant in this conversation"
                )

            # For 1-on-1 direct conversation, enforce tie check
            conv_obj = await self.conversation_repo.get(conversation_id)
            if conv_obj and not conv_obj.is_group:
                other_part_stmt = select(ConversationParticipant.user_id).where(
                    and_(
                        ConversationParticipant.conversation_id == conversation_id,
                        ConversationParticipant.user_id != sender_id,
                    )
                )
                other_part_res = await self.db.execute(other_part_stmt)
                other_uid = other_part_res.scalars().first()
                if other_uid:
                    await self._check_hierarchy_permission(
                        sender_id, other_uid, enforce_tie=True
                    )
        elif receiver_id:
            if sender_id == receiver_id:
                raise ValidationError("Cannot send a direct message to yourself")

            await self._check_hierarchy_permission(
                sender_id, receiver_id, enforce_tie=True
            )

            # Get or create direct conversation
            conv = await self.conversation_repo.get_or_create_direct_conversation(
                sender_id, receiver_id
            )
            conversation_id = conv.id

        message = await self.message_repo.create_message(
            sender_id=sender_id,
            content=msg_in.content,
            conversation_id=conversation_id,
            receiver_id=receiver_id,
        )
        return message

    async def send_direct_message(
        self, sender_id: int, payload: DirectMessageCreate
    ) -> Message:
        """Send a direct 1-on-1 message."""
        msg_in = MessageCreate(receiver_id=payload.receiver_id, content=payload.content)
        return await self.send_message(sender_id, msg_in)

    async def get_or_create_direct_conversation(
        self, user1_id: int, user2_id: int
    ) -> ConversationResponse:
        """Get or initialize a direct 1-on-1 conversation with populated details."""
        if user1_id == user2_id:
            raise ValidationError("Cannot create a direct conversation with yourself")

        await self._check_hierarchy_permission(user1_id, user2_id)

        conv = await self.conversation_repo.get_or_create_direct_conversation(
            user1_id, user2_id
        )
        conversations = await self.get_user_conversations(user1_id)
        existing = next((c for c in conversations if c.id == conv.id), None)
        if existing:
            return existing

        conv_full = await self.conversation_repo.get_conversation_with_participants(
            conv.id
        )
        from datetime import datetime

        now = datetime.utcnow()
        return ConversationResponse(
            id=conv.id,
            is_group=False,
            name=None,
            created_at=getattr(conv, "created_at", None) or now,
            updated_at=getattr(conv, "updated_at", None) or now,
            participants=[
                ConversationParticipantResponse.from_orm(p)
                for p in (getattr(conv_full, "participants", []) if conv_full else [])
            ],
            unread_count=0,
        )

    async def create_group_conversation(
        self, creator_id: int, name: str, participant_ids: list[int]
    ) -> Conversation:
        """Create a new group conversation."""
        if not name or not name.strip():
            raise ValidationError("Group conversation name is required")
        if not participant_ids:
            raise ValidationError(
                "Group conversation requires at least one participant"
            )

        return await self.conversation_repo.create_group_conversation(
            name=name.strip(), creator_id=creator_id, participant_ids=participant_ids
        )

    async def get_user_conversations(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[ConversationResponse]:
        """Get all conversations for a user with last message & unread count."""
        conversations = await self.conversation_repo.get_user_conversations(
            user_id, skip=skip, limit=limit
        )

        response_list = []
        for conv in conversations:
            last_msg = await self.message_repo.get_latest_message_for_conversation(
                conv.id
            )
            unread = await self.message_repo.get_unread_count(
                user_id, conversation_id=conv.id
            )

            participants_resp = [
                ConversationParticipantResponse.from_orm(p) for p in conv.participants
            ]
            last_msg_resp = MessageResponse.from_orm(last_msg) if last_msg else None

            response_list.append(
                ConversationResponse(
                    id=conv.id,
                    is_group=conv.is_group,
                    name=conv.name,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    participants=participants_resp,
                    last_message=last_msg_resp,
                    unread_count=unread,
                )
            )

        return response_list

    async def get_conversation_messages(
        self, user_id: int, conversation_id: int, skip: int = 0, limit: int = 50
    ) -> list[Message]:
        """Get messages for a conversation after checking user authorization."""
        conv = await self.conversation_repo.get(conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")

        is_part = await self.conversation_repo.is_participant(conversation_id, user_id)
        if not is_part:
            raise AuthorizationError("You do not have access to this conversation")

        return await self.message_repo.get_conversation_messages(
            conversation_id, skip=skip, limit=limit
        )

    async def mark_conversation_as_read(
        self, user_id: int, conversation_id: int
    ) -> int:
        """Mark all unread messages in a conversation as read for user."""
        conv = await self.conversation_repo.get(conversation_id)
        if not conv:
            raise NotFoundError("Conversation not found")

        is_part = await self.conversation_repo.is_participant(conversation_id, user_id)
        if not is_part:
            raise AuthorizationError("You do not have access to this conversation")

        return await self.message_repo.mark_messages_as_read(conversation_id, user_id)

    async def delete_message(self, message_id: int, user_id: int) -> bool:
        """Delete a message authored by user."""
        success = await self.message_repo.delete_message(message_id, user_id)
        if not success:
            raise NotFoundError(
                "Message not found or you are not authorized to delete it"
            )
        return True

    async def get_unread_summary(self, user_id: int) -> UnreadCountResponse:
        """Get total unread messages count for a user."""
        total = await self.message_repo.get_unread_count(user_id)
        return UnreadCountResponse(total_unread=total)


# Backwards compatibility alias
MessageService = MessagingService
