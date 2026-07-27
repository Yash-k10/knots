from datetime import date
from typing import Any

from pydantic import BaseModel


# --- Education Schemas ---
class EducationBase(BaseModel):
    institution_name: str
    degree: str
    field_of_study: str | None = None
    start_date: date
    end_date: date | None = None
    gpa: float | None = None
    description: str | None = None


class EducationCreate(EducationBase):
    pass


class EducationUpdate(BaseModel):
    institution_name: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    gpa: float | None = None
    description: str | None = None


class EducationResponse(EducationBase):
    id: int
    profile_id: int

    class Config:
        from_attributes = True


# --- Employment History (Experience) Schemas ---
class EmploymentHistoryBase(BaseModel):
    company_name: str
    title: str
    location: str | None = None
    start_date: date
    end_date: date | None = None
    description: str | None = None


class EmploymentHistoryCreate(EmploymentHistoryBase):
    pass


class EmploymentHistoryUpdate(BaseModel):
    company_name: str | None = None
    title: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None


class EmploymentHistoryResponse(EmploymentHistoryBase):
    id: int
    profile_id: int

    class Config:
        from_attributes = True


# --- Profile Schemas ---
class ProfileBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    bio: str | None = None
    graduation_year: int | None = None
    department: str | None = None
    skills: list[str] | dict[str, list[str]] | None = None
    profile_picture: str | None = None
    certifications: list[dict[str, Any]] | None = None
    projects: list[dict[str, Any]] | None = None


class ProfileUpdate(ProfileBase):
    pass


class SkillEndorsementInfo(BaseModel):
    id: int
    profile_id: int
    skill_name: str
    endorser_id: int
    endorser_name: str

    class Config:
        from_attributes = True


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    education: list[EducationResponse] = []
    employment_history: list[EmploymentHistoryResponse] = []
    endorsements: list[SkillEndorsementInfo] = []
    connection_count: int = 0

    class Config:
        from_attributes = True
