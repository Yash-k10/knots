from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user, RoleRequired
from app.core.database import get_db
from app.core.exceptions import AuthorizationError
from app.core.response_models import APIResponse
from app.users.models.user import User
from app.users.schemas.user import UserCreate, UserResponse, UserUpdate
from app.users.schemas.role import RoleResponse, UserRoleUpdate
from app.users.services.user import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=APIResponse[UserResponse])
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user in the platform."""
    service = UserService(db)
    user = await service.create_user(payload)
    return APIResponse(message="User registered successfully", data=user)


@router.get("/me", response_model=APIResponse[UserResponse])
async def read_user_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return APIResponse(data=current_user)


@router.get("/roles", response_model=APIResponse[List[RoleResponse]])
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all available database roles (authenticated users only)."""
    service = UserService(db)
    roles = await service.get_all_roles()
    return APIResponse(data=roles)


@router.get("", response_model=APIResponse[List[UserResponse]])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a paginated list of users."""
    service = UserService(db)
    users = await service.list_users(skip=skip, limit=limit)
    return APIResponse(data=users)


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
async def read_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details of a specific user by ID."""
    service = UserService(db)
    user = await service.get_user(user_id)
    return APIResponse(data=user)


@router.patch("/{user_id}", response_model=APIResponse[UserResponse])
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's details. Users can only update their own account unless they are Admin."""
    is_admin = current_user.role and current_user.role.name == "Admin"
    if current_user.id != user_id and not is_admin:
        raise AuthorizationError("You are not authorized to update this user")

    if payload.is_active is not None and not is_admin:
        raise AuthorizationError("Only administrators can activate/deactivate accounts")

    service = UserService(db)
    user = await service.update_user(user_id, payload)
    return APIResponse(message="User updated successfully", data=user)


@router.delete("/{user_id}", response_model=APIResponse[UserResponse])
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account. Users can only delete their own account unless they are Admin."""
    is_admin = current_user.role and current_user.role.name == "Admin"
    if current_user.id != user_id and not is_admin:
        raise AuthorizationError("You are not authorized to delete this user")

    service = UserService(db)
    user = await service.delete_user(user_id)
    return APIResponse(message="User deleted successfully", data=user)


@router.put("/{user_id}/role", response_model=APIResponse[UserResponse])
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    current_user: User = Depends(RoleRequired(["Admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role (Admin only)."""
    service = UserService(db)
    user = await service.update_user_role(user_id, payload.role_id)
    return APIResponse(message="User role updated successfully", data=user)
