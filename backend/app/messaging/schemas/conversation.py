from datetime import datetime

from pydantic import BaseModel, Field

from app.messaging.schemas.message import MessageResponse
from app.users.schemas.user import UserResponse


class ConversationParticipantResponse(BaseModel):
    id: int
    conversation_id: int
    user_id: int
    joined_at: datetime
    last_read_at: datetime | None = None
    user: UserResponse | None = None

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    is_group: bool = False
    name: str | None = None
    participant_ids: list[int] = Field(..., min_items=1)


class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    name: str | None = None
    created_at: datetime
    updated_at: datetime
    participants: list[ConversationParticipantResponse] = []
    last_message: MessageResponse | None = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    total_unread: int
    unread_by_conversation: dict = {}
