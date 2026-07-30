from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.notifications.models.notification import Notification
from app.notifications.repository.notification import NotificationRepository
from app.notifications.schemas.notification import NotificationResponse
from app.messaging.websocket_manager import manager


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repository = NotificationRepository(db)

    async def get_user_notifications(self, user_id: int) -> List[Notification]:
        return await self.repository.get_user_notifications(user_id)

    async def get_unread_count(self, user_id: int) -> int:
        return await self.repository.get_unread_count(user_id)

    async def create_notification(
        self, user_id: int, title: str, content: str, type: Optional[str] = "general"
    ) -> Optional[Notification]:
        from app.notifications.services.notification_preference import (
            NotificationPreferenceService,
        )

        pref_service = NotificationPreferenceService(self.repository.db)
        if not await pref_service.is_enabled(user_id, type):
            return None

        notification = await self.repository.create(
            obj_in={
                "user_id": user_id,
                "title": title,
                "content": content,
                "type": type,
                "is_read": False,
            }
        )

        unread_count = await self.get_unread_count(user_id)

        # Broadcast real-time WebSocket notification event to online user
        payload = {
            "type": "new_notification",
            "notification": NotificationResponse.model_validate(
                notification
            ).model_dump(mode="json"),
            "unread_count": unread_count,
        }
        await manager.send_personal_message(payload, user_id)

        return notification

    async def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        return await self.repository.mark_as_read(notification_id, user_id)

    async def mark_all_as_read(self, user_id: int) -> int:
        return await self.repository.mark_all_as_read(user_id)
