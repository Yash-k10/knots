from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ControllerInviteCreate(BaseModel):
    department: str = Field(..., min_length=1, max_length=100, description="Target department name (e.g. CSE, IT, ME)")
    validity_days: int = Field(default=7, ge=1, le=365, description="Number of days the code remains valid")
    max_uses: int = Field(default=1, ge=1, le=100, description="Maximum number of times this code can be used")
    role: str = Field(default="Controller", description="Role to assign upon activation")


class ControllerInviteCreatedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    department: str
    role: str
    expires_at: datetime
    max_uses: int
    used_count: int = 0
    status: str
    created_at: datetime


class ControllerInviteItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department: str
    role: str
    created_at: datetime
    expires_at: datetime
    max_uses: int
    used_count: int
    status: str
    created_by: int | None = None
    used_by: int | None = None
    used_at: datetime | None = None
