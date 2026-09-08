from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import RoleRequired, get_current_user
from app.core.database import get_db
from app.core.exceptions import AuthorizationError
from app.core.response_models import APIResponse
from app.users.models.user import User
from app.users.schemas.role import RoleResponse, UserRoleUpdate
from app.users.schemas.user import ChangePassword, UserCreate, UserResponse, UserUpdate
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


@router.delete("/me", response_model=APIResponse[UserResponse])
async def delete_user_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the currently authenticated user's account and profile data."""
    service = UserService(db)
    user = await service.delete_user(current_user.id)
    return APIResponse(message="Account deleted successfully", data=user)


@router.post("/me/change-password", response_model=APIResponse[UserResponse])
async def change_password(
    payload: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password after verifying the current one."""
    service = UserService(db)
    user = await service.change_password(current_user.id, payload)
    return APIResponse(message="Password changed successfully", data=user)


@router.get("/roles", response_model=APIResponse[list[RoleResponse]])
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all available database roles (authenticated users only)."""
    service = UserService(db)
    roles = await service.get_all_roles()
    return APIResponse(data=roles)


@router.get("", response_model=APIResponse[list[UserResponse]])
async def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a paginated list of users (Super Admin is stealth to regular users)."""
    service = UserService(db)
    users = await service.list_users(skip=skip, limit=limit)
    is_viewer_superadmin = current_user.role and current_user.role.name == "Super Admin"
    if not is_viewer_superadmin:
        users = [u for u in users if not (u.role and u.role.name == "Super Admin")]
    return APIResponse(data=users)


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
async def read_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details of a specific user by ID."""
    from app.core.exceptions import NotFoundError

    service = UserService(db)
    user = await service.get_user(user_id)
    is_viewer_superadmin = current_user.role and current_user.role.name == "Super Admin"
    if (
        user.role
        and user.role.name == "Super Admin"
        and current_user.id != user_id
        and not is_viewer_superadmin
    ):
        raise NotFoundError(message="User not found")
    return APIResponse(data=user)


@router.patch("/{user_id}", response_model=APIResponse[UserResponse])
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's details. Users can only update their own account unless they are Admin or Super Admin."""
    role_name = current_user.role.name.lower().strip() if current_user.role else ""
    is_admin = role_name in ("admin", "super admin", "superadmin")
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
    """Delete a user account. Users can only delete their own account unless they are Admin or Super Admin."""
    role_name = current_user.role.name.lower().strip() if current_user.role else ""
    is_admin = role_name in ("admin", "super admin", "superadmin")
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
