from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.messaging.schemas.message import MessageResponse


class ConversationParticipantResponse(BaseModel):
    id: int
    conversation_id: int
    user_id: int
    joined_at: datetime
    last_read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    is_group: bool = False
    name: Optional[str] = None
    participant_ids: List[int] = Field(..., min_items=1)


class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    participants: List[ConversationParticipantResponse] = []
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    total_unread: int
    unread_by_conversation: dict = {}
