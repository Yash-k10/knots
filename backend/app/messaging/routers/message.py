from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.messaging.schemas.message import (
    MessageCreate,
    DirectMessageCreate,
    MessageResponse,
)
from app.messaging.schemas.conversation import UnreadCountResponse
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
    """Send a message to a conversation or recipient."""
    service = MessageService(db)
    msg = await service.send_message(current_user.id, payload)
    await db.commit()

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


@router.post("/direct", response_model=APIResponse[MessageResponse])
async def send_direct_message(
    payload: DirectMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a 1-on-1 direct message."""
    service = MessageService(db)
    msg = await service.send_direct_message(current_user.id, payload)
    await db.commit()

    # Real-time WebSocket delivery
    conv_repo = ConversationRepository(db)
    conv = await conv_repo.get(msg.conversation_id)
    participant_ids = [p.user_id for p in conv.participants] if conv else []
    if not participant_ids:
        participant_ids = [current_user.id, payload.receiver_id]

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

    return APIResponse(message="Direct message sent successfully", data=msg)


@router.get("/unread/count", response_model=APIResponse[UnreadCountResponse])
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread message count summary for current user."""
    service = MessageService(db)
    unread_summary = await service.get_unread_summary(current_user.id)
    return APIResponse(
        message="Unread count retrieved successfully", data=unread_summary
    )
