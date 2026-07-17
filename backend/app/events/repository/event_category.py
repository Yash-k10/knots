from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.events.models.event_category import EventCategory


class EventCategoryRepository(BaseRepository[EventCategory]):
    """Repository for EventCategory operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(EventCategory, db)

    async def get_by_name(self, name: str) -> Optional[EventCategory]:
        """Fetch event category by its name."""
        result = await self.db.execute(
            select(EventCategory).filter(EventCategory.name == name)
        )
        return result.scalars().first()

    async def get_all_categories(self) -> List[EventCategory]:
        """Fetch all event categories sorted by name."""
        result = await self.db.execute(
            select(EventCategory).order_by(EventCategory.name.asc())
        )
        return list(result.scalars().all())
