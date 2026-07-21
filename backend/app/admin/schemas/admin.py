from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.posts.schemas.post import PostResponse, PostAuthor


class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    action: str
    target: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FlaggedPostCreate(BaseModel):
    reason: Optional[str] = None


class FlaggedPostResolve(BaseModel):
    action: str  # "resolved" or "dismissed"


class FlaggedPostResponse(BaseModel):
    id: int
    post_id: int
    flagger_id: int
    reason: Optional[str] = None
    status: str
    created_at: datetime
    post: Optional[PostResponse] = None
    flagger: Optional[PostAuthor] = None

    class Config:
        from_attributes = True
