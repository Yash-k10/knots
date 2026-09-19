from pydantic import BaseModel, Field


class ClubCreate(BaseModel):
    """Payload to create a new club."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=50)
    head_id: int | None = None
    co_head_id: int | None = None


class ClubUpdate(BaseModel):
    """Payload to update an existing club (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=50)
    head_id: int | None = None
    co_head_id: int | None = None


class ClubMemberUser(BaseModel):
    """Compact user info embedded in club member responses."""

    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    profile_picture: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    user_role: str | None = None

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


class ClubLeadUser(BaseModel):
    """Compact user info embedded for appointed Club Head or Co-Head."""

    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    department: str | None = None
    graduation_year: int | None = None
    profile_picture: str | None = None
    user_role: str | None = None

    class Config:
        from_attributes = True


class ClubResponse(BaseModel):
    """API response for a single club (summary view)."""

    id: int
    name: str
    description: str | None = None
    category: str | None = None
    creator_id: int
    head_id: int | None = None
    co_head_id: int | None = None
    head: ClubLeadUser | None = None
    co_head: ClubLeadUser | None = None

    class Config:
        from_attributes = True


class ClubDetailResponse(BaseModel):
    """API response for a single club (detailed view)."""

    id: int
    name: str
    description: str | None = None
    category: str | None = None
    creator_id: int
    head_id: int | None = None
    co_head_id: int | None = None
    head: ClubLeadUser | None = None
    co_head: ClubLeadUser | None = None
    members_count: int = 0
    user_role: str | None = (
        None  # None if not a member, otherwise MEMBER/OFFICER/LEADER/HEAD/CO-HEAD
    )
    members: list[ClubMemberResponse] = []

    class Config:
        from_attributes = True
