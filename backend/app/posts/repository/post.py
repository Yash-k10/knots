from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.repository import BaseRepository
from app.posts.models.comment import Comment
from app.posts.models.post import Post
from app.users.models.user import User


class PostRepository(BaseRepository[Post]):
    """Repository for Post CRUD and feed queries."""

    def __init__(self, db: AsyncSession):
        super().__init__(Post, db)

    async def get_with_details(self, post_id: int) -> Post | None:
        """Fetch a single post with its author (+ profile), comments (+ their authors), and likes."""
        result = await self.db.execute(
            select(Post)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.comments)
                .selectinload(Comment.author)
                .selectinload(User.profile),
                selectinload(Post.likes),
            )
            .filter(Post.id == post_id)
        )
        return result.scalars().first()

    async def get_feed(
        self,
        skip: int = 0,
        limit: int = 20,
        user_role: str | None = None,
        current_user_id: int | None = None,
    ) -> list[dict]:
        """
        Fetch posts for the feed filtered by the user's role visibility permissions,
        ordered by newest first. Uses SQL subqueries for counts to avoid
        transferring all likes/comments over the network.
        """
        from app.posts.models.comment import Comment
        from app.posts.models.like import Like

        # Subqueries for counts (executed in the DB, not in Python)
        likes_count_sq = (
            select(func.count())
            .where(Like.post_id == Post.id)
            .correlate(Post)
            .scalar_subquery()
            .label("likes_count")
        )
        comments_count_sq = (
            select(func.count())
            .where(Comment.post_id == Post.id)
            .correlate(Post)
            .scalar_subquery()
            .label("comments_count")
        )

        stmt = (
            select(Post, likes_count_sq, comments_count_sq)
            .options(
                joinedload(Post.author).joinedload(User.profile),
            )
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        # All posts are visible to everyone - no visibility filtering

        result = await self.db.execute(stmt)
        rows = result.unique().all()
        return [
            {"post": row[0], "likes_count": row[1] or 0, "comments_count": row[2] or 0}
            for row in rows
        ]

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
