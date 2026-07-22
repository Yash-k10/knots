from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.messaging.schemas.message import MessageCreate, MessageResponse
from app.messaging.services.message import MessageService
from app.messaging.repository.conversation import ConversationRepository
from app.messaging.websocket_manager import manager
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

    # Real-time WebSocket delivery
    conv_repo = ConversationRepository(db)
    conv = await conv_repo.get(msg.conversation_id)
    participant_ids = [p.user_id for p in conv.participants] if conv else []
    if not participant_ids and msg.receiver_id:
        participant_ids = [current_user.id, msg.receiver_id]

    ws_payload = {
        "type": "new_message",
        "message": {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "is_read": msg.is_read,
        },
    }
    await manager.broadcast_to_conversation(ws_payload, participant_ids)

    return APIResponse(message="Message sent successfully", data=msg)
