from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Like(Base):
    """
    Represents a user's 'like' on a post.

    Rules:
    - One like per (post, user) pair — enforced by UniqueConstraint.
    - Likes cascade-delete when their parent Post is deleted.
    """

    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    post = relationship("Post", back_populates="likes")
    user = relationship("User", foreign_keys=[user_id])

    # ── Constraints ───────────────────────────────────────────────────────────
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_user_like"),)

    def __repr__(self) -> str:
        return f"<Like id={self.id} post_id={self.post_id} user_id={self.user_id}>"
