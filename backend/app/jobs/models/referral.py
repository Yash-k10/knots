from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ReferralRequest(Base):
    __tablename__ = "referral_requests"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_url = Column(String(500), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="referrals")
