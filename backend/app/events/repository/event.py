from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.events.models.event import Event, EventStatus


class EventRepository(BaseRepository[Event]):
    """Repository for Event CRUD and filtered queries."""

    def __init__(self, db: AsyncSession):
        super().__init__(Event, db)

    async def get_with_details(self, event_id: int) -> Optional[Event]:
        """Fetch a single event with organizer, category, and RSVPs."""
        result = await self.db.execute(
            select(Event)
            .options(
                selectinload(Event.organizer),
                selectinload(Event.category),
                selectinload(Event.rsvps),
            )
            .filter(Event.id == event_id)
        )
        return result.scalars().first()

    async def get_upcoming(self, skip: int = 0, limit: int = 20) -> List[Event]:
        """Fetch upcoming published events (start_datetime in the future)."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Event)
            .options(
                selectinload(Event.organizer),
                selectinload(Event.category),
                selectinload(Event.rsvps),
            )
            .filter(
                Event.status == EventStatus.PUBLISHED,
                Event.start_datetime > now,
            )
            .order_by(Event.start_datetime.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_by_status(
        self, status: EventStatus, skip: int = 0, limit: int = 20
    ) -> List[Event]:
        """Fetch events filtered by status."""
        result = await self.db.execute(
            select(Event)
            .options(
                selectinload(Event.organizer),
                selectinload(Event.category),
            )
            .filter(Event.status == status)
            .order_by(Event.start_datetime.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_by_category(
        self, category_id: int, skip: int = 0, limit: int = 20
    ) -> List[Event]:
        """Fetch events filtered by category."""
        result = await self.db.execute(
            select(Event)
            .options(
                selectinload(Event.organizer),
                selectinload(Event.category),
                selectinload(Event.rsvps),
            )
            .filter(
                Event.category_id == category_id,
                Event.status == EventStatus.PUBLISHED,
            )
            .order_by(Event.start_datetime.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_by_organizer(
        self, organizer_id: int, skip: int = 0, limit: int = 20
    ) -> List[Event]:
        """Fetch events created by a specific organizer."""
        result = await self.db.execute(
            select(Event)
            .options(
                selectinload(Event.category),
                selectinload(Event.rsvps),
            )
            .filter(Event.organizer_id == organizer_id)
            .order_by(Event.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_events_filtered(
        self,
        status: Optional[EventStatus] = None,
        category_id: Optional[int] = None,
        organizer_id: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Event]:
        """Fetch all events with details under the specified filters."""
        query = select(Event).options(
            selectinload(Event.organizer),
            selectinload(Event.category),
            selectinload(Event.rsvps),
        )
        if status:
            query = query.filter(Event.status == status)
        if category_id:
            query = query.filter(Event.category_id == category_id)
        if organizer_id:
            query = query.filter(Event.organizer_id == organizer_id)
        if search:
            query = query.filter(
                (Event.title.ilike(f"%{search}%"))
                | (Event.description.ilike(f"%{search}%"))
            )

        query = query.order_by(Event.start_datetime.asc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().unique().all())

    async def count_filtered(
        self,
        status: Optional[EventStatus] = None,
        category_id: Optional[int] = None,
        organizer_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> int:
        """Count events under the specified filters."""
        query = select(func.count()).select_from(Event)
        if status:
            query = query.filter(Event.status == status)
        if category_id:
            query = query.filter(Event.category_id == category_id)
        if organizer_id:
            query = query.filter(Event.organizer_id == organizer_id)
        if search:
            query = query.filter(
                (Event.title.ilike(f"%{search}%"))
                | (Event.description.ilike(f"%{search}%"))
            )
        result = await self.db.execute(query)
        return result.scalar_one()
