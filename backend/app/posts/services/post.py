from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.posts.models.comment import Comment
from app.posts.models.like import Like
from app.posts.models.post import Post
from app.posts.repository.comment import CommentRepository
from app.posts.repository.like import LikeRepository
from app.posts.repository.post import PostRepository
from app.posts.schemas.post import (
    CommentCreate,
    PostCreate,
    PostDetailResponse,
    PostResponse,
    PostUpdate,
)


class PostService:
    """Business-logic layer for Posts, Comments, and Likes."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.post_repo = PostRepository(db)
        self.comment_repo = CommentRepository(db)
        self.like_repo = LikeRepository(db)

    # ── Post CRUD ────────────────────────────────────────────────────────────

    async def create_post(self, author_id: int, payload: PostCreate) -> Post:
        """Create a new post."""
        data = payload.model_dump()
        data["author_id"] = author_id
        return await self.post_repo.create(data)

    async def get_post(self, post_id: int) -> Post:
        """Fetch a single post or raise NotFoundError."""
        post = await self.post_repo.get(post_id)
        if not post:
            raise NotFoundError(message=f"Post with id {post_id} not found")
        return post

    async def get_post_detail(
        self, post_id: int, current_user_id: int | None = None
    ) -> PostDetailResponse:
        """Fetch a post with full details (comments, likes, author)."""
        post = await self.post_repo.get_with_details(post_id)
        if not post:
            raise NotFoundError(message=f"Post with id {post_id} not found")

        is_liked = False
        if current_user_id:
            existing = await self.like_repo.get_by_post_and_user(
                post_id, current_user_id
            )
            is_liked = existing is not None

        return PostDetailResponse(
            id=post.id,
            author_id=post.author_id,
            author=post.author,
            content=post.content,
            image_url=post.image_url,
            visibility=post.visibility,
            created_at=post.created_at,
            updated_at=post.updated_at,
            likes_count=len(post.likes),
            comments_count=len(post.comments),
            is_liked=is_liked,
            comments=post.comments,
        )

    async def get_feed(
        self,
        skip: int = 0,
        limit: int = 20,
        current_user_id: int | None = None,
    ) -> list[PostResponse]:
        """Fetch the public post feed (newest first)."""
        posts = await self.post_repo.get_feed(skip=skip, limit=limit)
        results: list[PostResponse] = []
        for post in posts:
            is_liked = False
            if current_user_id:
                existing = await self.like_repo.get_by_post_and_user(
                    post.id, current_user_id
                )
                is_liked = existing is not None

            results.append(
                PostResponse(
                    id=post.id,
                    author_id=post.author_id,
                    author=post.author,
                    content=post.content,
                    image_url=post.image_url,
                    visibility=post.visibility,
                    created_at=post.created_at,
                    updated_at=post.updated_at,
                    likes_count=len(post.likes),
                    comments_count=len(post.comments),
                    is_liked=is_liked,
                )
            )
        return results

    async def get_posts_by_author(
        self, author_id: int, skip: int = 0, limit: int = 20
    ) -> list[PostResponse]:
        """Fetch all posts by a specific author."""
        posts = await self.post_repo.get_by_author(author_id, skip=skip, limit=limit)
        return [
            PostResponse(
                id=p.id,
                author_id=p.author_id,
                author=p.author,
                content=p.content,
                image_url=p.image_url,
                visibility=p.visibility,
                created_at=p.created_at,
                updated_at=p.updated_at,
                likes_count=len(p.likes),
                comments_count=len(p.comments),
            )
            for p in posts
        ]

    async def update_post(
        self, post_id: int, author_id: int, payload: PostUpdate
    ) -> Post:
        """Update a post (only the author can update)."""
        post = await self.get_post(post_id)
        if post.author_id != author_id:
            raise AuthorizationError(message="You can only edit your own posts")

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return post

        return await self.post_repo.update(post, update_data)

    async def delete_post(self, post_id: int, author_id: int) -> Post:
        """Delete a post (only the author can delete)."""
        post = await self.get_post(post_id)
        if post.author_id != author_id:
            raise AuthorizationError(message="You can only delete your own posts")

        return await self.post_repo.remove(post_id)

    # ── Likes ────────────────────────────────────────────────────────────────

    async def like_post(self, post_id: int, user_id: int) -> Like:
        """Like a post. Raises ConflictError if already liked."""
        await self.get_post(post_id)  # ensure post exists

        existing = await self.like_repo.get_by_post_and_user(post_id, user_id)
        if existing:
            raise ConflictError(message="You have already liked this post")

        return await self.like_repo.create({"post_id": post_id, "user_id": user_id})

    async def unlike_post(self, post_id: int, user_id: int) -> None:
        """Remove a like from a post. Raises NotFoundError if not liked."""
        existing = await self.like_repo.get_by_post_and_user(post_id, user_id)
        if not existing:
            raise NotFoundError(message="You have not liked this post")

        await self.like_repo.remove(existing.id)

    # ── Comments ─────────────────────────────────────────────────────────────

    async def add_comment(
        self, post_id: int, author_id: int, payload: CommentCreate
    ) -> Comment:
        """Add a comment to a post."""
        await self.get_post(post_id)  # ensure post exists

        return await self.comment_repo.create(
            {
                "post_id": post_id,
                "author_id": author_id,
                "content": payload.content,
            }
        )

    async def get_comments(
        self, post_id: int, skip: int = 0, limit: int = 50
    ) -> list[Comment]:
        """Fetch comments for a post, oldest first."""
        await self.get_post(post_id)  # ensure post exists
        return await self.comment_repo.get_by_post(post_id, skip=skip, limit=limit)

    async def delete_comment(self, post_id: int, comment_id: int, user_id: int) -> None:
        """Delete a comment (only the comment author can delete)."""
        comment = await self.comment_repo.get(comment_id)
        if not comment:
            raise NotFoundError(message=f"Comment with id {comment_id} not found")
        if comment.post_id != post_id:
            raise NotFoundError(message="Comment does not belong to this post")
        if comment.author_id != user_id:
            raise AuthorizationError(message="You can only delete your own comments")

        await self.comment_repo.remove(comment_id)
