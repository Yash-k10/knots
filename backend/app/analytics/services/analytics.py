from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.repository.analytics import AnalyticsRepository
from app.analytics.schemas.analytics import SystemStats


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.repository = AnalyticsRepository(db)

    async def get_system_stats(self) -> SystemStats:
        # Boilerplate counts
        return SystemStats(
            total_users=120, total_connections=450, total_jobs=35, total_posts=180
        )
