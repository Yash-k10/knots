from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import get_current_user
from app.clubs.schemas.club import ClubCreate, ClubResponse
from app.clubs.services.club import ClubService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/clubs", tags=["Clubs"])


@router.post("", response_model=APIResponse[ClubResponse])
async def create_club(
    payload: ClubCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new college club."""
    service = ClubService(db)
    club = await service.create_club(current_user.id, payload)
    return APIResponse(message="Club created successfully", data=club)


@router.get("", response_model=APIResponse[List[ClubResponse]])
async def read_clubs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve college clubs list with pagination."""
    service = ClubService(db)
    clubs = await service.list_clubs(skip=skip, limit=limit)
    return APIResponse(data=clubs)
