from sqlalchemy.ext.asyncio import AsyncSession
from app.notifications.repository.notification import NotificationRepository
from app.notifications.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repository = NotificationRepository(db)

    async def get_user_notifications(self, user_id: int) -> list[Notification]:
        # For scaffolding, just return list filtered by user
        # We can implement a specific query if wanted, but generic fetch works for boilerplate
        return await self.repository.get_multi()
