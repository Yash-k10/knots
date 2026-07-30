"""
Unit tests for the notification preferences router.

Tests GET and PATCH /notifications/preferences endpoints using mocked
NotificationPreferenceService, following the same pattern as
test_notification_router.py.
"""

import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import app.main  # noqa: F401
from app.notifications.models.notification_preference import NotificationPreference
from app.notifications.routers.notification_preference import (
    get_notification_preferences,
    update_notification_preferences,
)
from app.notifications.schemas.notification_preference import (
    NotificationPreferenceUpdate,
)
from app.users.models.user import User


def _mock_prefs(user_id: int = 1, **overrides) -> NotificationPreference:
    """Build a NotificationPreference instance with sensible defaults."""
    prefs = NotificationPreference(
        id=1,
        user_id=user_id,
        notify_on_like=True,
        notify_on_comment=True,
        notify_on_connection_request=True,
        notify_on_event_rsvp=True,
        notify_on_message=True,
        notify_on_job_alert=True,
        notify_on_general=True,
    )
    for key, val in overrides.items():
        setattr(prefs, key, val)
    return prefs


class TestNotificationPreferenceRouter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = User(id=1, email="test@example.com")
        self.db = MagicMock()

    # ------------------------------------------------------------------
    # GET /notifications/preferences
    # ------------------------------------------------------------------

    @patch(
        "app.notifications.routers.notification_preference.NotificationPreferenceService"
    )
    async def test_get_preferences_returns_defaults(self, mock_svc_cls):
        """GET should return all-enabled defaults for a user with no saved prefs."""
        svc = AsyncMock()
        mock_svc_cls.return_value = svc
        svc.get_preferences.return_value = _mock_prefs()

        res = await get_notification_preferences(current_user=self.user, db=self.db)
        self.assertTrue(res.data.notify_on_like)
        self.assertTrue(res.data.notify_on_comment)
        self.assertTrue(res.data.notify_on_connection_request)
        self.assertTrue(res.data.notify_on_event_rsvp)
        svc.get_preferences.assert_called_once_with(1)

    # ------------------------------------------------------------------
    # PATCH /notifications/preferences
    # ------------------------------------------------------------------

    @patch(
        "app.notifications.routers.notification_preference.NotificationPreferenceService"
    )
    async def test_patch_preferences_disables_like_notifications(self, mock_svc_cls):
        """PATCH with notify_on_like=False should persist the change."""
        svc = AsyncMock()
        mock_svc_cls.return_value = svc
        updated = _mock_prefs(notify_on_like=False)
        svc.update_preferences.return_value = updated

        payload = NotificationPreferenceUpdate(notify_on_like=False)
        res = await update_notification_preferences(
            payload=payload, current_user=self.user, db=self.db
        )
        self.assertFalse(res.data.notify_on_like)
        # All others should still be True
        self.assertTrue(res.data.notify_on_comment)
        svc.update_preferences.assert_called_once_with(1, payload)

    @patch(
        "app.notifications.routers.notification_preference.NotificationPreferenceService"
    )
    async def test_patch_preferences_multiple_fields(self, mock_svc_cls):
        """PATCH can toggle multiple fields in one request."""
        svc = AsyncMock()
        mock_svc_cls.return_value = svc
        updated = _mock_prefs(notify_on_comment=False, notify_on_event_rsvp=False)
        svc.update_preferences.return_value = updated

        payload = NotificationPreferenceUpdate(
            notify_on_comment=False, notify_on_event_rsvp=False
        )
        res = await update_notification_preferences(
            payload=payload, current_user=self.user, db=self.db
        )
        self.assertFalse(res.data.notify_on_comment)
        self.assertFalse(res.data.notify_on_event_rsvp)
        self.assertTrue(res.data.notify_on_like)  # untouched

    @patch(
        "app.notifications.routers.notification_preference.NotificationPreferenceService"
    )
    async def test_patch_preferences_re_enables_field(self, mock_svc_cls):
        """PATCH with True should re-enable a previously disabled field."""
        svc = AsyncMock()
        mock_svc_cls.return_value = svc
        svc.update_preferences.return_value = _mock_prefs(notify_on_like=True)

        payload = NotificationPreferenceUpdate(notify_on_like=True)
        res = await update_notification_preferences(
            payload=payload, current_user=self.user, db=self.db
        )
        self.assertTrue(res.data.notify_on_like)


if __name__ == "__main__":
    unittest.main()
