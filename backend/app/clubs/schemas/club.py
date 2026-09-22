from datetime import datetime
from pydantic import BaseModel, Field


class ClubCreate(BaseModel):
    """Payload to create a new club."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=50)
    head_id: int | None = None
    co_head_id: int | None = None
    faculty_coordinator_id: int | None = None
    alumni_mentor_id: int | None = None


class ClubUpdate(BaseModel):
    """Payload to update an existing club (all fields optional)."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=2000)
    category: str | None = Field(None, max_length=50)
    head_id: int | None = None
    co_head_id: int | None = None
    faculty_coordinator_id: int | None = None
    alumni_mentor_id: int | None = None


class ClubAppointmentsUpdate(BaseModel):
    """Payload for Department Controller to appoint Head, Co-Head, Faculty Coordinator, and Alumni Mentor."""

    head_id: int | None = None
    co_head_id: int | None = None
    faculty_coordinator_id: int | None = None
    alumni_mentor_id: int | None = None


class ClubSetCoordinator(BaseModel):
    """Payload for Department Controller to appoint/remove a Faculty Coordinator."""

    faculty_id: int | None = Field(
        None, description="User ID of the faculty member to appoint, or null to remove"
    )


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

    role: str = Field(
        ..., description="MEMBER, OFFICER, LEADER, or FACULTY_COORDINATOR"
    )


class ClubLeadUser(BaseModel):
    """Compact user info embedded for appointed Club Head, Co-Head, Faculty Coordinator, or Alumni Mentor."""

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


class ClubResourceCreate(BaseModel):
    """Payload to add a shared resource in a club."""

    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(
        "Notes", max_length=50, description="Notes, Question Bank, or URL / Repo"
    )
    resource_type: str = Field(
        "DOC", max_length=20, description="DOC, IMAGE, PDF, or GITHUB"
    )
    url: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(None, max_length=1000)


class ClubResourceResponse(BaseModel):
    """API response for a shared club resource."""

    id: int
    club_id: int
    title: str
    category: str
    resource_type: str = "DOC"
    url: str
    description: str | None = None
    uploaded_by_id: int | None = None
    uploaded_by: ClubLeadUser | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ClubGalleryCreate(BaseModel):
    """Payload to add a photo to a club gallery."""

    title: str = Field(..., min_length=1, max_length=200)
    image_url: str = Field(..., min_length=1, max_length=500)
    activity_name: str | None = Field(None, max_length=100)


class ClubGalleryResponse(BaseModel):
    """API response for a club gallery photo."""

    id: int
    club_id: int
    title: str
    image_url: str
    activity_name: str | None = None
    uploaded_by_id: int | None = None
    uploaded_by: ClubLeadUser | None = None
    created_at: datetime

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
    faculty_coordinator_id: int | None = None
    alumni_mentor_id: int | None = None
    head: ClubLeadUser | None = None
    co_head: ClubLeadUser | None = None
    faculty_coordinator: ClubLeadUser | None = None
    alumni_mentor: ClubLeadUser | None = None
    resources_count: int = 0

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
    faculty_coordinator_id: int | None = None
    alumni_mentor_id: int | None = None
    head: ClubLeadUser | None = None
    co_head: ClubLeadUser | None = None
    faculty_coordinator: ClubLeadUser | None = None
    alumni_mentor: ClubLeadUser | None = None
    members_count: int = 0
    resources_count: int = 0
    user_role: str | None = (
        None  # None if not a member, otherwise MEMBER/OFFICER/LEADER/HEAD/CO-HEAD/FACULTY_COORDINATOR
    )
    members: list[ClubMemberResponse] = []

    class Config:
        from_attributes = True
