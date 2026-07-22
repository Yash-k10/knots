from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.jobs.models.enums import ApplicationStatusEnum


class ApplicationBase(BaseModel):
    resume_url: Optional[str] = Field(
        None, max_length=500, description="URL to resume document"
    )
    resume_text: Optional[str] = Field(
        None, description="Plain text representation of resume"
    )
    cover_letter: Optional[str] = Field(None, description="Optional cover letter text")


class ApplicationCreate(ApplicationBase):
    job_posting_id: int = Field(
        ..., description="ID of the job posting being applied for"
    )


class ApplicationUpdate(BaseModel):
    resume_url: Optional[str] = Field(None, max_length=500)
    resume_text: Optional[str] = None
    cover_letter: Optional[str] = None
    status: Optional[ApplicationStatusEnum] = None


class ApplicationResponse(ApplicationBase):
    id: int
    job_posting_id: int
    applicant_id: int
    status: ApplicationStatusEnum
    applied_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
