from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.clubs.schemas.club import (
    ClubCreate,
    ClubDetailResponse,
    ClubMemberResponse,
    ClubMemberUpdateRole,
    ClubMemberUser,
    ClubResponse,
    ClubUpdate,
)
from app.clubs.services.club import ClubService
from app.users.models.user import User

router = APIRouter(prefix="/clubs", tags=["Clubs"])


# ── Club Listing & CRUD ───────────────────────────────────────────────────────


@router.post("", response_model=APIResponse[ClubResponse])
async def create_club(
    payload: ClubCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new college club (current user automatically becomes LEADER)."""
    service = ClubService(db)
    club = await service.create_club(current_user.id, payload)
    return APIResponse(message="Club created successfully", data=club)


@router.get("", response_model=APIResponse[List[ClubResponse]])
async def read_clubs(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve college clubs list with category filter and search."""
    service = ClubService(db)
    clubs = await service.list_clubs(
        category=category, search=search, skip=skip, limit=limit
    )
    return APIResponse(data=clubs)


@router.get("/{club_id}", response_model=APIResponse[ClubDetailResponse])
async def get_club_detail(
    club_id: int = Path(..., ge=1),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single club with details and its member roster."""
    service = ClubService(db)
    user_id = current_user.id if current_user else None
    club_detail = await service.get_club_detail(club_id, current_user_id=user_id)
    return APIResponse(data=club_detail)


@router.put("/{club_id}", response_model=APIResponse[ClubResponse])
async def update_club(
    club_id: int = Path(..., ge=1),
    payload: ClubUpdate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update club details (LEADER only)."""
    service = ClubService(db)
    club = await service.update_club(club_id, current_user.id, payload)
    return APIResponse(message="Club details updated successfully", data=club)


@router.delete("/{club_id}", response_model=APIResponse)
async def delete_club(
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a club (LEADER/Creator only)."""
    service = ClubService(db)
    await service.delete_club(club_id, current_user.id)
    return APIResponse(message="Club deleted successfully")


# ── Memberships ───────────────────────────────────────────────────────────────


@router.post("/{club_id}/join", response_model=APIResponse[ClubMemberResponse])
async def join_club(
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a club as a MEMBER."""
    service = ClubService(db)
    membership = await service.join_club(club_id, current_user.id)

    # Eager load the user info for mapping
    user_info = ClubMemberUser(id=current_user.id, email=current_user.email)
    response_data = ClubMemberResponse(
        id=membership.id,
        club_id=membership.club_id,
        user_id=membership.user_id,
        role=membership.role,
        user=user_info,
    )
    return APIResponse(message="You have joined the club", data=response_data)


@router.post("/{club_id}/leave", response_model=APIResponse)
async def leave_club(
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave a club. Sole leader must assign another leader first."""
    service = ClubService(db)
    await service.leave_club(club_id, current_user.id)
    return APIResponse(message="You have left the club")


@router.get("/{club_id}/members", response_model=APIResponse[List[ClubMemberResponse]])
async def get_club_members(
    club_id: int = Path(..., ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of all members in a club."""
    service = ClubService(db)
    members = await service.get_club_members(club_id, skip=skip, limit=limit)

    response_data = [
        ClubMemberResponse(
            id=m.id,
            club_id=m.club_id,
            user_id=m.user_id,
            role=m.role,
            user=ClubMemberUser(id=m.user.id, email=m.user.email) if m.user else None,
        )
        for m in members
    ]
    return APIResponse(data=response_data)


@router.put(
    "/{club_id}/members/{user_id}/role", response_model=APIResponse[ClubMemberResponse]
)
async def update_member_role(
    club_id: int = Path(..., ge=1),
    user_id: int = Path(..., ge=1, description="The target user's ID"),
    payload: ClubMemberUpdateRole = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Promote or demote a club member's role (LEADER only)."""
    service = ClubService(db)
    membership = await service.update_member_role(
        club_id=club_id,
        current_user_id=current_user.id,
        target_user_id=user_id,
        payload=payload,
    )

    # Eager load the user info
    user_info = None
    if membership.user:
        user_info = ClubMemberUser(id=membership.user.id, email=membership.user.email)

    response_data = ClubMemberResponse(
        id=membership.id,
        club_id=membership.club_id,
        user_id=membership.user_id,
        role=membership.role,
        user=user_info,
    )
    return APIResponse(message="Member role updated successfully", data=response_data)
