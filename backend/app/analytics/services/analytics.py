from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.repository.analytics import AnalyticsRepository
from app.analytics.schemas.analytics import (
    PlatformEngagementSummary,
    PostEngagementResponse,
    ProfileViewsResponse,
    SystemStats,
    TrendingPostResponse,
)
from app.profiles.models.profile import Profile


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.repository = AnalyticsRepository(db)

    async def get_system_stats(self) -> SystemStats:
        """Get platform-wide stats."""
        stats = await self.repository.get_system_stats()
        return SystemStats(**stats)

    async def get_platform_engagement_summary(self) -> PlatformEngagementSummary:
        """Get aggregate platform engagement summary."""
        stats = await self.repository.get_system_stats()
        total_actions = (
            stats["total_likes"]
            + stats["total_comments"]
            + stats["total_post_views"]
            + stats["total_profile_views"]
        )
        return PlatformEngagementSummary(
            total_likes=stats["total_likes"],
            total_comments=stats["total_comments"],
            total_post_views=stats["total_post_views"],
            total_profile_views=stats["total_profile_views"],
            total_engagement_actions=total_actions,
        )

    async def get_profile_views(
        self, user_id: int, days: int = 7
    ) -> ProfileViewsResponse:
        """Get profile views history for a user's profile."""
        # Find profile id from user id
        profile_query = select(Profile.id).where(Profile.user_id == user_id)
        profile_result = await self.repository.db.execute(profile_query)
        profile_id = profile_result.scalar()

        if not profile_id:
            return ProfileViewsResponse(total_views=0, history=[])

        history = await self.repository.get_profile_views_history(profile_id, days)
        total_views = sum(item["views"] for item in history)

        return ProfileViewsResponse(total_views=total_views, history=history)

    async def record_profile_view(self, profile_id: int, viewer_id: int | None):
        """Record a view on a profile."""
        return await self.repository.record_profile_view(profile_id, viewer_id)

    async def record_post_view(self, post_id: int, user_id: int | None):
        """Record a view on a post."""
        return await self.repository.record_post_view(post_id, user_id)

    async def get_posts_engagement(self, user_id: int) -> PostEngagementResponse:
        """Get post engagement metrics for a user."""
        metrics = await self.repository.get_user_posts_engagement(user_id)
        return PostEngagementResponse(**metrics)

    async def get_trending_posts(
        self, limit: int = 5, days: int = 7
    ) -> list[TrendingPostResponse]:
        """Get platform trending posts."""
        posts = await self.repository.get_trending_posts(limit=limit, days=days)
        return [TrendingPostResponse(**p) for p in posts]
