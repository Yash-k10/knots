from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class SkillEndorsement(Base):
    __tablename__ = "skill_endorsements"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(
        Integer,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_name = Column(String(100), nullable=False)
    endorser_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    profile = relationship("Profile", foreign_keys=[profile_id])
    endorser = relationship("User", foreign_keys=[endorser_id])

    __table_args__ = (
        UniqueConstraint(
            "profile_id", "skill_name", "endorser_id", name="uq_profile_skill_endorser"
        ),
    )
