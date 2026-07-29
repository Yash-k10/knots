from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.jobs.models.enums import JobStatusEnum, JobTypeEnum, WorkplaceTypeEnum
from app.jobs.schemas.company import CompanyResponse


class JobPostingBase(BaseModel):
    title: str = Field(..., max_length=255, description="Job title")
    description: str = Field(..., description="Full job description")
    job_type: JobTypeEnum = Field(default=JobTypeEnum.FULL_TIME)
    location: str | None = Field(None, max_length=255, description="Job location")
    workplace_type: WorkplaceTypeEnum = Field(default=WorkplaceTypeEnum.ON_SITE)
    salary_min: int | None = Field(None, ge=0, description="Minimum salary")
    salary_max: int | None = Field(None, ge=0, description="Maximum salary")
    salary_range: str | None = Field(
        None, max_length=100, description="Human-readable salary string"
    )
    required_skills: list[str] | None = Field(
        default_factory=list, description="List of required skills"
    )
    application_deadline: datetime | None = None
    status: JobStatusEnum = Field(default=JobStatusEnum.OPEN)


class JobPostingCreate(JobPostingBase):
    company_id: int = Field(..., description="ID of the company posting the job")


class JobPostingUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    company_id: int | None = None
    job_type: JobTypeEnum | None = None
    location: str | None = Field(None, max_length=255)
    workplace_type: WorkplaceTypeEnum | None = None
    salary_min: int | None = Field(None, ge=0)
    salary_max: int | None = Field(None, ge=0)
    salary_range: str | None = Field(None, max_length=100)
    required_skills: list[str] | None = None
    application_deadline: datetime | None = None
    status: JobStatusEnum | None = None


class JobPostingResponse(JobPostingBase):
    id: int
    company_id: int
    posted_by_id: int
    created_at: datetime
    updated_at: datetime
    company: CompanyResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# Backward compatibility aliases
JobCreate = JobPostingCreate
JobResponse = JobPostingResponse
JobUpdate = JobPostingUpdate
