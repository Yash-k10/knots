from datetime import datetime

from pydantic import BaseModel

from app.posts.schemas.post import PostAuthor, PostResponse


class AuditLogResponse(BaseModel):
    id: int
    actor_id: int | None = None
    action: str
    target: str | None = None
    ip_address: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class FlaggedPostCreate(BaseModel):
    reason: str | None = None


class FlaggedPostResolve(BaseModel):
    action: str  # "resolved" or "dismissed"


class FlaggedPostResponse(BaseModel):
    id: int
    post_id: int
    flagger_id: int
    reason: str | None = None
    status: str
    created_at: datetime
    post: PostResponse | None = None
    flagger: PostAuthor | None = None

    class Config:
        from_attributes = True


class DailyActivity(BaseModel):
    posts_today: int = 0
    users_today: int = 0
    actions_today: int = 0


class DashboardStatsResponse(BaseModel):
    total_users: int = 0
    total_posts: int = 0
    active_users: int = 0
    daily_activity: DailyActivity
