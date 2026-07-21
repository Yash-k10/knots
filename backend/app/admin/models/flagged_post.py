from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class FlaggedPost(Base):
    """
    Represents a post flagged/reported by a user.
    """

    __tablename__ = "flagged_posts"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(
        Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    flagger_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason = Column(Text, nullable=True)
    status = Column(
        String(50), default="pending", nullable=False
    )  # pending, resolved, dismissed
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    # Relationships
    post = relationship("Post", foreign_keys=[post_id])
    flagger = relationship("User", foreign_keys=[flagger_id])

    def __repr__(self) -> str:
        return f"<FlaggedPost id={self.id} post_id={self.post_id} flagger_id={self.flagger_id} status={self.status}>"
