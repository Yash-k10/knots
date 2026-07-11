from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime
    location: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    date: datetime
    location: Optional[str] = None
    organizer_id: int
    created_at: datetime

    class Config:
        from_attributes = True
