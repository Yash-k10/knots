from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_posting_id = Column(
        Integer,
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    referred_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    job_posting = relationship("JobPosting", back_populates="referrals")
    referrer = relationship(
        "User", foreign_keys=[referrer_id], backref="given_referrals"
    )
    referred_user = relationship(
        "User", foreign_keys=[referred_user_id], backref="received_referrals"
    )

    def __repr__(self):
        return (
            f"<Referral(id={self.id}, referrer_id={self.referrer_id}, "
            f"job_posting_id={self.job_posting_id})>"
        )


# Alias for backward compatibility
ReferralRequest = Referral
