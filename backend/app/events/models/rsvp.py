import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class RSVPStatus(str, enum.Enum):
    """Status of a user's RSVP to an event."""

    GOING = "GOING"  # User confirmed attendance
    MAYBE = "MAYBE"  # User is tentative
    NOT_GOING = "NOT_GOING"  # User declined


class RSVP(Base):
    """
    Represents a user's RSVP (attendance response) to a campus Event.

    Rules:
    - One RSVP per (user, event) pair — enforced by UniqueConstraint.
    - Status can be updated freely while the event is still PUBLISHED.
    - RSVPs cascade-delete when their parent Event is deleted.
    """

    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Status ───────────────────────────────────────────────────────────────
    status = Column(
        SQLEnum(RSVPStatus),
        default=RSVPStatus.GOING,
        nullable=False,
    )

    # ── Optional note from the attendee ──────────────────────────────────────
    note = Column(String(300), nullable=True)

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
    event = relationship("Event", back_populates="rsvps")
    user = relationship("User", foreign_keys=[user_id])

    # ── Constraints ───────────────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_rsvp_event_user"),
    )

    def __repr__(self) -> str:
        return (
            f"<RSVP id={self.id} event_id={self.event_id} "
            f"user_id={self.user_id} status={self.status}>"
        )
