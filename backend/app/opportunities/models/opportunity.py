import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class OpportunityType(str, enum.Enum):
    """Type of faculty opportunity."""

    JOB = "JOB"
    INTERNSHIP = "INTERNSHIP"
    RESEARCH = "RESEARCH"
    MENTORSHIP = "MENTORSHIP"


class OpportunityStatus(str, enum.Enum):
    """Status of a faculty opportunity."""

    OPEN = "OPEN"
    CLOSED = "CLOSED"


class Opportunity(Base):
    """
    Represents a faculty-posted opportunity (Job, Internship, or Mentorship).

    Faculty members create these to advertise positions or mentorship slots.
    Students and alumni can browse and apply.
    """

    __tablename__ = "faculty_opportunities"

    id = Column(Integer, primary_key=True, index=True)

    # ── Content ──────────────────────────────────────────────────────────────
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    opportunity_type = Column(
        SQLEnum(OpportunityType, name="opportunity_type_enum", native_enum=False),
        nullable=False,
        default=OpportunityType.JOB,
        index=True,
    )

    # ── Requirements & Details ───────────────────────────────────────────────
    required_skills = Column(JSON, nullable=True)  # List of skill strings
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    stipend_or_salary = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)  # e.g. "3 months", "6 months"
    max_applicants = Column(Integer, nullable=True)
    form_link = Column(String(500), nullable=True)

    # ── Status & Deadline ────────────────────────────────────────────────────
    application_deadline = Column(DateTime, nullable=True)
    status = Column(
        SQLEnum(OpportunityStatus, name="opportunity_status_enum", native_enum=False),
        nullable=False,
        default=OpportunityStatus.OPEN,
        index=True,
    )

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    posted_by_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
        index=True,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────────────────────
    posted_by = relationship("User", backref="faculty_opportunities")
    applications = relationship(
        "OpportunityApplication",
        back_populates="opportunity",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Opportunity id={self.id} title='{self.title}' type={self.opportunity_type}>"
