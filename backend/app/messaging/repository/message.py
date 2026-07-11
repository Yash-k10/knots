from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.messaging.models.message import Message


class MessageRepository(BaseRepository[Message]):
    def __init__(self, db: AsyncSession):
        super().__init__(Message, db)
