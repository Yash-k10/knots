from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.posts.models.comment import Comment


class CommentRepository(BaseRepository[Comment]):
    """Repository for Comment CRUD and per-post queries."""

    def __init__(self, db: AsyncSession):
        super().__init__(Comment, db)

    async def get_by_post(
        self, post_id: int, skip: int = 0, limit: int = 50
    ) -> List[Comment]:
        """Fetch comments for a post, oldest first, with author info."""
        result = await self.db.execute(
            select(Comment)
            .options(selectinload(Comment.author))
            .filter(Comment.post_id == post_id)
            .order_by(Comment.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
