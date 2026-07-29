from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.posts.models.comment import Comment
from app.posts.models.post import Post


class PostRepository(BaseRepository[Post]):
    """Repository for Post CRUD and feed queries."""

    def __init__(self, db: AsyncSession):
        super().__init__(Post, db)

    async def get_with_details(self, post_id: int) -> Post | None:
        """Fetch a single post with its author, comments (+ their authors), and likes."""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author),
                selectinload(Post.comments).selectinload(Comment.author),
                selectinload(Post.likes),
            )
            .filter(Post.id == post_id)
        )
        return result.scalars().first()

    async def get_feed(self, skip: int = 0, limit: int = 20) -> list[Post]:
        """
        Fetch posts for the public feed, ordered by newest first.
        Eager-loads author, comments, and likes to avoid N+1 queries.
        """
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author),
                selectinload(Post.comments),
                selectinload(Post.likes),
            )
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def get_by_author(
        self, author_id: int, skip: int = 0, limit: int = 20
    ) -> list[Post]:
        """Fetch posts by a specific author, newest first."""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author),
                selectinload(Post.comments),
                selectinload(Post.likes),
            )
            .filter(Post.author_id == author_id)
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def count_all(self) -> int:
        """Return the total number of posts (for pagination metadata)."""
        result = await self.db.execute(select(func.count()).select_from(Post))
        return result.scalar_one()
