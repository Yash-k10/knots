from sqlalchemy import Boolean, Column, ForeignKey, Integer, UniqueConstraint

from app.core.database import Base


class NotificationPreference(Base):
    """
    Per-user notification preference flags.
    One row per user — created on first access with all-enabled defaults.
    Each column maps to a notification type; set False to suppress that type.
    """

    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Social action toggles
    notify_on_like = Column(Boolean, default=True, nullable=False)
    notify_on_comment = Column(Boolean, default=True, nullable=False)
    notify_on_connection_request = Column(Boolean, default=True, nullable=False)
    notify_on_event_rsvp = Column(Boolean, default=True, nullable=False)

    # Platform alert toggles
    notify_on_message = Column(Boolean, default=True, nullable=False)
    notify_on_job_alert = Column(Boolean, default=True, nullable=False)
    notify_on_general = Column(Boolean, default=True, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", name="uq_notification_prefs_user"),)
