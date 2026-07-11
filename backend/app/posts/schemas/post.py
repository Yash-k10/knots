from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None


class PostResponse(BaseModel):
    id: int
    author_id: int
    content: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
