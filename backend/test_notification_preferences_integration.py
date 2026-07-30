"""
Integration tests for notification preferences.

Verifies that when a user disables a notification type in their preferences,
the NotificationService.create_notification() call is silently suppressed
(returns None and does NOT write a row to the notifications table).

Uses the same in-memory SQLite + aiosqlite setup as test_notifications_integration.py.
"""

import unittest
from unittest.mock import AsyncMock, patch

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.core.base  # noqa: F401  — imports all models so SQLite schema is created
from app.core.database import Base
from app.notifications.repository.notification import NotificationRepository
from app.notifications.repository.notification_preference import (
    NotificationPreferenceRepository,
)
from app.notifications.schemas.notification_preference import (
    NotificationPreferenceUpdate,
)
from app.notifications.services.notification import NotificationService
from app.notifications.services.notification_preference import (
    NotificationPreferenceService,
)
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class TestNotificationPreferencesIntegration(unittest.IsolatedAsyncioTestCase):
    # ------------------------------------------------------------------
    # Fixtures
    # ------------------------------------------------------------------

    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed roles & users
        role = Role(id=1, name="STUDENT")
        self.db.add(role)
        await self.db.commit()

        self.user1 = User(
            id=1,
            email="alice@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.user2 = User(
            id=2,
            email="bob@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([self.user1, self.user2])
        await self.db.commit()

        profile1 = Profile(user_id=1, first_name="Alice", last_name="Smith")
        profile2 = Profile(user_id=2, first_name="Bob", last_name="Jones")
        self.db.add_all([profile1, profile2])
        await self.db.commit()

    async def asyncTearDown(self):
        await self.db.close()
        await self.engine.dispose()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _notif_service(self):
        return NotificationService(self.db)

    def _pref_service(self):
        return NotificationPreferenceService(self.db)

    async def _count_notifications(self, user_id: int) -> int:
        repo = NotificationRepository(self.db)
        notifs = await repo.get_user_notifications(user_id)
        return len(notifs)

    # ------------------------------------------------------------------
    # Tests
    # ------------------------------------------------------------------

    @patch(
        "app.notifications.services.notification.manager.send_personal_message",
        new_callable=AsyncMock,
    )
    async def test_notification_sent_when_no_preference_row(self, mock_ws):
        """
        If the user has no preference row (never customised anything),
        all notifications should still be delivered (default = all enabled).
        """
        svc = self._notif_service()
        result = await svc.create_notification(
            user_id=1, title="Test", content="Hello", type="like"
        )
        self.assertIsNotNone(result)
        self.assertEqual(await self._count_notifications(1), 1)

    @patch(
        "app.notifications.services.notification.manager.send_personal_message",
        new_callable=AsyncMock,
    )
    async def test_notification_suppressed_when_type_disabled(self, mock_ws):
        """
        After the user disables 'like' notifications, create_notification()
        should return None and NOT write a DB row.
        """
        pref_svc = self._pref_service()
        await pref_svc.update_preferences(
            user_id=1, payload=NotificationPreferenceUpdate(notify_on_like=False)
        )

        svc = self._notif_service()
        result = await svc.create_notification(
            user_id=1, title="Someone liked", content="...", type="like"
        )
        self.assertIsNone(result)
        self.assertEqual(await self._count_notifications(1), 0)
        mock_ws.assert_not_called()

    @patch(
        "app.notifications.services.notification.manager.send_personal_message",
        new_callable=AsyncMock,
    )
    async def test_other_types_still_sent_when_one_disabled(self, mock_ws):
        """
        Disabling 'like' should NOT suppress 'comment' notifications.
        """
        pref_svc = self._pref_service()
        await pref_svc.update_preferences(
            user_id=1, payload=NotificationPreferenceUpdate(notify_on_like=False)
        )

        svc = self._notif_service()

        # like → suppressed
        res_like = await svc.create_notification(
            user_id=1, title="Like", content="...", type="like"
        )
        self.assertIsNone(res_like)

        # comment → delivered
        res_comment = await svc.create_notification(
            user_id=1, title="Comment", content="...", type="comment"
        )
        self.assertIsNotNone(res_comment)
        self.assertEqual(await self._count_notifications(1), 1)

    @patch(
        "app.notifications.services.notification.manager.send_personal_message",
        new_callable=AsyncMock,
    )
    async def test_preference_re_enable_restores_delivery(self, mock_ws):
        """
        Re-enabling a previously disabled type should resume delivery.
        """
        pref_svc = self._pref_service()
        # Disable
        await pref_svc.update_preferences(
            user_id=1, payload=NotificationPreferenceUpdate(notify_on_comment=False)
        )
        svc = self._notif_service()
        res = await svc.create_notification(
            user_id=1, title="Comment", content="...", type="comment"
        )
        self.assertIsNone(res)

        # Re-enable
        await pref_svc.update_preferences(
            user_id=1, payload=NotificationPreferenceUpdate(notify_on_comment=True)
        )
        res2 = await svc.create_notification(
            user_id=1, title="Comment", content="...", type="comment"
        )
        self.assertIsNotNone(res2)
        self.assertEqual(await self._count_notifications(1), 1)

    @patch(
        "app.notifications.services.notification.manager.send_personal_message",
        new_callable=AsyncMock,
    )
    async def test_preferences_are_per_user(self, mock_ws):
        """
        User 1 disabling 'connection_request' must NOT affect User 2.
        """
        pref_svc = self._pref_service()
        await pref_svc.update_preferences(
            user_id=1,
            payload=NotificationPreferenceUpdate(notify_on_connection_request=False),
        )

        svc = self._notif_service()

        # User 1 → suppressed
        res1 = await svc.create_notification(
            user_id=1, title="CR", content="...", type="connection_request"
        )
        self.assertIsNone(res1)

        # User 2 → should still receive it
        res2 = await svc.create_notification(
            user_id=2, title="CR", content="...", type="connection_request"
        )
        self.assertIsNotNone(res2)
        self.assertEqual(await self._count_notifications(2), 1)

    async def test_get_or_create_idempotent(self):
        """
        Calling get_or_create twice for the same user should return the same row,
        not create duplicates.
        """
        pref_repo = NotificationPreferenceRepository(self.db)
        prefs1 = await pref_repo.get_or_create(1)
        prefs2 = await pref_repo.get_or_create(1)
        self.assertEqual(prefs1.id, prefs2.id)


if __name__ == "__main__":
    unittest.main()
