from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.users.schemas.role import RoleResponse


class UserBase(BaseModel):
    email: EmailStr
    is_active: bool | None = True


class UserCreate(UserBase):
    password: str
    role_id: int


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    is_active: bool | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @classmethod
    def validate_new_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters long")
        return v


class ProfileUserSummary(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    profile_picture: str | None = None
    department: str | None = None
    bio: str | None = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    role_id: int | None = None
    role: RoleResponse | None = None
    profile: ProfileUserSummary | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
