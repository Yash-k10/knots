from pydantic import BaseModel
from typing import List


class SystemStats(BaseModel):
    total_users: int
    total_connections: int
    total_jobs: int
    total_posts: int


class ProfileViewItem(BaseModel):
    date: str
    views: int


class ProfileViewsResponse(BaseModel):
    total_views: int
    history: List[ProfileViewItem]


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
    posts: List[PostEngagementItem]


class TrendingPostResponse(BaseModel):
    post_id: int
    content: str
    created_at: str
    author_name: str
    likes: int
    comments: int
    views: int
    score: int
