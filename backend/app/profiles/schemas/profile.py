from pydantic import BaseModel
from typing import Optional, List


class ProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    skills: Optional[List[str]] = None


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
