from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.jobs.models.enums import JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    posted_by_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_type = Column(
        SQLEnum(JobTypeEnum, name="job_type_enum", native_enum=False),
        nullable=False,
        default=JobTypeEnum.FULL_TIME,
    )
    location = Column(String(255), nullable=True)
    workplace_type = Column(
        SQLEnum(WorkplaceTypeEnum, name="workplace_type_enum", native_enum=False),
        nullable=False,
        default=WorkplaceTypeEnum.ON_SITE,
    )
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_range = Column(String(100), nullable=True)
    required_skills = Column(JSON, nullable=True)
    application_deadline = Column(DateTime, nullable=True)
    status = Column(
        SQLEnum(JobStatusEnum, name="job_status_enum", native_enum=False),
        nullable=False,
        default=JobStatusEnum.OPEN,
        index=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    company = relationship("Company", back_populates="job_postings")
    posted_by = relationship("User", backref="posted_job_postings")
    applications = relationship(
        "Application", back_populates="job_posting", cascade="all, delete-orphan"
    )
    referrals = relationship(
        "Referral", back_populates="job_posting", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<JobPosting(id={self.id}, title='{self.title}', status='{self.status}')>"
        )


# Alias for backward compatibility
Job = JobPosting
