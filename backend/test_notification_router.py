import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

import app.main  # noqa: F401
from app.notifications.routers.notification import (
    read_notifications,
    get_unread_count,
    create_notification,
)
from app.notifications.schemas.notification import NotificationCreate
from app.notifications.models.notification import Notification
from app.users.models.user import User


class TestNotificationRouter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = User(id=1, email="test@example.com")
        self.db = MagicMock()

    @patch("app.notifications.routers.notification.NotificationService")
    async def test_read_notifications(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        service_instance.get_user_notifications.return_value = []

        res = await read_notifications(current_user=self.user, db=self.db)
        self.assertEqual(res.data, [])
        service_instance.get_user_notifications.assert_called_once_with(1)

    @patch("app.notifications.routers.notification.NotificationService")
    async def test_get_unread_count(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        service_instance.get_unread_count.return_value = 5

        res = await get_unread_count(current_user=self.user, db=self.db)
        self.assertEqual(res.data.unread_count, 5)
        service_instance.get_unread_count.assert_called_once_with(1)

    @patch("app.notifications.routers.notification.NotificationService")
    async def test_create_notification(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        mock_notif = Notification(
            id=10,
            user_id=1,
            title="Test Alert",
            content="New alert content",
            is_read=False,
            type="general",
            created_at=datetime.utcnow(),
        )
        service_instance.create_notification.return_value = mock_notif

        payload = NotificationCreate(
            user_id=1, title="Test Alert", content="New alert content", type="general"
        )
        res = await create_notification(
            payload=payload, current_user=self.user, db=self.db
        )
        self.assertEqual(res.data.id, 10)
        self.assertEqual(res.data.title, "Test Alert")
        service_instance.create_notification.assert_called_once_with(
            user_id=1, title="Test Alert", content="New alert content", type="general"
        )


if __name__ == "__main__":
    unittest.main()
