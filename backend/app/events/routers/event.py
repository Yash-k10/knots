from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import get_current_user
from app.events.schemas.event import EventCreate, EventResponse
from app.events.services.event import EventService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=APIResponse[EventResponse])
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule a new college career or collaboration event."""
    service = EventService(db)
    event = await service.create_event(current_user.id, payload)
    return APIResponse(message="Event scheduled successfully", data=event)


@router.get("", response_model=APIResponse[List[EventResponse]])
async def read_events(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    """Retrieve scheduled events list with pagination."""
    service = EventService(db)
    events = await service.list_events(skip=skip, limit=limit)
    return APIResponse(data=events)
