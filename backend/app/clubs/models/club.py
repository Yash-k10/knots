from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
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
    faculty_coordinator_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    alumni_mentor_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    conversation = relationship("Conversation")
    creator = relationship("User", foreign_keys=[creator_id])
    head = relationship("User", foreign_keys=[head_id])
    co_head = relationship("User", foreign_keys=[co_head_id])
    faculty_coordinator = relationship("User", foreign_keys=[faculty_coordinator_id])
    alumni_mentor = relationship("User", foreign_keys=[alumni_mentor_id])
    members = relationship(
        "ClubMember", back_populates="club", cascade="all, delete-orphan"
    )
    resources = relationship(
        "ClubResource", back_populates="club", cascade="all, delete-orphan"
    )
    gallery_items = relationship(
        "ClubGalleryItem", back_populates="club", cascade="all, delete-orphan"
    )


class ClubResource(Base):
    __tablename__ = "club_resources"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(
        Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(200), nullable=False)
    category = Column(String(50), default="Notes", nullable=False)
    resource_type = Column(String(20), default="DOC", nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    club = relationship("Club", back_populates="resources")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])


class ClubGalleryItem(Base):
    __tablename__ = "club_gallery_items"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(
        Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(200), nullable=False)
    image_url = Column(String(500), nullable=False)
    activity_name = Column(String(100), nullable=True)
    uploaded_by_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    club = relationship("Club", back_populates="gallery_items")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
