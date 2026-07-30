from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.notifications.models.notification_preference import NotificationPreference


class NotificationPreferenceRepository(BaseRepository[NotificationPreference]):
    def __init__(self, db: AsyncSession):
        super().__init__(NotificationPreference, db)

    async def get_by_user(self, user_id: int) -> NotificationPreference | None:
        """Fetch the preference row for a given user."""
        result = await self.db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
        )
        return result.scalars().first()

    async def get_or_create(self, user_id: int) -> NotificationPreference:
        """
        Return the existing preference row for `user_id`, or create a new
        one with all-enabled defaults if one does not yet exist.
        """
        prefs = await self.get_by_user(user_id)
        if prefs is None:
            prefs = await self.create({"user_id": user_id})
            await self.db.commit()
            await self.db.refresh(prefs)
        return prefs

    async def update_preferences(
        self, user_id: int, updates: dict
    ) -> NotificationPreference:
        """Apply a partial dict of updates to the user's preference row."""
        prefs = await self.get_or_create(user_id)
        for key, value in updates.items():
            if value is not None and hasattr(prefs, key):
                setattr(prefs, key, value)
        self.db.add(prefs)
        await self.db.commit()
        await self.db.refresh(prefs)
        return prefs
