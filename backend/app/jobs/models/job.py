from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    location = Column(String(100), nullable=True)
    salary_range = Column(String(100), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="jobs")
    referrals = relationship(
        "ReferralRequest", back_populates="job", cascade="all, delete-orphan"
    )
