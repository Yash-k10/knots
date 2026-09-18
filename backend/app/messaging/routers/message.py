import os

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.core.response_models import APIResponse
from app.messaging.repository.conversation import ConversationRepository
from app.messaging.schemas.conversation import UnreadCountResponse
from app.messaging.schemas.message import (
    DirectMessageCreate,
    MessageCreate,
    MessageResponse,
)
from app.messaging.services.message import MessageService
from app.core.storage import storage_service
from app.messaging.websocket_manager import manager
from app.users.models.user import User

router = APIRouter(prefix="/messages", tags=["Messaging"])


@router.post("/upload", response_model=APIResponse[str])
async def upload_chat_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an attachment (image, voice note audio, document, PDF) for chat messages."""
    allowed_extensions = {
        # Audio / Voice notes
        ".webm",
        ".mp3",
        ".wav",
        ".ogg",
        ".m4a",
        ".aac",
        # Images
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        # Documents & Projects
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
        ".zip",
        ".rar",
        ".tar",
        ".gz",
        ".xls",
        ".xlsx",
        ".csv",
        ".ppt",
        ".pptx",
        ".py",
        ".js",
        ".ts",
        ".cpp",
        ".java",
    }
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise ValidationError(
            "Unsupported file type for chat attachments. Please upload supported media, document, or audio files."
        )

    attachment_url = await storage_service.upload_file(file, folder="messages")
    return APIResponse(message="Attachment uploaded successfully", data=attachment_url)


@router.delete("/{message_id}", response_model=APIResponse)
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a sent message."""
    service = MessageService(db)
    await service.delete_message(message_id, current_user.id)
    await db.commit()
    return APIResponse(message="Message deleted successfully")


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
    conv = await conv_repo.get_conversation_with_participants(msg.conversation_id)
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
    conv = await conv_repo.get_conversation_with_participants(msg.conversation_id)
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
