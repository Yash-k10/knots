from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role_id: int

    @field_validator("email")
    @classmethod
    def validate_college_domain(cls, v: str) -> str:
        if not v.endswith("@sbjit.edu.in"):
            raise ValueError(
                "Only college email addresses (@sbjit.edu.in) are allowed to register"
            )
        return v


class UserRegisterResponse(BaseModel):
    id: int
    email: EmailStr
    role_id: int | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RegistrationResponse(BaseModel):
    user: UserRegisterResponse
    verification_token: str
