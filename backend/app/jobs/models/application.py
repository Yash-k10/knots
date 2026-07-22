from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    Enum as SQLEnum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.jobs.models.enums import ApplicationStatusEnum


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_posting_id = Column(
        Integer,
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    applicant_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resume_url = Column(String(500), nullable=True)
    resume_text = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    status = Column(
        SQLEnum(
            ApplicationStatusEnum, name="application_status_enum", native_enum=False
        ),
        nullable=False,
        default=ApplicationStatusEnum.PENDING,
        index=True,
    )
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "job_posting_id", "applicant_id", name="uq_job_posting_applicant"
        ),
    )

    job_posting = relationship("JobPosting", back_populates="applications")
    applicant = relationship("User", backref="job_applications")

    def __repr__(self):
        return (
            f"<Application(id={self.id}, job_posting_id={self.job_posting_id}, "
            f"applicant_id={self.applicant_id}, status='{self.status}')>"
        )
