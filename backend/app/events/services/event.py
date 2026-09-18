from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
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
    EventLeadUser,
    EventOrganizerInfo,
    EventResponse,
    EventUpdate,
    RSVPCreate,
    RSVPResponse,
    RSVPUserInfo,
)
from app.users.models.user import User


def _map_lead_user(user: User | None) -> EventLeadUser | None:
    if not user:
        return None
    prof = getattr(user, "profile", None)
    role_obj = getattr(user, "role", None)
    return EventLeadUser(
        id=user.id,
        email=user.email,
        first_name=prof.first_name if prof else None,
        last_name=prof.last_name if prof else None,
        department=prof.department if prof else None,
        graduation_year=prof.graduation_year if prof else None,
        profile_picture=prof.profile_picture if prof else None,
        role_name=role_obj.name if role_obj else None,
    )


def _map_rsvp_user(user: User | None) -> RSVPUserInfo | None:
    if not user:
        return None
    prof = getattr(user, "profile", None)
    return RSVPUserInfo(
        id=user.id,
        email=user.email,
        first_name=prof.first_name if prof else None,
        last_name=prof.last_name if prof else None,
        department=prof.department if prof else None,
        graduation_year=prof.graduation_year if prof else None,
        profile_picture=prof.profile_picture if prof else None,
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

        # 3. Head / Co-Head validation if specified
        if payload.head_id:
            head_user = await self.db.get(User, payload.head_id)
            if not head_user:
                raise NotFoundError(
                    message=f"Appointed Event Head user id {payload.head_id} not found"
                )
        if payload.co_head_id:
            co_head_user = await self.db.get(User, payload.co_head_id)
            if not co_head_user:
                raise NotFoundError(
                    message=f"Appointed Event Co-Head user id {payload.co_head_id} not found"
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
        self, event_id: int, current_user_id: int | None = None
    ) -> EventResponse:
        """Fetch an event with full details including RSVP metadata."""
        event = await self.event_repo.get_with_details(event_id)
        if not event:
            raise NotFoundError(message=f"Event with id {event_id} not found")

        # Compute RSVP details
        rsvp_count = await self.rsvp_repo.count_by_event(
            event_id, status=RSVPStatus.GOING
        )
        pending_count = await self.rsvp_repo.count_by_event(
            event_id, status=RSVPStatus.PENDING
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
            google_form_url=event.google_form_url,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
            max_capacity=event.max_capacity,
            is_rsvp_enabled=event.is_rsvp_enabled,
            status=event.status,
            organizer_id=event.organizer_id,
            organizer=organizer_info,
            category_id=event.category_id,
            category=category_info,
            head_id=event.head_id,
            co_head_id=event.co_head_id,
            head=_map_lead_user(event.head),
            co_head=_map_lead_user(event.co_head),
            rsvp_count=rsvp_count,
            pending_requests_count=pending_count,
            user_rsvp_status=user_rsvp_status,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    async def get_events(
        self,
        status: EventStatus | None = None,
        category_id: int | None = None,
        organizer_id: int | None = None,
        search: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        skip: int = 0,
        limit: int = 20,
        current_user_id: int | None = None,
    ) -> list[EventResponse]:
        """Fetch filtered list of events."""
        if start_date and start_date.tzinfo:
            start_date = start_date.astimezone(timezone.utc).replace(tzinfo=None)
        if end_date and end_date.tzinfo:
            end_date = end_date.astimezone(timezone.utc).replace(tzinfo=None)

        events = await self.event_repo.get_events_filtered(
            status=status,
            category_id=category_id,
            organizer_id=organizer_id,
            search=search,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit,
        )

        results: list[EventResponse] = []
        for event in events:
            rsvp_count = await self.rsvp_repo.count_by_event(
                event.id, status=RSVPStatus.GOING
            )
            pending_count = await self.rsvp_repo.count_by_event(
                event.id, status=RSVPStatus.PENDING
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
                    google_form_url=event.google_form_url,
                    start_datetime=event.start_datetime,
                    end_datetime=event.end_datetime,
                    max_capacity=event.max_capacity,
                    is_rsvp_enabled=event.is_rsvp_enabled,
                    status=event.status,
                    organizer_id=event.organizer_id,
                    organizer=organizer_info,
                    category_id=event.category_id,
                    category=category_info,
                    head_id=event.head_id,
                    co_head_id=event.co_head_id,
                    head=_map_lead_user(event.head),
                    co_head=_map_lead_user(event.co_head),
                    rsvp_count=rsvp_count,
                    pending_requests_count=pending_count,
                    user_rsvp_status=user_rsvp_status,
                    created_at=event.created_at,
                    updated_at=event.updated_at,
                )
            )
        return results

    async def get_upcoming_events(
        self, skip: int = 0, limit: int = 20, current_user_id: int | None = None
    ) -> list[EventResponse]:
        """Fetch all upcoming published events."""
        events = await self.event_repo.get_upcoming(skip=skip, limit=limit)

        results: list[EventResponse] = []
        for event in events:
            rsvp_count = await self.rsvp_repo.count_by_event(
                event.id, status=RSVPStatus.GOING
            )
            pending_count = await self.rsvp_repo.count_by_event(
                event.id, status=RSVPStatus.PENDING
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
                    google_form_url=event.google_form_url,
                    start_datetime=event.start_datetime,
                    end_datetime=event.end_datetime,
                    max_capacity=event.max_capacity,
                    is_rsvp_enabled=event.is_rsvp_enabled,
                    status=event.status,
                    organizer_id=event.organizer_id,
                    organizer=organizer_info,
                    category_id=event.category_id,
                    category=category_info,
                    head_id=event.head_id,
                    co_head_id=event.co_head_id,
                    head=_map_lead_user(event.head),
                    co_head=_map_lead_user(event.co_head),
                    rsvp_count=rsvp_count,
                    pending_requests_count=pending_count,
                    user_rsvp_status=user_rsvp_status,
                    created_at=event.created_at,
                    updated_at=event.updated_at,
                )
            )
        return results

    async def update_event(
        self, event_id: int, current_user: User, payload: EventUpdate
    ) -> Event:
        """Update event details (organizer, controller, or admin only)."""
        event = await self.get_event(event_id)
        role_name = current_user.role.name.lower().strip() if current_user.role else ""
        is_authorized = event.organizer_id == current_user.id or role_name in [
            "controller",
            "admin",
            "super admin",
            "superadmin",
            "management",
            "central admin",
        ]
        if not is_authorized:
            raise AuthorizationError(
                message="You can only update events you organized or manage"
            )

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

        # Head / Co-Head check if updated
        if "head_id" in update_data and update_data["head_id"]:
            head_user = await self.db.get(User, update_data["head_id"])
            if not head_user:
                raise NotFoundError(
                    message=f"Student id {update_data['head_id']} not found"
                )
        if "co_head_id" in update_data and update_data["co_head_id"]:
            co_head_user = await self.db.get(User, update_data["co_head_id"])
            if not co_head_user:
                raise NotFoundError(
                    message=f"Student id {update_data['co_head_id']} not found"
                )

        return await self.event_repo.update(event, update_data)

    async def update_event_leads(
        self,
        event_id: int,
        current_user: User,
        head_id: int | None,
        co_head_id: int | None,
    ) -> Event:
        """Appoint or update Event Head and Co-Head (Organizer, Controller, or Admin)."""
        event = await self.get_event(event_id)
        role_name = current_user.role.name.lower().strip() if current_user.role else ""
        is_authorized = event.organizer_id == current_user.id or role_name in [
            "controller",
            "admin",
            "super admin",
            "superadmin",
            "management",
            "central admin",
        ]
        if not is_authorized:
            raise AuthorizationError(
                message="Only the organizer or controller can appoint event leads"
            )

        if head_id:
            h_user = await self.db.get(User, head_id)
            if not h_user:
                raise NotFoundError(message=f"Student id {head_id} not found")
        if co_head_id:
            c_user = await self.db.get(User, co_head_id)
            if not c_user:
                raise NotFoundError(message=f"Student id {co_head_id} not found")

        updated = await self.event_repo.update(
            event, {"head_id": head_id, "co_head_id": co_head_id}
        )

        # Notify appointed students
        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)
        if head_id and head_id != current_user.id:
            await notif_service.create_notification(
                user_id=head_id,
                title="Appointed as Event Head! 🎖️",
                content=f"You have been appointed as the Event Head for '{event.title}'. You now have powers to manage attendees and join requests.",
                type="event_role",
            )
        if co_head_id and co_head_id != current_user.id:
            await notif_service.create_notification(
                user_id=co_head_id,
                title="Appointed as Event Co-Head! 🎖️",
                content=f"You have been appointed as the Event Co-Head for '{event.title}'. You can now review and approve student join requests.",
                type="event_role",
            )

        return updated

    async def delete_event(self, event_id: int, current_user: User) -> None:
        """Delete an event (organizer, controller, or admin only)."""
        event = await self.get_event(event_id)
        role_name = current_user.role.name.lower().strip() if current_user.role else ""
        is_authorized = event.organizer_id == current_user.id or role_name in [
            "controller",
            "admin",
            "super admin",
            "superadmin",
            "management",
            "central admin",
        ]
        if not is_authorized:
            raise AuthorizationError(
                message="You can only delete events you organized or manage"
            )

        await self.event_repo.remove(event_id)

    # ── RSVPs & Join Requests ──────────────────────────────────────────────────

    async def rsvp_to_event(
        self, event_id: int, user_id: int, payload: RSVPCreate
    ) -> RSVP:
        """Create or update user's RSVP status / join request to an event."""
        event = await self.get_event(event_id)
        if event.status != EventStatus.PUBLISHED:
            raise ValidationError(
                message="Cannot RSVP to an event that is not published"
            )
        if not event.is_rsvp_enabled:
            raise ValidationError(message="RSVP is disabled for this event")

        # Capacity check if user is marked GOING
        if payload.status == RSVPStatus.GOING:
            current_rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, user_id)
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
            rsvp = await self.rsvp_repo.update(existing_rsvp, update_data)
        else:
            rsvp_data = payload.model_dump()
            rsvp_data["event_id"] = event_id
            rsvp_data["user_id"] = user_id
            rsvp = await self.rsvp_repo.create(rsvp_data)

        # Eagerly load the user and profile
        result_rsvp = await self.rsvp_repo.get_with_user(rsvp.id)

        # Notify Event Organizer, Event Head, and Event Co-Head
        from app.notifications.services.notification import NotificationService
        from app.profiles.repository.profile import ProfileRepository

        prof_repo = ProfileRepository(self.db)
        rsvper_prof = await prof_repo.get_by_user_id(user_id)
        rsvper_name = (
            f"{rsvper_prof.first_name} {rsvper_prof.last_name}"
            if (rsvper_prof and rsvper_prof.first_name)
            else "A student"
        )
        status_label = (
            "requested to join"
            if payload.status == RSVPStatus.PENDING
            else "is attending"
        )

        leads_to_notify = {event.organizer_id}
        if event.head_id:
            leads_to_notify.add(event.head_id)
        if event.co_head_id:
            leads_to_notify.add(event.co_head_id)
        leads_to_notify.discard(user_id)

        notif_service = NotificationService(self.db)
        for lead_id in leads_to_notify:
            await notif_service.create_notification(
                user_id=lead_id,
                title=(
                    "New Event Registration Request"
                    if payload.status == RSVPStatus.PENDING
                    else "New Event RSVP"
                ),
                content=f"{rsvper_name} {status_label} your event: {event.title}",
                type="event_rsvp",
            )

        return result_rsvp

    async def update_rsvp_status(
        self,
        event_id: int,
        current_user: User,
        target_user_id: int,
        new_status: RSVPStatus,
    ) -> RSVPResponse:
        """Approve or decline a student's join request (Event Head, Co-Head, Organizer, Controller)."""
        event = await self.get_event(event_id)
        role_name = current_user.role.name.lower().strip() if current_user.role else ""

        is_authorized = (
            event.organizer_id == current_user.id
            or event.head_id == current_user.id
            or event.co_head_id == current_user.id
            or role_name
            in [
                "controller",
                "admin",
                "super admin",
                "superadmin",
                "management",
                "central admin",
            ]
        )
        if not is_authorized:
            raise AuthorizationError(
                message="Only Event Head, Co-Head, Controller, or Organizer can manage join requests"
            )

        rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, target_user_id)
        if not rsvp:
            raise NotFoundError(
                message=f"No registration request found for user id {target_user_id}"
            )

        # Capacity check if approving to GOING
        if new_status == RSVPStatus.GOING and rsvp.status != RSVPStatus.GOING:
            rsvp_count = await self.rsvp_repo.count_by_event(
                event_id, status=RSVPStatus.GOING
            )
            if event.max_capacity and rsvp_count >= event.max_capacity:
                raise ConflictError(message="Event has reached maximum capacity")

        updated_rsvp = await self.rsvp_repo.update(rsvp, {"status": new_status})
        loaded = await self.rsvp_repo.get_with_user(updated_rsvp.id)

        # Notify student about decision
        from app.notifications.services.notification import NotificationService

        notif_service = NotificationService(self.db)
        if new_status == RSVPStatus.GOING:
            title_msg = "Invitation Accepted! 🎉"
            content_msg = f"Your request to join '{event.title}' was approved. You are now enrolled as an attendee!"
        else:
            title_msg = "Event Request Update"
            content_msg = (
                f"Your request to join '{event.title}' was declined by the organizers."
            )

        await notif_service.create_notification(
            user_id=target_user_id,
            title=title_msg,
            content=content_msg,
            type="event_rsvp",
        )

        return RSVPResponse(
            id=loaded.id,
            event_id=loaded.event_id,
            user_id=loaded.user_id,
            user=_map_rsvp_user(loaded.user),
            status=loaded.status,
            note=loaded.note,
            created_at=loaded.created_at,
            updated_at=loaded.updated_at,
        )

    async def get_event_requests(
        self, event_id: int, current_user: User
    ) -> list[RSVPResponse]:
        """Fetch all PENDING join requests for an event (leads only)."""
        event = await self.get_event(event_id)
        role_name = current_user.role.name.lower().strip() if current_user.role else ""

        is_authorized = (
            event.organizer_id == current_user.id
            or event.head_id == current_user.id
            or event.co_head_id == current_user.id
            or role_name
            in [
                "controller",
                "admin",
                "super admin",
                "superadmin",
                "management",
                "central admin",
            ]
        )
        if not is_authorized:
            raise AuthorizationError(
                message="Only Event Head, Co-Head, Controller, or Organizer can view pending requests"
            )

        pending_list = await self.rsvp_repo.get_pending_by_event(event_id)
        return [
            RSVPResponse(
                id=r.id,
                event_id=r.event_id,
                user_id=r.user_id,
                user=_map_rsvp_user(r.user),
                status=r.status,
                note=r.note,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in pending_list
        ]

    async def cancel_rsvp(self, event_id: int, user_id: int) -> None:
        """Cancel/delete an RSVP record."""
        await self.get_event(event_id)
        existing_rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, user_id)
        if not existing_rsvp:
            raise NotFoundError(message="You have not RSVPed to this event")

        await self.rsvp_repo.remove(existing_rsvp.id)

    async def get_event_rsvps(
        self, event_id: int, skip: int = 0, limit: int = 100
    ) -> list[RSVPResponse]:
        """Get all RSVPs for an event with user profiles."""
        await self.get_event(event_id)
        rsvps = await self.rsvp_repo.get_by_event(event_id, skip=skip, limit=limit)
        return [
            RSVPResponse(
                id=r.id,
                event_id=r.event_id,
                user_id=r.user_id,
                user=_map_rsvp_user(r.user),
                status=r.status,
                note=r.note,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in rsvps
        ]

    # ── Categories ────────────────────────────────────────────────────────────

    async def list_categories(self) -> list[EventCategory]:
        """List all event categories."""
        return await self.category_repo.get_all_categories()
