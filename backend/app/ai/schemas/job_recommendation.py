from pydantic import BaseModel, Field


class JobRecommendationResponse(BaseModel):
    job_id: int
    title: str
    company_name: str | None = None
    location: str | None = None
    job_type: str | None = None
    workplace_type: str | None = None
    salary_range: str | None = None
    required_skills: list[str] = Field(default_factory=list)
    match_score: int
    matching_skills: list[str] = Field(default_factory=list)
    reason: str
