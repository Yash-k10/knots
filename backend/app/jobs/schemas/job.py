from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class JobCreate(BaseModel):
    title: str
    description: str
    company_id: int
    location: Optional[str] = None
    salary_range: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    company_id: int
    location: Optional[str] = None
    salary_range: Optional[str] = None
    creator_id: int
    created_at: datetime

    class Config:
        from_attributes = True
