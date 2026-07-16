from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.posts.models.like import Like


class LikeRepository(BaseRepository[Like]):
    """Repository for Like operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Like, db)

    async def get_by_post_and_user(self, post_id: int, user_id: int) -> Optional[Like]:
        """Find an existing like by a specific user on a specific post."""
        result = await self.db.execute(
            select(Like).filter(and_(Like.post_id == post_id, Like.user_id == user_id))
        )
        return result.scalars().first()

    async def count_by_post(self, post_id: int) -> int:
        """Return the total number of likes on a post."""
        result = await self.db.execute(
            select(func.count()).select_from(Like).filter(Like.post_id == post_id)
        )
        return result.scalar_one()
