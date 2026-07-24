from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.events.models.event import EventStatus
from app.events.schemas.event import (
    EventCategoryResponse,
    EventCreate,
    EventResponse,
    EventUpdate,
    RSVPCreate,
    RSVPResponse,
)
from app.events.services.event import EventService
from app.users.models.user import User

router = APIRouter(prefix="/events", tags=["Events"])


# ── Event Listing & Categories ────────────────────────────────────────────────


@router.get("", response_model=APIResponse[List[EventResponse]])
async def list_events(
    status: Optional[EventStatus] = Query(None),
    category_id: Optional[int] = Query(None),
    organizer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all scheduled events list with filtering and pagination."""
    service = EventService(db)
    user_id = current_user.id if current_user else None
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
    return APIResponse(data=events)


@router.get("/upcoming", response_model=APIResponse[List[EventResponse]])
async def get_upcoming_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all upcoming published events."""
    service = EventService(db)
    user_id = current_user.id if current_user else None
    events = await service.get_upcoming_events(
        skip=skip, limit=limit, current_user_id=user_id
    )
    return APIResponse(data=events)


@router.get("/categories", response_model=APIResponse[List[EventCategoryResponse]])
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
    current_user: User = Depends(get_current_user),
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
    current_user: Optional[User] = Depends(get_current_user),
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
    """Update event details (organizer only)."""
    service = EventService(db)
    await service.update_event(event_id, current_user.id, payload)
    detail = await service.get_event_detail(event_id, current_user_id=current_user.id)
    return APIResponse(message="Event updated successfully", data=detail)


@router.delete("/{event_id}", response_model=APIResponse)
async def delete_event(
    event_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an event (organizer only)."""
    service = EventService(db)
    await service.delete_event(event_id, current_user.id)
    return APIResponse(message="Event deleted successfully")


# ── RSVPs ─────────────────────────────────────────────────────────────────────


@router.post("/{event_id}/rsvp", response_model=APIResponse[RSVPResponse])
async def rsvp_to_event(
    event_id: int = Path(..., ge=1),
    payload: RSVPCreate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update user's RSVP status to an event."""
    service = EventService(db)
    rsvp = await service.rsvp_to_event(event_id, current_user.id, payload)
    return APIResponse(message="RSVP submitted successfully", data=rsvp)


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


@router.get("/{event_id}/rsvps", response_model=APIResponse[List[RSVPResponse]])
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
