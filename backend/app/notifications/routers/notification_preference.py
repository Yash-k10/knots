from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.notifications.schemas.notification_preference import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)
from app.notifications.services.notification_preference import (
    NotificationPreferenceService,
)
from app.users.models.user import User

router = APIRouter(
    prefix="/notifications/preferences", tags=["Notification Preferences"]
)


@router.get("", response_model=APIResponse[NotificationPreferenceResponse])
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the current user's notification preferences.
    If no preferences have been saved yet, returns the defaults (all enabled).
    """
    service = NotificationPreferenceService(db)
    prefs = await service.get_preferences(current_user.id)
    return APIResponse(data=prefs)


@router.patch("", response_model=APIResponse[NotificationPreferenceResponse])
async def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Partially update the current user's notification preferences.
    Send only the fields you want to change — omitted fields are left unchanged.
    """
    service = NotificationPreferenceService(db)
    prefs = await service.update_preferences(current_user.id, payload)
    return APIResponse(data=prefs)
