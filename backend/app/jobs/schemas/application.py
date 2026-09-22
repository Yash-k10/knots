from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.jobs.models.enums import ApplicationStatusEnum
from app.jobs.schemas.job_posting import JobPostingResponse


class ApplicationBase(BaseModel):
    resume_url: str | None = Field(
        None, max_length=500, description="URL to resume document"
    )
    resume_text: str | None = Field(
        None, description="Plain text representation of resume"
    )
    cover_letter: str | None = Field(None, description="Optional cover letter text")
    status: ApplicationStatusEnum | None = Field(
        None, description="Application status (e.g. APPLIED, PENDING)"
    )

    @field_validator("status", mode="before")
    @classmethod
    def parse_status(cls, value):
        if value is None:
            return None
        if isinstance(value, ApplicationStatusEnum):
            return value
        if isinstance(value, str):
            val_norm = value.strip().lower().replace("-", "_").replace(" ", "_")
            if val_norm in [
                "reviewing",
                "reviewed",
                "under_review",
                "review",
                "tech_round",
                "interview",
            ]:
                return ApplicationStatusEnum.SHORTLISTED
            for member in ApplicationStatusEnum:
                if member.value == val_norm or member.name.lower() == val_norm:
                    return member
        return value


class ApplicationCreate(ApplicationBase):
    job_posting_id: int = Field(
        ..., description="ID of the job posting being applied for"
    )


class ApplicationUpdate(BaseModel):
    resume_url: str | None = Field(None, max_length=500)
    resume_text: str | None = None
    cover_letter: str | None = None
    status: ApplicationStatusEnum | None = None

    @field_validator("status", mode="before")
    @classmethod
    def parse_status(cls, value):
        if value is None:
            return None
        if isinstance(value, ApplicationStatusEnum):
            return value
        if isinstance(value, str):
            val_norm = value.strip().lower().replace("-", "_").replace(" ", "_")
            if val_norm in [
                "reviewing",
                "reviewed",
                "under_review",
                "review",
                "tech_round",
                "interview",
            ]:
                return ApplicationStatusEnum.SHORTLISTED
            for member in ApplicationStatusEnum:
                if member.value == val_norm or member.name.lower() == val_norm:
                    return member
        return value


class ApplicantUserResponse(BaseModel):
    id: int
    email: str

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(ApplicationBase):
    id: int
    job_posting_id: int
    applicant_id: int
    status: ApplicationStatusEnum
    applied_at: datetime
    updated_at: datetime
    job_posting: JobPostingResponse | None = None
    applicant: ApplicantUserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
