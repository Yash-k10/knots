from datetime import datetime

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import RoleRequired, get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.events.models.event import EventStatus
from app.events.schemas.event import (
    EventCategoryResponse,
    EventCreate,
    EventLeadsUpdate,
    EventResponse,
    EventUpdate,
    RSVPCreate,
    RSVPResponse,
    RSVPStatusUpdate,
)
from app.events.services.event import EventService
from app.users.models.user import User

router = APIRouter(prefix="/events", tags=["Events"])


# ── Event Listing & Categories ────────────────────────────────────────────────


@router.get("", response_model=APIResponse[list[EventResponse]])
async def list_events(
    status: EventStatus | None = Query(None),
    category_id: int | None = Query(None),
    organizer_id: int | None = Query(None),
    search: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all scheduled events list with filtering and pagination."""
    from app.core.cache import events_cache

    user_id = current_user.id if current_user else None
    cache_key = f"events:{user_id}:{status}:{category_id}:{organizer_id}:{search}:{skip}:{limit}"
    cached = events_cache.get(cache_key)
    if cached is not None:
        return APIResponse(data=cached)

    service = EventService(db)
    events = await service.get_events(
        status=status,
        category_id=category_id,
        organizer_id=organizer_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
        current_user_id=user_id,
    )
    events_cache.set(cache_key, events, ttl_seconds=30.0)
    return APIResponse(data=events)


@router.get("/upcoming", response_model=APIResponse[list[EventResponse]])
async def get_upcoming_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all upcoming published events."""
    from app.core.cache import events_cache

    user_id = current_user.id if current_user else None
    cache_key = f"events_upcoming:{user_id}:{skip}:{limit}"
    cached = events_cache.get(cache_key)
    if cached is not None:
        return APIResponse(data=cached)

    service = EventService(db)
    events = await service.get_upcoming_events(
        skip=skip, limit=limit, current_user_id=user_id
    )
    events_cache.set(cache_key, events, ttl_seconds=30.0)
    return APIResponse(data=events)


@router.get("/categories", response_model=APIResponse[list[EventCategoryResponse]])
async def list_event_categories(
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of all event categories."""
    service = EventService(db)
    categories = await service.list_categories()
    return APIResponse(data=categories)


# ── Event CRUD ────────────────────────────────────────────────────────────────


@router.post("", response_model=APIResponse[EventResponse])
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(
        RoleRequired(
            ["Controller", "Admin", "Super Admin", "Central Admin", "Management"]
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    """Schedule a new college career or collaboration event."""
    service = EventService(db)
    event = await service.create_event(current_user.id, payload)
    # Map to EventResponse by calling get_event_detail to ensure all counts/status are set
    detail = await service.get_event_detail(event.id, current_user_id=current_user.id)
    return APIResponse(message="Event scheduled successfully", data=detail)


@router.get("/{event_id}", response_model=APIResponse[EventResponse])
async def get_event_detail(
    event_id: int = Path(..., ge=1),
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single event with full details."""
    service = EventService(db)
    user_id = current_user.id if current_user else None
    event_detail = await service.get_event_detail(event_id, current_user_id=user_id)
    return APIResponse(data=event_detail)


@router.put("/{event_id}", response_model=APIResponse[EventResponse])
async def update_event(
    event_id: int = Path(..., ge=1),
    payload: EventUpdate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update event details (organizer, controller, or admin)."""
    service = EventService(db)
    await service.update_event(event_id, current_user, payload)
    detail = await service.get_event_detail(event_id, current_user_id=current_user.id)
    return APIResponse(message="Event updated successfully", data=detail)


@router.put("/{event_id}/leads", response_model=APIResponse[EventResponse])
async def update_event_leads(
    event_id: int = Path(..., ge=1),
    payload: EventLeadsUpdate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Appoint or update Event Head and Co-Head (Organizer or Controller only)."""
    service = EventService(db)
    await service.update_event_leads(
        event_id,
        current_user,
        payload.head_id,
        payload.co_head_id,
        payload.faculty_coordinator_id,
    )
    detail = await service.get_event_detail(event_id, current_user_id=current_user.id)
    return APIResponse(message="Event leads updated successfully", data=detail)


@router.delete("/{event_id}", response_model=APIResponse)
async def delete_event(
    event_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an event (organizer, controller, or admin)."""
    service = EventService(db)
    await service.delete_event(event_id, current_user)
    return APIResponse(message="Event deleted successfully")


# ── RSVPs ─────────────────────────────────────────────────────────────────────


@router.post("/{event_id}/rsvp", response_model=APIResponse[RSVPResponse])
async def rsvp_to_event(
    event_id: int = Path(..., ge=1),
    payload: RSVPCreate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update user's RSVP status or join request to an event."""
    service = EventService(db)
    rsvp = await service.rsvp_to_event(event_id, current_user.id, payload)
    return APIResponse(message="RSVP submitted successfully", data=rsvp)


@router.get("/{event_id}/requests", response_model=APIResponse[list[RSVPResponse]])
async def get_event_requests(
    event_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of pending join requests for an event (Event Heads and Controllers only)."""
    service = EventService(db)
    requests = await service.get_event_requests(event_id, current_user)
    return APIResponse(data=requests)


@router.put(
    "/{event_id}/rsvps/{user_id}/status", response_model=APIResponse[RSVPResponse]
)
async def update_rsvp_status(
    event_id: int = Path(..., ge=1),
    user_id: int = Path(..., ge=1),
    payload: RSVPStatusUpdate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept or decline a student's join request to an event."""
    service = EventService(db)
    rsvp = await service.update_rsvp_status(
        event_id, current_user, user_id, payload.status
    )
    return APIResponse(message=f"Request updated to {payload.status.value}", data=rsvp)


@router.delete("/{event_id}/rsvp", response_model=APIResponse)
async def cancel_rsvp(
    event_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel/delete an RSVP record."""
    service = EventService(db)
    await service.cancel_rsvp(event_id, current_user.id)
    return APIResponse(message="RSVP cancelled successfully")


@router.get("/{event_id}/rsvps", response_model=APIResponse[list[RSVPResponse]])
async def list_event_rsvps(
    event_id: int = Path(..., ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of all RSVPs for an event."""
    service = EventService(db)
    rsvps = await service.get_event_rsvps(event_id, skip=skip, limit=limit)
    return APIResponse(data=rsvps)
