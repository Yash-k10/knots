from pydantic import BaseModel, Field


class ConnectionSuggestionResponse(BaseModel):
    user_id: int
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    bio: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    profile_picture: str | None = None
    skills: list[str] = Field(default_factory=list)
    match_score: int
    common_skills: list[str] = Field(default_factory=list)
    reason: str
