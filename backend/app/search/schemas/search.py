from typing import List, Optional
from pydantic import BaseModel


class UserSearchResult(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class PostSearchResult(BaseModel):
    id: int
    content: str
    author_id: int
    author_name: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class JobSearchResult(BaseModel):
    id: int
    title: str
    company_name: Optional[str] = None
    location: Optional[str] = None
    job_type: str

    class Config:
        from_attributes = True


class EventSearchResult(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_datetime: str

    class Config:
        from_attributes = True


class GlobalSearchResponse(BaseModel):
    query: str
    total_results: int
    users: List[UserSearchResult] = []
    posts: List[PostSearchResult] = []
    jobs: List[JobSearchResult] = []
    events: List[EventSearchResult] = []
