from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.notifications.models.notification import Notification


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)
