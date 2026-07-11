from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import get_current_user
from app.notifications.schemas.notification import NotificationResponse
from app.notifications.services.notification import NotificationService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=APIResponse[List[NotificationResponse]])
async def read_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve notifications for the logged in user."""
    service = NotificationService(db)
    notifications = await service.get_user_notifications(current_user.id)
    return APIResponse(data=notifications)
