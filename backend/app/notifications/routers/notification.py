from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.notifications.schemas.notification import (
    NotificationResponse,
    NotificationCreate,
    UnreadCountResponse,
)
from app.notifications.services.notification import NotificationService
from app.users.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=APIResponse[list[NotificationResponse]])
async def read_notifications(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Retrieve notifications for the logged in user."""
    service = NotificationService(db)
    notifications = await service.get_user_notifications(current_user.id)
    return APIResponse(data=notifications)


@router.get("/unread-count", response_model=APIResponse[UnreadCountResponse])
async def get_unread_count(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get total count of unread notifications for current user."""
    service = NotificationService(db)
    count = await service.get_unread_count(current_user.id)
    return APIResponse(data=UnreadCountResponse(unread_count=count))


@router.post(
    "",
    response_model=APIResponse[NotificationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_notification(
    payload: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new notification and trigger real-time WebSocket push."""
    service = NotificationService(db)
    notification = await service.create_notification(
        user_id=payload.user_id,
        title=payload.title,
        content=payload.content,
        type=payload.type,
    )
    return APIResponse(data=notification)


@router.patch("/{notification_id}/read", response_model=APIResponse[dict])
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific notification as read."""
    service = NotificationService(db)
    success = await service.mark_as_read(notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied",
        )
    return APIResponse(data={"message": "Notification marked as read"})


@router.patch("/read-all", response_model=APIResponse[dict])
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for current user."""
    service = NotificationService(db)
    count = await service.mark_all_as_read(current_user.id)
    return APIResponse(data={"message": f"Marked {count} notifications as read"})
