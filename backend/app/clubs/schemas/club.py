from pydantic import BaseModel, Field
from typing import List, Optional


class ClubCreate(BaseModel):
    """Payload to create a new club."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, max_length=50)


class ClubUpdate(BaseModel):
    """Payload to update an existing club (all fields optional)."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, max_length=50)


class ClubMemberUser(BaseModel):
    """Compact user info embedded in club member responses."""

    id: int
    email: str

    class Config:
        from_attributes = True


class ClubMemberResponse(BaseModel):
    """API response for a club member."""

    id: int
    club_id: int
    user_id: int
    role: str
    user: Optional[ClubMemberUser] = None

    class Config:
        from_attributes = True


class ClubMemberUpdateRole(BaseModel):
    """Payload to update a club member's role."""

    role: str = Field(..., description="MEMBER, OFFICER, or LEADER")


class ClubResponse(BaseModel):
    """API response for a single club (summary view)."""

    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    creator_id: int

    class Config:
        from_attributes = True


class ClubDetailResponse(BaseModel):
    """API response for a single club (detailed view)."""

    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    creator_id: int
    members_count: int = 0
    user_role: Optional[str] = (
        None  # None if not a member, otherwise MEMBER/OFFICER/LEADER
    )
    members: List[ClubMemberResponse] = []

    class Config:
        from_attributes = True
