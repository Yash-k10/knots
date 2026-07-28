from pydantic import BaseModel


class SystemStats(BaseModel):
    total_users: int
    total_connections: int
    total_jobs: int
    total_posts: int
    total_events: int = 0
    total_clubs: int = 0
    total_likes: int = 0
    total_comments: int = 0
    total_post_views: int = 0
    total_profile_views: int = 0


class PlatformEngagementSummary(BaseModel):
    total_likes: int
    total_comments: int
    total_post_views: int
    total_profile_views: int
    total_engagement_actions: int


class ProfileViewItem(BaseModel):
    date: str
    views: int


class ProfileViewsResponse(BaseModel):
    total_views: int
    history: list[ProfileViewItem]


class PostEngagementItem(BaseModel):
    post_id: int
    content_snippet: str
    created_at: str
    likes: int
    comments: int
    views: int


class PostEngagementResponse(BaseModel):
    total_likes: int
    total_comments: int
    total_views: int
    posts: list[PostEngagementItem]


class TrendingPostResponse(BaseModel):
    post_id: int
    content: str
    created_at: str
    author_name: str
    likes: int
    comments: int
    views: int
    score: int
