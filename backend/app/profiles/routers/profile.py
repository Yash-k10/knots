import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ValidationError
from app.core.response_models import APIResponse
from app.profiles.schemas.profile import (
    EducationCreate,
    EducationResponse,
    EducationUpdate,
    EmploymentHistoryCreate,
    EmploymentHistoryResponse,
    EmploymentHistoryUpdate,
    ProfileResponse,
    ProfileUpdate,
)
from app.profiles.services.profile import ProfileService
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


# --- Education Endpoints ---


@router.post("/me/education", response_model=APIResponse[EducationResponse])
async def add_education_route(
    payload: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an education entry to the logged-in user's profile."""
    service = ProfileService(db)
    education = await service.add_education(current_user.id, payload)
    return APIResponse(message="Education entry added successfully", data=education)


@router.put(
    "/me/education/{education_id}", response_model=APIResponse[EducationResponse]
)
async def update_education_route(
    education_id: int,
    payload: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an education entry on the logged-in user's profile."""
    service = ProfileService(db)
    education = await service.update_education(current_user.id, education_id, payload)
    return APIResponse(message="Education entry updated successfully", data=education)


@router.delete(
    "/me/education/{education_id}", response_model=APIResponse[EducationResponse]
)
async def delete_education_route(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an education entry from the logged-in user's profile."""
    service = ProfileService(db)
    education = await service.delete_education(current_user.id, education_id)
    return APIResponse(message="Education entry deleted successfully", data=education)


# --- Experience Endpoints ---


@router.post("/me/experience", response_model=APIResponse[EmploymentHistoryResponse])
async def add_experience_route(
    payload: EmploymentHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an experience entry to the logged-in user's profile."""
    service = ProfileService(db)
    experience = await service.add_employment_history(current_user.id, payload)
    return APIResponse(message="Experience entry added successfully", data=experience)


@router.put(
    "/me/experience/{employment_id}",
    response_model=APIResponse[EmploymentHistoryResponse],
)
async def update_experience_route(
    employment_id: int,
    payload: EmploymentHistoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an experience entry on the logged-in user's profile."""
    service = ProfileService(db)
    experience = await service.update_employment_history(
        current_user.id, employment_id, payload
    )
    return APIResponse(message="Experience entry updated successfully", data=experience)


@router.delete(
    "/me/experience/{employment_id}",
    response_model=APIResponse[EmploymentHistoryResponse],
)
async def delete_experience_route(
    employment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an experience entry from the logged-in user's profile."""
    service = ProfileService(db)
    experience = await service.delete_employment_history(current_user.id, employment_id)
    return APIResponse(message="Experience entry deleted successfully", data=experience)
