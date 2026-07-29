import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.schemas.admin import FlaggedPostCreate, FlaggedPostResponse
from app.admin.services.admin import AdminService
from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.core.response_models import APIResponse
from app.posts.schemas.post import (
    CommentCreate,
    CommentResponse,
    LikeResponse,
    PostCreate,
    PostDetailResponse,
    PostResponse,
    PostUpdate,
)
from app.posts.services.post import PostService
from app.users.models.user import User

router = APIRouter(prefix="/posts", tags=["Posts"])


# ── Feed ─────────────────────────────────────────────────────────────────────


@router.get("/feed", response_model=APIResponse[list[PostResponse]])
async def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the post feed (newest first, with like/comment counts)."""
    service = PostService(db)
    posts = await service.get_feed(
        skip=skip, limit=limit, current_user_id=current_user.id
    )
    return APIResponse(data=posts)


@router.get("/user/{user_id}", response_model=APIResponse[list[PostResponse]])
async def get_user_posts(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all posts by a specific user."""
    service = PostService(db)
    posts = await service.get_posts_by_author(user_id, skip=skip, limit=limit)
    return APIResponse(data=posts)


# ── Post CRUD ────────────────────────────────────────────────────────────────


@router.post("", response_model=APIResponse[PostResponse])
async def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new post in the feed."""
    service = PostService(db)
    post = await service.create_post(current_user.id, payload)
    return APIResponse(message="Post created successfully", data=post)


@router.post("/upload-image", response_model=APIResponse[str])
async def upload_post_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image for a post and return the relative static URL."""
    upload_dir = "static/posts"
    os.makedirs(upload_dir, exist_ok=True)

    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise ValidationError("Invalid file type. Only image files are allowed.")

    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    picture_url = f"/static/posts/{filename}"
    return APIResponse(message="Image uploaded successfully", data=picture_url)


@router.get("/{post_id}", response_model=APIResponse[PostDetailResponse])
async def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single post with full details (comments, likes, author)."""
    service = PostService(db)
    post_detail = await service.get_post_detail(
        post_id, current_user_id=current_user.id
    )
    return APIResponse(data=post_detail)


@router.put("/{post_id}", response_model=APIResponse[PostResponse])
async def update_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a post (author only)."""
    service = PostService(db)
    post = await service.update_post(post_id, current_user.id, payload)
    return APIResponse(message="Post updated successfully", data=post)


@router.delete("/{post_id}", response_model=APIResponse)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post (author only)."""
    service = PostService(db)
    await service.delete_post(post_id, current_user.id)
    return APIResponse(message="Post deleted successfully")


# ── Likes ────────────────────────────────────────────────────────────────────


@router.post("/{post_id}/like", response_model=APIResponse[LikeResponse])
async def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Like a post (idempotent — returns 409 if already liked)."""
    service = PostService(db)
    like = await service.like_post(post_id, current_user.id)
    return APIResponse(message="Post liked", data=like)


@router.delete("/{post_id}/like", response_model=APIResponse)
async def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove your like from a post."""
    service = PostService(db)
    await service.unlike_post(post_id, current_user.id)
    return APIResponse(message="Post unliked")


# ── Comments ─────────────────────────────────────────────────────────────────


@router.get("/{post_id}/comments", response_model=APIResponse[list[CommentResponse]])
async def get_comments(
    post_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve comments on a post (oldest first)."""
    service = PostService(db)
    comments = await service.get_comments(post_id, skip=skip, limit=limit)
    return APIResponse(data=comments)


@router.post("/{post_id}/comments", response_model=APIResponse[CommentResponse])
async def add_comment(
    post_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a comment to a post."""
    service = PostService(db)
    comment = await service.add_comment(post_id, current_user.id, payload)
    return APIResponse(message="Comment added", data=comment)


@router.delete("/{post_id}/comments/{comment_id}", response_model=APIResponse)
async def delete_comment(
    post_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment (comment author only)."""
    service = PostService(db)
    await service.delete_comment(post_id, comment_id, current_user.id)
    return APIResponse(message="Comment deleted")


@router.post("/{post_id}/flag", response_model=APIResponse[FlaggedPostResponse])
async def flag_post(
    post_id: int,
    payload: FlaggedPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Flag a post (any authenticated user)."""
    service = AdminService(db)
    flagged = await service.flag_post(
        post_id=post_id, flagger_id=current_user.id, reason=payload.reason
    )
    return APIResponse(message="Post flagged successfully", data=flagged)
