from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.search.schemas.search import GlobalSearchResponse
from app.search.services.search import SearchService
from app.users.models.user import User

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=APIResponse[GlobalSearchResponse])
async def global_search(
    q: str = Query(..., min_length=1, description="Search keyword query"),
    category: Optional[str] = Query(
        "all", description="Category filter: all, users, posts, jobs, events"
    ),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Global search across users, posts, jobs, and events."""
    service = SearchService(db)
    results = await service.search_all(query=q, category=category, limit=limit)
    return APIResponse(data=results)
