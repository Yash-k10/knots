from datetime import date
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union


# --- Education Schemas ---
class EducationBase(BaseModel):
    institution_name: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    gpa: Optional[float] = None
    description: Optional[str] = None


class EducationCreate(EducationBase):
    pass


class EducationUpdate(BaseModel):
    institution_name: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[float] = None
    description: Optional[str] = None


class EducationResponse(EducationBase):
    id: int
    profile_id: int

    class Config:
        from_attributes = True


# --- Employment History (Experience) Schemas ---
class EmploymentHistoryBase(BaseModel):
    company_name: str
    title: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    description: Optional[str] = None


class EmploymentHistoryCreate(EmploymentHistoryBase):
    pass


class EmploymentHistoryUpdate(BaseModel):
    company_name: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class EmploymentHistoryResponse(EmploymentHistoryBase):
    id: int
    profile_id: int

    class Config:
        from_attributes = True


# --- Profile Schemas ---
class ProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    skills: Optional[Union[List[str], Dict[str, List[str]]]] = None
    profile_picture: Optional[str] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None


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
    education: List[EducationResponse] = []
    employment_history: List[EmploymentHistoryResponse] = []
    endorsements: List[SkillEndorsementInfo] = []
    connection_count: int = 0

    class Config:
        from_attributes = True
