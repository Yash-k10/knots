from sqlalchemy.ext.asyncio import AsyncSession

from app.notifications.models.notification_preference import NotificationPreference
from app.notifications.repository.notification_preference import (
    NotificationPreferenceRepository,
)
from app.notifications.schemas.notification_preference import (
    NotificationPreferenceUpdate,
)

# Map notification type strings → preference column names
_TYPE_TO_PREF_FIELD: dict[str, str] = {
    "like": "notify_on_like",
    "comment": "notify_on_comment",
    "connection_request": "notify_on_connection_request",
    "event_rsvp": "notify_on_event_rsvp",
    "message": "notify_on_message",
    "job_alert": "notify_on_job_alert",
    "general": "notify_on_general",
}


class NotificationPreferenceService:
    def __init__(self, db: AsyncSession):
        self.repository = NotificationPreferenceRepository(db)

    async def get_preferences(self, user_id: int) -> NotificationPreference:
        """Get (or lazily create) the preference row for a user."""
        return await self.repository.get_or_create(user_id)

    async def update_preferences(
        self, user_id: int, payload: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        """Apply a partial update from the Pydantic payload."""
        updates = payload.model_dump(exclude_none=True)
        return await self.repository.update_preferences(user_id, updates)

    async def is_enabled(self, user_id: int, notification_type: str | None) -> bool:
        """
        Return True if the user has not suppressed the given notification type.
        Unknown/None types are treated as the ``general`` preference.
        Falls back to True if the user has no preference row yet (fast path).
        """
        pref_field = _TYPE_TO_PREF_FIELD.get(
            notification_type or "general", "notify_on_general"
        )
        prefs = await self.repository.get_by_user(user_id)
        if prefs is None:
            # No row → user has never changed defaults → all enabled
            return True
        return bool(getattr(prefs, pref_field, True))
