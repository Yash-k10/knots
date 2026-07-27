from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    is_read: bool
    type: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
