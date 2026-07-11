from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.profiles.schemas.profile import ProfileUpdate, ProfileResponse
from app.profiles.services.profile import ProfileService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.put("/me", response_model=APIResponse[ProfileResponse])
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update profile details for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.update_profile(current_user.id, payload)
    return APIResponse(message="Profile updated successfully", data=profile)
