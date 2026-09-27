from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReferralBase(BaseModel):
    job_posting_id: int = Field(..., description="ID of the target job posting")
    referred_user_id: int | None = Field(
        None, description="Optional ID of the referred user"
    )
    message: str | None = Field(None, description="Optional referral message or note")


class ReferralCreate(ReferralBase):
    pass


class ReferralUpdate(BaseModel):
    referred_user_id: int | None = None
    message: str | None = None


class ReferralResponse(ReferralBase):
    id: int
    referrer_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DirectReferralEmailRequest(BaseModel):
    alumni_email: str = Field(..., description="Email of the target alumni")
    alumni_name: str = Field(..., description="Name of the target alumni")
    alumni_company: str = Field(..., description="Company where alumni is working")
    target_job_title: str = Field(..., description="Target job title or requisition ID")
    target_job_url: str | None = Field(
        None, description="Optional link to job portal opening"
    )
    student_name: str | None = Field(
        None, description="Name of the student requesting referral"
    )
    student_email: str | None = Field(None, description="Email of the student")
    student_phone: str | None = Field(None, description="Phone number of the student")
    department: str | None = Field(None, description="Department of the student")
    batch: str | None = Field(None, description="Graduation batch of the student")
    placement_status: str | None = Field(
        None, description="Placement status of candidate"
    )
    cgpa: str | None = Field(None, description="CGPA or academic score")
    skills: list[str] | str | None = Field(None, description="Key technical skills")
    resume_url: str = Field(..., description="URL link to candidate resume PDF/Drive")
    linkedin_url: str | None = Field(None, description="LinkedIn profile URL")
    github_url: str | None = Field(None, description="GitHub profile URL")
    message_pitch: str = Field(
        ..., description="Personalized elevator pitch / cover note"
    )
    job_posting_id: int | None = Field(
        None, description="Optional associated job posting ID"
    )
