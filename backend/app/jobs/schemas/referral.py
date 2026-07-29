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
