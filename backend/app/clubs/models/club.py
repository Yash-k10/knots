from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(
        Integer, ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )
    head_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    co_head_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    conversation = relationship("Conversation")
    head = relationship("User", foreign_keys=[head_id])
    co_head = relationship("User", foreign_keys=[co_head_id])
    members = relationship(
        "ClubMember", back_populates="club", cascade="all, delete-orphan"
    )
