from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.users.models.user import User


class AnalyticsRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)
