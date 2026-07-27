from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClubMember(Base):
    __tablename__ = "club_members"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="MEMBER")  # MEMBER, OFFICER, LEADER

    club = relationship("Club", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (UniqueConstraint("club_id", "user_id", name="uq_club_member"),)
