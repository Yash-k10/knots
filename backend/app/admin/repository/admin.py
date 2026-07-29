from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.models.audit import AuditLog
from app.admin.models.flagged_post import FlaggedPost
from app.core.repository import BaseRepository
from app.posts.models.post import Post
from app.users.models.user import User


class AdminRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def get_dashboard_stats(self) -> dict:
        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        total_users_res = await self.db.execute(select(func.count(User.id)))
        total_users = total_users_res.scalar() or 0

        total_posts_res = await self.db.execute(select(func.count(Post.id)))
        total_posts = total_posts_res.scalar() or 0

        active_users_res = await self.db.execute(
            select(func.count(User.id)).filter(User.is_active.is_(True))
        )
        active_users = active_users_res.scalar() or 0

        posts_today_res = await self.db.execute(
            select(func.count(Post.id)).filter(Post.created_at >= today_start)
        )
        posts_today = posts_today_res.scalar() or 0

        users_today_res = await self.db.execute(
            select(func.count(User.id)).filter(User.created_at >= today_start)
        )
        users_today = users_today_res.scalar() or 0

        actions_today_res = await self.db.execute(
            select(func.count(AuditLog.id)).filter(AuditLog.created_at >= today_start)
        )
        actions_today = actions_today_res.scalar() or 0

        return {
            "total_users": total_users,
            "total_posts": total_posts,
            "active_users": active_users,
            "daily_activity": {
                "posts_today": posts_today,
                "users_today": users_today,
                "actions_today": actions_today,
            },
        }


class FlaggedPostRepository(BaseRepository[FlaggedPost]):
    def __init__(self, db: AsyncSession):
        super().__init__(FlaggedPost, db)

    async def get_flagged_posts_with_details(
        self, skip: int = 0, limit: int = 100
    ) -> list[FlaggedPost]:
        """Fetch pending flagged posts with related flagger and post (including author/comments/likes) details."""
        result = await self.db.execute(
            select(FlaggedPost)
            .options(
                selectinload(FlaggedPost.flagger),
                selectinload(FlaggedPost.post).selectinload(Post.author),
                selectinload(FlaggedPost.post).selectinload(Post.comments),
                selectinload(FlaggedPost.post).selectinload(Post.likes),
            )
            .filter(FlaggedPost.status == "pending")
            .order_by(FlaggedPost.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
