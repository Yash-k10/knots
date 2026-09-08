from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


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
    otp: str

    # 1. Contact Details
    phone_number: str | None = None
    github_profile: str | None = None
    linkedin_profile: str | None = None
    leetcode_profile: str | None = None
    hackerrank_profile: str | None = None

    # 2. Educational Qualifications (Students only)
    tenth_percentage: float | None = None
    twelfth_or_diploma_percentage: float | None = None
    gpa: float | None = None

    # 3. Role-Specific Custom Attributes
    department: str | None = None  # Faculty and Management: Controller
    faculty_type: str | None = None  # "HOD" | "Normal faculty"
    management_role: str | None = (
        None  # "Controller" | "Central Admin" | "TPO" | "DEAN" | "CEO" | "Principal"
    )
    access_key: str | None = None  # Department Controller or Central Admin Security Key
    current_company: str | None = None  # Alumni
    designation: str | None = None

    @field_validator("email")
    @classmethod
    def validate_college_domain(cls, v: str) -> str:
        email = v.strip().lower()
        if not email.endswith("@sbjit.edu.in"):
            raise ValueError(
                "Only college email addresses (@sbjit.edu.in) are allowed to register"
            )
        return email


class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: str = "login"  # "login" | "reset" | "register"

    @field_validator("email")
    @classmethod
    def validate_college_domain(cls, v: str) -> str:
        email = v.strip().lower()
        if not email.endswith("@sbjit.edu.in"):
            raise ValueError(
                "Only college email addresses (@sbjit.edu.in) are authorized"
            )
        return email


class SendOTPResponse(BaseModel):
    message: str
    email: str
    expires_in_seconds: int = 600
    demo_otp: str | None = None  # Returned for instant dev/demo access


class LoginOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    role: str = "Student"

    @field_validator("email")
    @classmethod
    def validate_college_domain(cls, v: str) -> str:
        email = v.strip().lower()
        if not email.endswith("@sbjit.edu.in"):
            raise ValueError(
                "Only college email addresses (@sbjit.edu.in) are authorized"
            )
        return email


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("email")
    @classmethod
    def validate_college_domain(cls, v: str) -> str:
        email = v.strip().lower()
        if not email.endswith("@sbjit.edu.in"):
            raise ValueError(
                "Only college email addresses (@sbjit.edu.in) are authorized"
            )
        return email


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
