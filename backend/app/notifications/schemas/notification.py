from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    is_read: bool
    type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
