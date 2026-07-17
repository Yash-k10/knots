import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class EventStatus(str, enum.Enum):
    """Lifecycle status of a campus event."""

    DRAFT = "DRAFT"  # Created but not yet published
    PUBLISHED = "PUBLISHED"  # Visible to all users
    CANCELLED = "CANCELLED"  # Organiser cancelled the event
    COMPLETED = "COMPLETED"  # Event date has passed


class Event(Base):
    """
    Represents a campus event posted by a user (student, faculty, club admin etc.).

    An event has:
    - A title, rich description, start & end date/time
    - A physical or virtual location
    - A capacity limit (None = unlimited)
    - An RSVP toggle (is_rsvp_enabled)
    - A lifecycle status (DRAFT → PUBLISHED → COMPLETED / CANCELLED)
    - A category linking it to an EventCategory
    - A many-to-one relationship to the organiser (User)
    - A one-to-many relationship to RSVPs
    """

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)

    # ── Content ──────────────────────────────────────────────────────────────
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    location = Column(String(300), nullable=True)  # physical address or "Online"
    banner_image_url = Column(String(500), nullable=True)

    # ── Timing ───────────────────────────────────────────────────────────────
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=True)  # None = open-ended

    # ── Capacity & RSVP ──────────────────────────────────────────────────────
    max_capacity = Column(Integer, nullable=True)  # None = unlimited
    is_rsvp_enabled = Column(Boolean, default=True, nullable=False)

    # ── Status ───────────────────────────────────────────────────────────────
    status = Column(
        SQLEnum(EventStatus),
        default=EventStatus.PUBLISHED,
        nullable=False,
        index=True,
    )

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(
        Integer, ForeignKey("event_categories.id"), nullable=True, index=True
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organizer = relationship("User", foreign_keys=[organizer_id])
    category = relationship("EventCategory", back_populates="events")
    rsvps = relationship("RSVP", back_populates="event", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Event id={self.id} title={self.title!r} status={self.status}>"
