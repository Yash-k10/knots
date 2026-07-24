from typing import List, Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.events.models.rsvp import RSVP, RSVPStatus


class RSVPRepository(BaseRepository[RSVP]):
    """Repository for RSVP operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(RSVP, db)

    async def get_with_user(self, rsvp_id: int) -> Optional[RSVP]:
        """Fetch RSVP with user relationship eagerly loaded."""
        result = await self.db.execute(
            select(RSVP).options(selectinload(RSVP.user)).filter(RSVP.id == rsvp_id)
        )
        return result.scalars().first()

    async def get_by_event_and_user(
        self, event_id: int, user_id: int
    ) -> Optional[RSVP]:
        """Find an existing RSVP by a specific user for a specific event."""
        result = await self.db.execute(
            select(RSVP).filter(
                and_(RSVP.event_id == event_id, RSVP.user_id == user_id)
            )
        )
        return result.scalars().first()

    async def get_by_event(
        self, event_id: int, skip: int = 0, limit: int = 100
    ) -> List[RSVP]:
        """Fetch all RSVPs for an event, ordered by creation date."""
        result = await self.db.execute(
            select(RSVP)
            .options(selectinload(RSVP.user))
            .filter(RSVP.event_id == event_id)
            .order_by(RSVP.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_event(
        self, event_id: int, status: Optional[RSVPStatus] = None
    ) -> int:
        """Count RSVPs for an event, optionally filtered by status."""
        query = select(func.count()).select_from(RSVP).filter(RSVP.event_id == event_id)
        if status:
            query = query.filter(RSVP.status == status)
        result = await self.db.execute(query)
        return result.scalar_one()
