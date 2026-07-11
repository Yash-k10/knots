from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.events.models.event import Event


class EventRepository(BaseRepository[Event]):
    def __init__(self, db: AsyncSession):
        super().__init__(Event, db)
