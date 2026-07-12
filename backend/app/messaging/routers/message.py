from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.messaging.schemas.message import MessageCreate, MessageResponse
from app.messaging.services.message import MessageService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/messages", tags=["Messaging"])


@router.post("", response_model=APIResponse[MessageResponse])
async def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a direct message to another user."""
    service = MessageService(db)
    msg = await service.send_message(current_user.id, payload)
    return APIResponse(message="Message sent successfully", data=msg)
