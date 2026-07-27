from datetime import datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.messaging.models.conversation import Conversation, ConversationParticipant
from app.messaging.models.message import Message
from app.messaging.models.read_receipt import ReadReceipt


class MessageRepository(BaseRepository[Message]):
    def __init__(self, db: AsyncSession):
        super().__init__(Message, db)

    async def create_message(
        self,
        sender_id: int,
        content: str,
        conversation_id: int | None = None,
        receiver_id: int | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        self.db.add(message)
        await self.db.flush()

        if conversation_id:
            conv = await self.db.get(Conversation, conversation_id)
            if conv:
                conv.updated_at = datetime.utcnow()
                self.db.add(conv)
                await self.db.flush()

        return message

    async def get_conversation_messages(
        self, conversation_id: int, skip: int = 0, limit: int = 50
    ) -> list[Message]:
        stmt = (
            select(self.model)
            .where(self.model.conversation_id == conversation_id)
            .order_by(self.model.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_direct_messages(
        self, user1_id: int, user2_id: int, skip: int = 0, limit: int = 50
    ) -> list[Message]:
        stmt = (
            select(self.model)
            .where(
                or_(
                    and_(
                        self.model.sender_id == user1_id,
                        self.model.receiver_id == user2_id,
                    ),
                    and_(
                        self.model.sender_id == user2_id,
                        self.model.receiver_id == user1_id,
                    ),
                )
            )
            .order_by(self.model.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_message_for_conversation(
        self, conversation_id: int
    ) -> Message | None:
        stmt = (
            select(self.model)
            .where(self.model.conversation_id == conversation_id)
            .order_by(self.model.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def mark_messages_as_read(self, conversation_id: int, user_id: int) -> int:
        now = datetime.utcnow()

        # Update unread messages in conversation where sender is not user_id
        stmt = select(self.model).where(
            and_(
                self.model.conversation_id == conversation_id,
                self.model.sender_id != user_id,
                self.model.is_read == False,
            )
        )
        result = await self.db.execute(stmt)
        unread_messages = list(result.scalars().all())

        count = 0
        for msg in unread_messages:
            msg.is_read = True
            msg.read_at = now
            self.db.add(msg)
            count += 1

            # Insert ReadReceipt if not exists
            receipt_stmt = select(ReadReceipt).where(
                and_(ReadReceipt.message_id == msg.id, ReadReceipt.user_id == user_id)
            )
            existing_receipt = (await self.db.execute(receipt_stmt)).scalars().first()
            if not existing_receipt:
                receipt = ReadReceipt(message_id=msg.id, user_id=user_id, read_at=now)
                self.db.add(receipt)

        # Update last_read_at on ConversationParticipant
        participant_stmt = select(ConversationParticipant).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
        participant = (await self.db.execute(participant_stmt)).scalars().first()
        if participant:
            participant.last_read_at = now
            self.db.add(participant)

        await self.db.flush()
        return count

    async def get_unread_count(
        self, user_id: int, conversation_id: int | None = None
    ) -> int:
        conditions = [
            self.model.sender_id != user_id,
            self.model.is_read == False,
        ]

        if conversation_id:
            conditions.append(self.model.conversation_id == conversation_id)
        else:
            # Only count messages in conversations where user is a participant or receiver_id == user_id
            participant_convs = select(ConversationParticipant.conversation_id).where(
                ConversationParticipant.user_id == user_id
            )
            conditions.append(
                or_(
                    self.model.receiver_id == user_id,
                    self.model.conversation_id.in_(participant_convs),
                )
            )

        stmt = select(func.count(self.model.id)).where(and_(*conditions))
        result = await self.db.execute(stmt)
        return result.scalar_one()
