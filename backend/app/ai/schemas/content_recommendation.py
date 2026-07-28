from pydantic import BaseModel, Field


class ContentRecommendationResponse(BaseModel):
    post_id: int
    author_id: int
    author_name: str | None = None
    author_avatar: str | None = None
    content: str
    image_url: str | None = None
    created_at: str | None = None
    like_count: int = 0
    comment_count: int = 0
    relevance_score: int
    matched_topics: list[str] = Field(default_factory=list)
    reason: str
