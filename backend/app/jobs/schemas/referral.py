from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReferralBase(BaseModel):
    job_posting_id: int = Field(..., description="ID of the target job posting")
    referred_user_id: Optional[int] = Field(
        None, description="Optional ID of the referred user"
    )
    message: Optional[str] = Field(
        None, description="Optional referral message or note"
    )


class ReferralCreate(ReferralBase):
    pass


class ReferralUpdate(BaseModel):
    referred_user_id: Optional[int] = None
    message: Optional[str] = None


class ReferralResponse(ReferralBase):
    id: int
    referrer_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
