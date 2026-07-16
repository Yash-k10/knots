import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class PostVisibility(str, enum.Enum):
    """Controls who can see a post."""

    PUBLIC = "PUBLIC"  # Visible to all users
    CONNECTIONS = "CONNECTIONS"  # Visible only to connections
    PRIVATE = "PRIVATE"  # Visible only to the author


class Post(Base):
    """
    Represents a user's post in the campus feed.

    A post has:
    - Text content (required) and an optional image attachment
    - A visibility setting (PUBLIC / CONNECTIONS / PRIVATE)
    - One-to-many relationships with Comments and Likes
    - A many-to-one relationship with the author (User)
    """

    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    # ── Content ──────────────────────────────────────────────────────────────
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)

    # ── Visibility ───────────────────────────────────────────────────────────
    visibility = Column(
        SQLEnum(PostVisibility),
        default=PostVisibility.PUBLIC,
        nullable=False,
    )

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at = Column(
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

    # ── Relationships ─────────────────────────────────────────────────────────
    author = relationship("User", foreign_keys=[author_id])
    comments = relationship(
        "Comment", back_populates="post", cascade="all, delete-orphan"
    )
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Post id={self.id} author_id={self.author_id}>"
