from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    conversation_id: int | None = None
    receiver_id: int | None = None
    content: str = Field(..., min_length=1)


class DirectMessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    id: int
    conversation_id: int | None = None
    sender_id: int
    receiver_id: int | None = None
    content: str
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
