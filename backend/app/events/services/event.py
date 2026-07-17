from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    AuthorizationError,
    ValidationError,
)
from app.events.models.event import Event, EventStatus
from app.events.models.event_category import EventCategory
from app.events.models.rsvp import RSVP, RSVPStatus
from app.events.repository.event import EventRepository
from app.events.repository.event_category import EventCategoryRepository
from app.events.repository.rsvp import RSVPRepository
from app.events.schemas.event import (
    EventCategoryResponse,
    EventCreate,
    EventOrganizerInfo,
    EventResponse,
    EventUpdate,
    RSVPCreate,
)


class EventService:
    """Business-logic layer for Events, Categories, and RSVPs."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.event_repo = EventRepository(db)
        self.category_repo = EventCategoryRepository(db)
        self.rsvp_repo = RSVPRepository(db)

    # ── Event CRUD ────────────────────────────────────────────────────────────

    async def create_event(self, organizer_id: int, payload: EventCreate) -> Event:
        """Create and schedule a new event."""
        # 1. Date/Time checks
        if payload.end_datetime and payload.end_datetime <= payload.start_datetime:
            raise ValidationError(message="End date/time must be after start date/time")

        now = datetime.now(timezone.utc)
        start_dt = payload.start_datetime
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        if start_dt <= now:
            raise ValidationError(message="Event start date/time must be in the future")

        # 2. Category check
        if payload.category_id:
            category = await self.category_repo.get(payload.category_id)
            if not category:
                raise NotFoundError(
                    message=f"Event Category with id {payload.category_id} not found"
                )

        data = payload.model_dump()
        if data.get("start_datetime") and data["start_datetime"].tzinfo:
            data["start_datetime"] = (
                data["start_datetime"].astimezone(timezone.utc).replace(tzinfo=None)
            )
        if data.get("end_datetime") and data["end_datetime"].tzinfo:
            data["end_datetime"] = (
                data["end_datetime"].astimezone(timezone.utc).replace(tzinfo=None)
            )
        data["organizer_id"] = organizer_id
        data["status"] = EventStatus.PUBLISHED
        return await self.event_repo.create(data)

    async def get_event(self, event_id: int) -> Event:
        """Fetch a single raw event or raise NotFoundError."""
        event = await self.event_repo.get(event_id)
        if not event:
            raise NotFoundError(message=f"Event with id {event_id} not found")
        return event

    async def get_event_detail(
        self, event_id: int, current_user_id: Optional[int] = None
    ) -> EventResponse:
        """Fetch an event with full details including RSVP metadata."""
        event = await self.event_repo.get_with_details(event_id)
        if not event:
            raise NotFoundError(message=f"Event with id {event_id} not found")

        # Compute RSVP details
        rsvp_count = await self.rsvp_repo.count_by_event(
            event_id, status=RSVPStatus.GOING
        )

        user_rsvp_status = None
        if current_user_id:
            user_rsvp = await self.rsvp_repo.get_by_event_and_user(
                event_id, current_user_id
            )
            if user_rsvp:
                user_rsvp_status = user_rsvp.status

        organizer_info = None
        if event.organizer:
            organizer_info = EventOrganizerInfo(
                id=event.organizer.id, email=event.organizer.email
            )

        category_info = None
        if event.category:
            category_info = EventCategoryResponse(
                id=event.category.id,
                name=event.category.name,
                description=event.category.description,
            )

        return EventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            location=event.location,
            banner_image_url=event.banner_image_url,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
            max_capacity=event.max_capacity,
            is_rsvp_enabled=event.is_rsvp_enabled,
            status=event.status,
            organizer_id=event.organizer_id,
            organizer=organizer_info,
            category_id=event.category_id,
            category=category_info,
            rsvp_count=rsvp_count,
            user_rsvp_status=user_rsvp_status,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    async def get_events(
        self,
        status: Optional[EventStatus] = None,
        category_id: Optional[int] = None,
        organizer_id: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        current_user_id: Optional[int] = None,
    ) -> List[EventResponse]:
        """Fetch filtered list of events."""
        events = await self.event_repo.get_events_filtered(
            status=status,
            category_id=category_id,
            organizer_id=organizer_id,
            search=search,
            skip=skip,
            limit=limit,
        )

        results: List[EventResponse] = []
        for event in events:
            rsvp_count = await self.rsvp_repo.count_by_event(
                event.id, status=RSVPStatus.GOING
            )

            user_rsvp_status = None
            if current_user_id:
                user_rsvp = await self.rsvp_repo.get_by_event_and_user(
                    event.id, current_user_id
                )
                if user_rsvp:
                    user_rsvp_status = user_rsvp.status

            organizer_info = None
            if event.organizer:
                organizer_info = EventOrganizerInfo(
                    id=event.organizer.id, email=event.organizer.email
                )

            category_info = None
            if event.category:
                category_info = EventCategoryResponse(
                    id=event.category.id,
                    name=event.category.name,
                    description=event.category.description,
                )

            results.append(
                EventResponse(
                    id=event.id,
                    title=event.title,
                    description=event.description,
                    location=event.location,
                    banner_image_url=event.banner_image_url,
                    start_datetime=event.start_datetime,
                    end_datetime=event.end_datetime,
                    max_capacity=event.max_capacity,
                    is_rsvp_enabled=event.is_rsvp_enabled,
                    status=event.status,
                    organizer_id=event.organizer_id,
                    organizer=organizer_info,
                    category_id=event.category_id,
                    category=category_info,
                    rsvp_count=rsvp_count,
                    user_rsvp_status=user_rsvp_status,
                    created_at=event.created_at,
                    updated_at=event.updated_at,
                )
            )
        return results

    async def get_upcoming_events(
        self, skip: int = 0, limit: int = 20, current_user_id: Optional[int] = None
    ) -> List[EventResponse]:
        """Fetch all upcoming published events."""
        events = await self.event_repo.get_upcoming(skip=skip, limit=limit)

        results: List[EventResponse] = []
        for event in events:
            rsvp_count = await self.rsvp_repo.count_by_event(
                event.id, status=RSVPStatus.GOING
            )

            user_rsvp_status = None
            if current_user_id:
                user_rsvp = await self.rsvp_repo.get_by_event_and_user(
                    event.id, current_user_id
                )
                if user_rsvp:
                    user_rsvp_status = user_rsvp.status

            organizer_info = None
            if event.organizer:
                organizer_info = EventOrganizerInfo(
                    id=event.organizer.id, email=event.organizer.email
                )

            category_info = None
            if event.category:
                category_info = EventCategoryResponse(
                    id=event.category.id,
                    name=event.category.name,
                    description=event.category.description,
                )

            results.append(
                EventResponse(
                    id=event.id,
                    title=event.title,
                    description=event.description,
                    location=event.location,
                    banner_image_url=event.banner_image_url,
                    start_datetime=event.start_datetime,
                    end_datetime=event.end_datetime,
                    max_capacity=event.max_capacity,
                    is_rsvp_enabled=event.is_rsvp_enabled,
                    status=event.status,
                    organizer_id=event.organizer_id,
                    organizer=organizer_info,
                    category_id=event.category_id,
                    category=category_info,
                    rsvp_count=rsvp_count,
                    user_rsvp_status=user_rsvp_status,
                    created_at=event.created_at,
                    updated_at=event.updated_at,
                )
            )
        return results

    async def update_event(
        self, event_id: int, organizer_id: int, payload: EventUpdate
    ) -> Event:
        """Update event details (organizer only)."""
        event = await self.get_event(event_id)
        if event.organizer_id != organizer_id:
            raise AuthorizationError(message="You can only update events you organized")

        update_data = payload.model_dump(exclude_unset=True)
        if update_data.get("start_datetime") and update_data["start_datetime"].tzinfo:
            update_data["start_datetime"] = (
                update_data["start_datetime"]
                .astimezone(timezone.utc)
                .replace(tzinfo=None)
            )
        if update_data.get("end_datetime") and update_data["end_datetime"].tzinfo:
            update_data["end_datetime"] = (
                update_data["end_datetime"]
                .astimezone(timezone.utc)
                .replace(tzinfo=None)
            )

        # Date validation if updated
        start_dt = update_data.get("start_datetime", event.start_datetime)
        end_dt = update_data.get("end_datetime", event.end_datetime)
        if end_dt and end_dt <= start_dt:
            raise ValidationError(message="End date/time must be after start date/time")

        # Category check if updated
        category_id = update_data.get("category_id")
        if category_id:
            category = await self.category_repo.get(category_id)
            if not category:
                raise NotFoundError(
                    message=f"Event Category with id {category_id} not found"
                )

        return await self.event_repo.update(event, update_data)

    async def delete_event(self, event_id: int, organizer_id: int) -> None:
        """Delete an event (organizer only)."""
        event = await self.get_event(event_id)
        if event.organizer_id != organizer_id:
            raise AuthorizationError(message="You can only delete events you organized")

        await self.event_repo.remove(event_id)

    # ── RSVPs ─────────────────────────────────────────────────────────────────

    async def rsvp_to_event(
        self, event_id: int, user_id: int, payload: RSVPCreate
    ) -> RSVP:
        """Create or update user's RSVP status to an event."""
        event = await self.get_event(event_id)
        if event.status != EventStatus.PUBLISHED:
            raise ValidationError(
                message="Cannot RSVP to an event that is not published"
            )
        if not event.is_rsvp_enabled:
            raise ValidationError(message="RSVP is disabled for this event")

        # Capacity check if user is going
        if payload.status == RSVPStatus.GOING:
            current_rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, user_id)
            # Only count against capacity if the user wasn't already marked GOING
            if not current_rsvp or current_rsvp.status != RSVPStatus.GOING:
                rsvp_count = await self.rsvp_repo.count_by_event(
                    event_id, status=RSVPStatus.GOING
                )
                if event.max_capacity and rsvp_count >= event.max_capacity:
                    raise ConflictError(
                        message="This event has reached its maximum RSVP capacity"
                    )

        existing_rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, user_id)
        if existing_rsvp:
            update_data = payload.model_dump(exclude_unset=True)
            return await self.rsvp_repo.update(existing_rsvp, update_data)

        rsvp_data = payload.model_dump()
        rsvp_data["event_id"] = event_id
        rsvp_data["user_id"] = user_id
        return await self.rsvp_repo.create(rsvp_data)

    async def cancel_rsvp(self, event_id: int, user_id: int) -> None:
        """Cancel/delete an RSVP record."""
        await self.get_event(event_id)
        existing_rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, user_id)
        if not existing_rsvp:
            raise NotFoundError(message="You have not RSVPed to this event")

        await self.rsvp_repo.remove(existing_rsvp.id)

    async def get_event_rsvps(
        self, event_id: int, skip: int = 0, limit: int = 100
    ) -> List[RSVP]:
        """Get all RSVPs for an event (oldest first)."""
        await self.get_event(event_id)
        return await self.rsvp_repo.get_by_event(event_id, skip=skip, limit=limit)

    # ── Categories ────────────────────────────────────────────────────────────

    async def list_categories(self) -> List[EventCategory]:
        """List all event categories."""
        return await self.category_repo.get_all_categories()
