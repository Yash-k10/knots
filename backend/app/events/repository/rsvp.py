from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.events.models.rsvp import RSVP, RSVPStatus


from app.users.models.user import User


class RSVPRepository(BaseRepository[RSVP]):
    """Repository for RSVP operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(RSVP, db)

    async def get_with_user(self, rsvp_id: int) -> RSVP | None:
        """Fetch RSVP with user and profile relationships eagerly loaded."""
        result = await self.db.execute(
            select(RSVP)
            .options(selectinload(RSVP.user).selectinload(User.profile))
            .filter(RSVP.id == rsvp_id)
        )
        return result.scalars().first()

    async def get_by_event_and_user(self, event_id: int, user_id: int) -> RSVP | None:
        """Find an existing RSVP by a specific user for a specific event."""
        result = await self.db.execute(
            select(RSVP)
            .options(selectinload(RSVP.user).selectinload(User.profile))
            .filter(and_(RSVP.event_id == event_id, RSVP.user_id == user_id))
        )
        return result.scalars().first()

    async def get_by_event(
        self, event_id: int, skip: int = 0, limit: int = 100
    ) -> list[RSVP]:
        """Fetch all RSVPs for an event, ordered by creation date."""
        result = await self.db.execute(
            select(RSVP)
            .options(selectinload(RSVP.user).selectinload(User.profile))
            .filter(RSVP.event_id == event_id)
            .order_by(RSVP.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_pending_by_event(self, event_id: int) -> list[RSVP]:
        """Fetch all PENDING join requests for an event."""
        result = await self.db.execute(
            select(RSVP)
            .options(selectinload(RSVP.user).selectinload(User.profile))
            .filter(
                RSVP.event_id == event_id,
                RSVP.status == RSVPStatus.PENDING,
            )
            .order_by(RSVP.created_at.asc())
        )
        return list(result.scalars().all())

    async def count_by_event(
        self, event_id: int, status: RSVPStatus | None = None
    ) -> int:
        """Count RSVPs for an event, optionally filtered by status."""
        query = select(func.count()).select_from(RSVP).filter(RSVP.event_id == event_id)
        if status:
            query = query.filter(RSVP.status == status)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_rsvp_counts_for_events(
        self, event_ids: list[int]
    ) -> dict[int, dict[str, int]]:
        """Batch-fetch RSVP counts for multiple events in a single SQL query."""
        if not event_ids:
            return {}
        query = (
            select(RSVP.event_id, RSVP.status, func.count(RSVP.id))
            .filter(RSVP.event_id.in_(event_ids))
            .group_by(RSVP.event_id, RSVP.status)
        )
        result = await self.db.execute(query)
        counts: dict[int, dict[str, int]] = {
            eid: {"going": 0, "pending": 0} for eid in event_ids
        }
        for eid, status, cnt in result.all():
            if eid in counts:
                if status == RSVPStatus.GOING:
                    counts[eid]["going"] = cnt
                elif status == RSVPStatus.PENDING:
                    counts[eid]["pending"] = cnt
        return counts

    async def get_user_rsvps_for_events(
        self, event_ids: list[int], user_id: int
    ) -> dict[int, RSVPStatus]:
        """Batch-fetch current user's RSVP status across multiple events in a single query."""
        if not event_ids or not user_id:
            return {}
        query = select(RSVP.event_id, RSVP.status).filter(
            RSVP.event_id.in_(event_ids), RSVP.user_id == user_id
        )
        result = await self.db.execute(query)
        return {row[0]: row[1] for row in result.all()}
