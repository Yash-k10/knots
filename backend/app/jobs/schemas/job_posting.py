from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

from app.jobs.models.enums import JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum
from app.jobs.schemas.company import CompanyResponse


class JobPostingBase(BaseModel):
    title: str = Field(..., max_length=255, description="Job title")
    description: str = Field(..., description="Full job description")
    job_type: JobTypeEnum = Field(default=JobTypeEnum.FULL_TIME)
    location: Optional[str] = Field(None, max_length=255, description="Job location")
    workplace_type: WorkplaceTypeEnum = Field(default=WorkplaceTypeEnum.ON_SITE)
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary")
    salary_range: Optional[str] = Field(
        None, max_length=100, description="Human-readable salary string"
    )
    required_skills: Optional[List[str]] = Field(
        default_factory=list, description="List of required skills"
    )
    application_deadline: Optional[datetime] = None
    status: JobStatusEnum = Field(default=JobStatusEnum.OPEN)


class JobPostingCreate(JobPostingBase):
    company_id: int = Field(..., description="ID of the company posting the job")


class JobPostingUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    company_id: Optional[int] = None
    job_type: Optional[JobTypeEnum] = None
    location: Optional[str] = Field(None, max_length=255)
    workplace_type: Optional[WorkplaceTypeEnum] = None
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_range: Optional[str] = Field(None, max_length=100)
    required_skills: Optional[List[str]] = None
    application_deadline: Optional[datetime] = None
    status: Optional[JobStatusEnum] = None


class JobPostingResponse(JobPostingBase):
    id: int
    company_id: int
    posted_by_id: int
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Backward compatibility aliases
JobCreate = JobPostingCreate
JobResponse = JobPostingResponse
JobUpdate = JobPostingUpdate
