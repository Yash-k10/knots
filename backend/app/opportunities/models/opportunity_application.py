import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    String,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class OpportunityApplicationStatus(str, enum.Enum):
    """Status of a student's application to a faculty opportunity."""

    APPLIED = "APPLIED"
    PENDING = "PENDING"
    SHORTLISTED = "SHORTLISTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class OpportunityApplication(Base):
    """
    Represents a student's application to a faculty opportunity.

    Each student can apply to an opportunity only once.
    """

    __tablename__ = "opportunity_applications"

    id = Column(Integer, primary_key=True, index=True)

    opportunity_id = Column(
        Integer,
        ForeignKey("faculty_opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    applicant_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Application Content ──────────────────────────────────────────────────
    message = Column(Text, nullable=True)  # Cover note / message to faculty
    resume_url = Column(String(500), nullable=True)

    # ── Status ───────────────────────────────────────────────────────────────
    status = Column(
        SQLEnum(
            OpportunityApplicationStatus,
            name="opportunity_application_status_enum",
            native_enum=False,
        ),
        nullable=False,
        default=OpportunityApplicationStatus.APPLIED,
        index=True,
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    applied_at = Column(
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

    # ── Constraints ──────────────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint(
            "opportunity_id", "applicant_id", name="uq_opportunity_applicant"
        ),
    )

    # ── Relationships ────────────────────────────────────────────────────────
    opportunity = relationship("Opportunity", back_populates="applications")
    applicant = relationship("User", backref="opportunity_applications")

    def __repr__(self) -> str:
        return (
            f"<OpportunityApplication id={self.id} opportunity_id={self.opportunity_id} "
            f"applicant_id={self.applicant_id} status='{self.status}'>"
        )
