from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.messaging.models.conversation import Conversation, ConversationParticipant
from app.users.models.user import User


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, db: AsyncSession):
        super().__init__(Conversation, db)

    async def get_conversation_with_participants(
        self, conversation_id: int
    ) -> Conversation | None:
        stmt = (
            select(self.model)
            .options(
                selectinload(self.model.participants)
                .selectinload(ConversationParticipant.user)
                .selectinload(User.role)
            )
            .where(self.model.id == conversation_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def is_participant(self, conversation_id: int, user_id: int) -> bool:
        stmt = select(ConversationParticipant).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first() is not None

    async def get_or_create_direct_conversation(
        self, user1_id: int, user2_id: int
    ) -> Conversation:
        # Find existing non-group conversation with both users
        p1 = select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == user1_id
        )
        p2 = select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == user2_id
        )

        stmt = (
            select(self.model)
            .options(selectinload(self.model.participants))
            .where(
                and_(
                    self.model.is_group == False,
                    self.model.id.in_(p1),
                    self.model.id.in_(p2),
                )
            )
        )
        result = await self.db.execute(stmt)
        existing = result.scalars().first()

        if existing:
            return existing

        # Create new direct conversation
        new_conv = Conversation(is_group=False)
        self.db.add(new_conv)
        await self.db.flush()

        part1 = ConversationParticipant(conversation_id=new_conv.id, user_id=user1_id)
        part2 = ConversationParticipant(conversation_id=new_conv.id, user_id=user2_id)
        self.db.add_all([part1, part2])
        await self.db.flush()

        return await self.get_conversation_with_participants(new_conv.id)

    async def create_group_conversation(
        self, name: str, creator_id: int, participant_ids: list[int]
    ) -> Conversation:
        all_ids = set(participant_ids)
        all_ids.add(creator_id)

        new_conv = Conversation(is_group=True, name=name)
        self.db.add(new_conv)
        await self.db.flush()

        participants = [
            ConversationParticipant(conversation_id=new_conv.id, user_id=uid)
            for uid in all_ids
        ]
        self.db.add_all(participants)
        await self.db.flush()

        return await self.get_conversation_with_participants(new_conv.id)

    async def get_user_conversations(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Conversation]:
        subq = select(ConversationParticipant.conversation_id).where(
            ConversationParticipant.user_id == user_id
        )

        stmt = (
            select(self.model)
            .options(
                selectinload(self.model.participants)
                .selectinload(ConversationParticipant.user)
                .selectinload(User.role)
            )
            .where(self.model.id.in_(subq))
            .order_by(self.model.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
