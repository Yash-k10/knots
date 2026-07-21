from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class MessageCreate(BaseModel):
    conversation_id: Optional[int] = None
    receiver_id: Optional[int] = None
    content: str = Field(..., min_length=1)


class DirectMessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    id: int
    conversation_id: Optional[int] = None
    sender_id: int
    receiver_id: Optional[int] = None
    content: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
