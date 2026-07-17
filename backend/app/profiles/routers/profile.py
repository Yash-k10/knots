from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid
import shutil

from app.auth.dependencies.auth import get_current_user
from app.profiles.schemas.profile import ProfileUpdate, ProfileResponse
from app.profiles.services.profile import ProfileService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.core.exceptions import NotFoundError, ValidationError
from app.users.models.user import User

router = APIRouter(prefix="/profiles", tags=["Profiles"])

UPLOAD_DIR = "static/profiles"


@router.get("/me", response_model=APIResponse[ProfileResponse])
async def get_own_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve profile for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(current_user.id)
    return APIResponse(message="Profile retrieved successfully", data=profile)


@router.get("/{user_id}", response_model=APIResponse[ProfileResponse])
async def get_profile_by_user_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve profile details for any user by user ID."""
    # Check if user exists to raise NotFoundError
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found.")
    service = ProfileService(db)
    profile = await service.get_profile_by_user_id(user_id)
    return APIResponse(message="Profile retrieved successfully", data=profile)


@router.put("/me", response_model=APIResponse[ProfileResponse])
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile details for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.update_profile(current_user.id, payload)
    return APIResponse(message="Profile updated successfully", data=profile)


@router.patch("/me", response_model=APIResponse[ProfileResponse])
async def patch_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Partially update profile details for the currently logged in user."""
    service = ProfileService(db)
    profile = await service.update_profile(current_user.id, payload)
    return APIResponse(message="Profile updated successfully", data=profile)


@router.post("/me/picture", response_model=APIResponse[ProfileResponse])
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a profile picture for the currently logged in user."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise ValidationError("Invalid file type. Only image files are allowed.")

    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    picture_url = f"/static/profiles/{filename}"

    service = ProfileService(db)
    profile = await service.update_profile(
        current_user.id, ProfileUpdate(profile_picture=picture_url)
    )

    return APIResponse(message="Profile picture uploaded successfully", data=profile)
