from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.admin.models.audit import AuditLog
from app.admin.models.flagged_post import FlaggedPost
from app.posts.models.post import Post


class AdminRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)


class FlaggedPostRepository(BaseRepository[FlaggedPost]):
    def __init__(self, db: AsyncSession):
        super().__init__(FlaggedPost, db)

    async def get_flagged_posts_with_details(
        self, skip: int = 0, limit: int = 100
    ) -> List[FlaggedPost]:
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
