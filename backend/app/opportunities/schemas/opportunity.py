from datetime import datetime

from pydantic import BaseModel, Field

from app.opportunities.models.opportunity import OpportunityStatus, OpportunityType
from app.opportunities.models.opportunity_application import (
    OpportunityApplicationStatus,
)

# ── Opportunity Schemas ──────────────────────────────────────────────────────


class OpportunityCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    opportunity_type: OpportunityType = OpportunityType.JOB
    required_skills: list[str] | None = None
    department: str | None = None
    location: str | None = None
    stipend_or_salary: str | None = None
    duration: str | None = None
    max_applicants: int | None = None
    application_deadline: datetime | None = None
    form_link: str | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    opportunity_type: OpportunityType | None = None
    required_skills: list[str] | None = None
    department: str | None = None
    location: str | None = None
    stipend_or_salary: str | None = None
    duration: str | None = None
    max_applicants: int | None = None
    application_deadline: datetime | None = None
    status: OpportunityStatus | None = None
    form_link: str | None = None


class OpportunityResponse(BaseModel):
    id: int
    title: str
    description: str
    opportunity_type: OpportunityType
    required_skills: list[str] | None = None
    department: str | None = None
    location: str | None = None
    stipend_or_salary: str | None = None
    duration: str | None = None
    max_applicants: int | None = None
    application_deadline: datetime | None = None
    status: OpportunityStatus
    form_link: str | None = None
    posted_by_id: int
    created_at: datetime
    updated_at: datetime
    applications_count: int = 0

    # Nested author info
    posted_by_name: str | None = None
    posted_by_department: str | None = None
    posted_by_avatar: str | None = None

    model_config = {"from_attributes": True}


# ── Application Schemas ──────────────────────────────────────────────────────


class OpportunityApplicationCreate(BaseModel):
    message: str | None = None
    resume_url: str | None = None


class OpportunityApplicationUpdate(BaseModel):
    status: OpportunityApplicationStatus


class OpportunityApplicationResponse(BaseModel):
    id: int
    opportunity_id: int
    applicant_id: int
    message: str | None = None
    resume_url: str | None = None
    status: OpportunityApplicationStatus
    applied_at: datetime
    updated_at: datetime

    # Nested applicant info
    applicant_name: str | None = None
    applicant_email: str | None = None
    applicant_department: str | None = None
    applicant_skills: list[str] | dict | None = None
    applicant_avatar: str | None = None

    # Nested opportunity info (for student's "my applications" view)
    opportunity_title: str | None = None
    opportunity_type: OpportunityType | None = None

    model_config = {"from_attributes": True}


# ── Student Search Schema ───────────────────────────────────────────────────


class StudentSearchResult(BaseModel):
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    skills: list[str] | dict | None = None
    profile_picture: str | None = None
    bio: str | None = None

    model_config = {"from_attributes": True}
