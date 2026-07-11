from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.users.schemas.user import UserCreate, UserResponse
from app.users.services.user import UserService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=APIResponse[UserResponse])
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user in the platform."""
    service = UserService(db)
    user = await service.create_user(payload)
    return APIResponse(message="User registered successfully", data=user)


@router.get("/me", response_model=APIResponse[UserResponse])
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of the currently authenticated user."""
    return APIResponse(data=current_user)
