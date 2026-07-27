from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.messaging.schemas.conversation import (
    ConversationCreate,
    ConversationParticipantResponse,
    ConversationResponse,
)
from app.messaging.schemas.message import MessageResponse
from app.messaging.services.message import MessagingService
from app.users.models.user import User

router = APIRouter(prefix="/conversations", tags=["Messaging Conversations"])


@router.get("", response_model=APIResponse[list[ConversationResponse]])
async def get_my_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all conversations for the authenticated user."""
    service = MessagingService(db)
    conversations = await service.get_user_conversations(
        current_user.id, skip=skip, limit=limit
    )
    return APIResponse(
        message="Conversations retrieved successfully", data=conversations
    )


@router.post("/group", response_model=APIResponse[ConversationResponse])
async def create_group_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new group conversation."""
    service = MessagingService(db)
    conv = await service.create_group_conversation(
        creator_id=current_user.id,
        name=payload.name,
        participant_ids=payload.participant_ids,
    )
    await db.commit()

    # Re-fetch populated conversation details
    conversations = await service.get_user_conversations(current_user.id)
    created = next((c for c in conversations if c.id == conv.id), None)
    if not created:
        now = datetime.utcnow()
        created = ConversationResponse(
            id=conv.id,
            is_group=conv.is_group,
            name=conv.name,
            created_at=getattr(conv, "created_at", None) or now,
            updated_at=getattr(conv, "updated_at", None) or now,
            participants=[
                ConversationParticipantResponse.from_orm(p)
                for p in getattr(conv, "participants", [])
            ],
            unread_count=0,
        )

    return APIResponse(message="Group conversation created successfully", data=created)


@router.get(
    "/{conversation_id}/messages", response_model=APIResponse[list[MessageResponse]]
)
async def get_conversation_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated message history for a specific conversation."""
    service = MessagingService(db)
    messages = await service.get_conversation_messages(
        user_id=current_user.id,
        conversation_id=conversation_id,
        skip=skip,
        limit=limit,
    )
    response_messages = [MessageResponse.from_orm(m) for m in messages]
    return APIResponse(
        message="Messages retrieved successfully", data=response_messages
    )


@router.post("/{conversation_id}/read", response_model=APIResponse[dict])
async def mark_conversation_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread messages in a conversation as read."""
    service = MessagingService(db)
    count = await service.mark_conversation_as_read(
        user_id=current_user.id, conversation_id=conversation_id
    )
    await db.commit()
    return APIResponse(
        message="Conversation marked as read",
        data={"conversation_id": conversation_id, "marked_read_count": count},
    )
