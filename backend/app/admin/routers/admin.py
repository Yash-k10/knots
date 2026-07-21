from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import RoleRequired, get_current_user
from app.users.models.user import User
from app.users.schemas.user import UserResponse
from app.admin.schemas.admin import (
    AuditLogResponse,
    FlaggedPostResponse,
    FlaggedPostResolve,
)
from app.admin.services.admin import AdminService
from app.core.database import get_db
from app.core.response_models import APIResponse

# Protect all routes under this admin router
router = APIRouter(
    prefix="/admin",
    tags=["Admin Only"],
    dependencies=[Depends(RoleRequired(["Admin"]))],
)


@router.get("/audit-logs", response_model=APIResponse[List[AuditLogResponse]])
async def read_audit_logs(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    """Retrieve system audit logs for administrative audit tracking."""
    service = AdminService(db)
    logs = await service.get_audit_logs(skip=skip, limit=limit)
    return APIResponse(data=logs)


@router.get("/users", response_model=APIResponse[List[UserResponse]])
async def list_users(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    """Retrieve a list of users (Admin only)."""
    service = AdminService(db)
    users = await service.list_users(skip=skip, limit=limit)
    return APIResponse(data=users)


@router.post("/users/{user_id}/ban", response_model=APIResponse[UserResponse])
async def ban_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ban a user account (Admin only)."""
    service = AdminService(db)
    client_ip = request.client.host if request.client else None
    user = await service.ban_user(
        user_id=user_id, actor_id=current_user.id, ip_address=client_ip
    )
    return APIResponse(message="User banned successfully", data=user)


@router.post("/users/{user_id}/unban", response_model=APIResponse[UserResponse])
async def unban_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unban a user account (Admin only)."""
    service = AdminService(db)
    client_ip = request.client.host if request.client else None
    user = await service.unban_user(
        user_id=user_id, actor_id=current_user.id, ip_address=client_ip
    )
    return APIResponse(message="User unbanned successfully", data=user)


@router.delete("/users/{user_id}", response_model=APIResponse[UserResponse])
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account (Admin only)."""
    service = AdminService(db)
    client_ip = request.client.host if request.client else None
    user = await service.delete_user(
        user_id=user_id, actor_id=current_user.id, ip_address=client_ip
    )
    return APIResponse(message="User deleted successfully", data=user)


@router.get("/posts/flagged", response_model=APIResponse[List[FlaggedPostResponse]])
async def list_flagged_posts(
    skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    """Retrieve a list of flagged posts (Admin only)."""
    service = AdminService(db)
    flagged = await service.list_flagged_posts(skip=skip, limit=limit)
    return APIResponse(data=flagged)


@router.post(
    "/posts/{flag_id}/resolve", response_model=APIResponse[FlaggedPostResponse]
)
async def resolve_flagged_post(
    flag_id: int,
    payload: FlaggedPostResolve,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resolve or dismiss a flag on a post (Admin only)."""
    service = AdminService(db)
    resolved = await service.resolve_flag(
        flag_id=flag_id, action=payload.action, actor_id=current_user.id
    )
    return APIResponse(message=f"Post flag marked as {payload.action}", data=resolved)


@router.delete("/posts/{post_id}", response_model=APIResponse)
async def delete_post_as_admin(
    post_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a post and create an audit log (Admin only)."""
    service = AdminService(db)
    client_ip = request.client.host if request.client else None
    await service.remove_post(
        post_id=post_id, actor_id=current_user.id, ip_address=client_ip
    )
    return APIResponse(message="Post removed successfully by Administrator")
