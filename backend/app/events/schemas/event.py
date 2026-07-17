from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.events.models.event import EventStatus
from app.events.models.rsvp import RSVPStatus

# ── Event Category Schemas ───────────────────────────────────────────────────


class EventCategoryResponse(BaseModel):
    """API response for an event category."""

    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ── RSVP Schemas ─────────────────────────────────────────────────────────────


class RSVPCreate(BaseModel):
    """Payload to RSVP to an event."""

    status: RSVPStatus = RSVPStatus.GOING
    note: Optional[str] = Field(None, max_length=300)


class RSVPUpdate(BaseModel):
    """Payload to update an existing RSVP."""

    status: Optional[RSVPStatus] = None
    note: Optional[str] = Field(None, max_length=300)


class RSVPUserInfo(BaseModel):
    """Compact user info embedded in RSVP responses."""

    id: int
    email: str

    class Config:
        from_attributes = True


class RSVPResponse(BaseModel):
    """API response for a single RSVP."""

    id: int
    event_id: int
    user_id: int
    user: Optional[RSVPUserInfo] = None
    status: RSVPStatus
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Event Schemas ────────────────────────────────────────────────────────────


class EventCreate(BaseModel):
    """Payload to create a new event."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    location: Optional[str] = Field(None, max_length=300)
    banner_image_url: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    max_capacity: Optional[int] = Field(None, ge=1)
    is_rsvp_enabled: bool = True
    category_id: Optional[int] = None


class EventUpdate(BaseModel):
    """Payload to update an existing event (all fields optional)."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=300)
    banner_image_url: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    max_capacity: Optional[int] = Field(None, ge=1)
    is_rsvp_enabled: Optional[bool] = None
    status: Optional[EventStatus] = None
    category_id: Optional[int] = None


class EventOrganizerInfo(BaseModel):
    """Compact organizer info embedded in event responses."""

    id: int
    email: str

    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    """API response for a single event."""

    id: int
    title: str
    description: str
    location: Optional[str] = None
    banner_image_url: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    max_capacity: Optional[int] = None
    is_rsvp_enabled: bool
    status: EventStatus
    organizer_id: int
    organizer: Optional[EventOrganizerInfo] = None
    category_id: Optional[int] = None
    category: Optional[EventCategoryResponse] = None
    rsvp_count: int = 0
    user_rsvp_status: Optional[RSVPStatus] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
