from pydantic import BaseModel, Field


class ClubCreate(BaseModel):
    """Payload to create a new club."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=50)


class ClubUpdate(BaseModel):
    """Payload to update an existing club (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=50)


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
    user: ClubMemberUser | None = None

    class Config:
        from_attributes = True


class ClubMemberUpdateRole(BaseModel):
    """Payload to update a club member's role."""

    role: str = Field(..., description="MEMBER, OFFICER, or LEADER")


class ClubResponse(BaseModel):
    """API response for a single club (summary view)."""

    id: int
    name: str
    description: str | None = None
    category: str | None = None
    creator_id: int

    class Config:
        from_attributes = True


class ClubDetailResponse(BaseModel):
    """API response for a single club (detailed view)."""

    id: int
    name: str
    description: str | None = None
    category: str | None = None
    creator_id: int
    members_count: int = 0
    user_role: str | None = (
        None  # None if not a member, otherwise MEMBER/OFFICER/LEADER
    )
    members: list[ClubMemberResponse] = []

    class Config:
        from_attributes = True
