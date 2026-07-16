from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Comment(Base):
    """
    Represents a comment on a post.

    Rules:
    - Each comment belongs to exactly one post and one author.
    - Comments cascade-delete when their parent Post is deleted.
    """

    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Content ──────────────────────────────────────────────────────────────
    content = Column(Text, nullable=False)

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
    post = relationship("Post", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])

    def __repr__(self) -> str:
        return (
            f"<Comment id={self.id} post_id={self.post_id} author_id={self.author_id}>"
        )
