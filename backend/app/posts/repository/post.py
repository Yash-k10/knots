from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.posts.models.comment import Comment
from app.posts.models.post import Post, PostVisibility


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

    async def get_feed(
        self,
        skip: int = 0,
        limit: int = 20,
        user_role: str | None = None,
        current_user_id: int | None = None,
    ) -> list[Post]:
        """
        Fetch posts for the feed filtered by the user's role visibility permissions,
        ordered by newest first. Eager-loads author, comments, and likes to avoid N+1 queries.
        """
        stmt = (
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

        role_str = user_role.lower().strip() if user_role else ""

        # Admin / Super Admin can view all posts
        if role_str in ("admin", "super admin", "superadmin"):
            pass
        elif role_str == "student":
            # Student sees PUBLIC, STUDENTS_ONLY, STUDENTS_AND_ALUMNI, or their own posts
            allowed_visibilities = [
                PostVisibility.PUBLIC,
                PostVisibility.STUDENTS_ONLY,
                PostVisibility.STUDENTS_AND_ALUMNI,
            ]
            if current_user_id:
                stmt = stmt.where(
                    or_(
                        Post.visibility.in_(allowed_visibilities),
                        Post.author_id == current_user_id,
                    )
                )
            else:
                stmt = stmt.where(Post.visibility.in_(allowed_visibilities))
        elif role_str == "alumni":
            # Alumni sees PUBLIC, STUDENTS_AND_ALUMNI, or their own posts
            allowed_visibilities = [
                PostVisibility.PUBLIC,
                PostVisibility.STUDENTS_AND_ALUMNI,
            ]
            if current_user_id:
                stmt = stmt.where(
                    or_(
                        Post.visibility.in_(allowed_visibilities),
                        Post.author_id == current_user_id,
                    )
                )
            else:
                stmt = stmt.where(Post.visibility.in_(allowed_visibilities))
        else:
            # Faculty, Recruiter, guest, or others see PUBLIC or their own posts
            if current_user_id:
                stmt = stmt.where(
                    or_(
                        Post.visibility == PostVisibility.PUBLIC,
                        Post.author_id == current_user_id,
                    )
                )
            else:
                stmt = stmt.where(Post.visibility == PostVisibility.PUBLIC)

        result = await self.db.execute(stmt)
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
