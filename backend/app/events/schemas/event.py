from datetime import datetime

from pydantic import BaseModel, Field

from app.events.models.event import EventStatus
from app.events.models.rsvp import RSVPStatus

# ── Event Category Schemas ───────────────────────────────────────────────────


class EventCategoryResponse(BaseModel):
    """API response for an event category."""

    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True


# ── RSVP Schemas ─────────────────────────────────────────────────────────────


class RSVPCreate(BaseModel):
    """Payload to RSVP to an event."""

    status: RSVPStatus = RSVPStatus.GOING
    note: str | None = Field(None, max_length=300)


class RSVPUpdate(BaseModel):
    """Payload to update an existing RSVP."""

    status: RSVPStatus | None = None
    note: str | None = Field(None, max_length=300)


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
    user: RSVPUserInfo | None = None
    status: RSVPStatus
    note: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Event Schemas ────────────────────────────────────────────────────────────


class EventCreate(BaseModel):
    """Payload to create a new event."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    location: str | None = Field(None, max_length=300)
    banner_image_url: str | None = None
    start_datetime: datetime
    end_datetime: datetime | None = None
    max_capacity: int | None = Field(None, ge=1)
    is_rsvp_enabled: bool = True
    category_id: int | None = None


class EventUpdate(BaseModel):
    """Payload to update an existing event (all fields optional)."""

    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    location: str | None = Field(None, max_length=300)
    banner_image_url: str | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    max_capacity: int | None = Field(None, ge=1)
    is_rsvp_enabled: bool | None = None
    status: EventStatus | None = None
    category_id: int | None = None


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
    location: str | None = None
    banner_image_url: str | None = None
    start_datetime: datetime
    end_datetime: datetime | None = None
    max_capacity: int | None = None
    is_rsvp_enabled: bool
    status: EventStatus
    organizer_id: int
    organizer: EventOrganizerInfo | None = None
    category_id: int | None = None
    category: EventCategoryResponse | None = None
    rsvp_count: int = 0
    user_rsvp_status: RSVPStatus | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
