from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import get_current_user
from app.posts.schemas.post import PostCreate, PostResponse
from app.posts.services.post import PostService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("", response_model=APIResponse[PostResponse])
async def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new post in the feeds section."""
    service = PostService(db)
    post = await service.create_post(current_user.id, payload)
    return APIResponse(message="Post created successfully", data=post)


@router.get("", response_model=APIResponse[List[PostResponse]])
async def read_posts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve posts with pagination."""
    service = PostService(db)
    posts = await service.list_posts(skip=skip, limit=limit)
    return APIResponse(data=posts)
