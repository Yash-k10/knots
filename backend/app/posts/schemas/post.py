from datetime import datetime

from pydantic import BaseModel, Field

from app.posts.models.post import PostVisibility

# ── Post Schemas ─────────────────────────────────────────────────────────────


class PostCreate(BaseModel):
    """Payload to create a new post."""

    content: str = Field(..., min_length=1, max_length=5000)
    image_url: str | None = None
    visibility: PostVisibility = PostVisibility.PUBLIC


class PostUpdate(BaseModel):
    """Payload to update an existing post (all fields optional)."""

    content: str | None = Field(None, min_length=1, max_length=5000)
    image_url: str | None = None
    visibility: PostVisibility | None = None


# ── Comment Schemas ──────────────────────────────────────────────────────────


class CommentCreate(BaseModel):
    """Payload to add a comment to a post."""

    content: str = Field(..., min_length=1, max_length=2000)


class CommentAuthor(BaseModel):
    """Compact author info embedded in comment responses."""

    id: int
    email: str

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    """API response for a single comment."""

    id: int
    post_id: int
    author_id: int
    author: CommentAuthor | None = None
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Like Schemas ─────────────────────────────────────────────────────────────


class LikeResponse(BaseModel):
    """API response for a single like."""

    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Post Response Schemas ────────────────────────────────────────────────────


class PostAuthor(BaseModel):
    """Compact author info embedded in post responses."""

    id: int
    email: str

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    """API response for a single post (summary view)."""

    id: int
    author_id: int
    author: PostAuthor | None = None
    content: str
    image_url: str | None = None
    visibility: PostVisibility
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False  # whether the current user has liked this post

    class Config:
        from_attributes = True


class PostDetailResponse(BaseModel):
    """API response for a single post (detail view with comments)."""

    id: int
    author_id: int
    author: PostAuthor | None = None
    content: str
    image_url: str | None = None
    visibility: PostVisibility
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    comments: list[CommentResponse] = []

    class Config:
        from_attributes = True
