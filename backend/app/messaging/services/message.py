from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, AuthorizationError, ValidationError
from app.messaging.models.message import Message
from app.messaging.models.conversation import Conversation
from app.messaging.repository.message import MessageRepository
from app.messaging.repository.conversation import ConversationRepository
from app.messaging.schemas.message import MessageCreate, DirectMessageCreate
from app.messaging.schemas.conversation import (
    ConversationResponse,
    ConversationParticipantResponse,
    UnreadCountResponse,
)
from app.messaging.schemas.message import MessageResponse


class MessagingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.message_repo = MessageRepository(db)
        self.conversation_repo = ConversationRepository(db)

    async def send_message(self, sender_id: int, msg_in: MessageCreate) -> Message:
        """Send a message to a conversation or direct recipient."""
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
        elif receiver_id:
            if sender_id == receiver_id:
                raise ValidationError("Cannot send a direct message to yourself")

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

    async def create_group_conversation(
        self, creator_id: int, name: str, participant_ids: List[int]
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
    ) -> List[ConversationResponse]:
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
    ) -> List[Message]:
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

    async def get_unread_summary(self, user_id: int) -> UnreadCountResponse:
        """Get total unread messages count for a user."""
        total = await self.message_repo.get_unread_count(user_id)
        return UnreadCountResponse(total_unread=total)


# Backwards compatibility alias
MessageService = MessagingService
