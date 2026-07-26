from pydantic import BaseModel
from typing import List, Optional


class ResumeRequest(BaseModel):
    resume_text: str


class ResumeAnalysisResponse(BaseModel):
    score: int
    feedback: str
    suggestions: List[str]


class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: List[str]


class RoadmapResponse(BaseModel):
    role: str
    steps: List[str]


class ConnectionRecommendation(BaseModel):
    user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None
    match_score: int
    match_reasons: List[str]
    shared_skills: List[str]

    class Config:
        from_attributes = True


class JobRecommendation(BaseModel):
    job_id: int
    title: str
    company_name: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    match_score: int
    match_reasons: List[str]
    matching_skills: List[str]

    class Config:
        from_attributes = True


class PostRecommendation(BaseModel):
    post_id: int
    author_id: int
    author_name: str
    content_snippet: str
    likes_count: int
    comments_count: int
    match_score: int
    match_reason: str

    class Config:
        from_attributes = True


class AIRecommendationsResponse(BaseModel):
    connections: List[ConnectionRecommendation]
    jobs: List[JobRecommendation]
    posts: List[PostRecommendation]
