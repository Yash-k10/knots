from fastapi import APIRouter, Depends, File, Form, Path, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.storage import storage_service
from app.clubs.schemas.club import (
    ClubAppointmentsUpdate,
    ClubCreate,
    ClubDetailResponse,
    ClubGalleryCreate,
    ClubGalleryResponse,
    ClubLeadUser,
    ClubMemberResponse,
    ClubMemberUpdateRole,
    ClubMemberUser,
    ClubResourceCreate,
    ClubResourceResponse,
    ClubResponse,
    ClubSetCoordinator,
    ClubUpdate,
)
from app.clubs.services.club import ClubService
from app.core.database import get_db
from app.core.response_models import APIResponse
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
    loaded = await service.club_repo.get_with_details(club.id)
    from app.clubs.services.club import _map_club_lead_user

    res = ClubResponse(
        id=club.id,
        name=club.name,
        description=club.description,
        category=club.category,
        creator_id=club.creator_id,
        head_id=club.head_id,
        co_head_id=club.co_head_id,
        faculty_coordinator_id=club.faculty_coordinator_id,
        head=_map_club_lead_user(loaded.head if loaded else None),
        co_head=_map_club_lead_user(loaded.co_head if loaded else None),
        faculty_coordinator=_map_club_lead_user(
            loaded.faculty_coordinator if loaded else None
        ),
    )
    return APIResponse(message="Club created successfully", data=res)


@router.get("", response_model=APIResponse[list[ClubResponse]])
async def read_clubs(
    category: str | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve college clubs list with category filter and search."""
    from app.core.cache import clubs_cache

    cache_key = f"clubs:{category}:{search}:{skip}:{limit}"
    cached = clubs_cache.get(cache_key)
    if cached is not None:
        return APIResponse(data=cached)

    service = ClubService(db)
    clubs = await service.list_clubs(
        category=category,
        search=search,
        skip=skip,
        limit=limit,
        current_user=current_user,
    )
    clubs_cache.set(cache_key, clubs, ttl_seconds=30.0)
    return APIResponse(data=clubs)


@router.get("/faculty-candidates", response_model=APIResponse[list[ClubLeadUser]])
async def get_faculty_candidates(
    department: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve faculty members that can be appointed as coordinators (Controllers/Admins)."""
    from app.core.cache import clubs_cache

    cache_key = f"faculty_candidates:{department}"
    cached = clubs_cache.get(cache_key)
    if cached is not None:
        return APIResponse(data=cached)

    service = ClubService(db)
    candidates = await service.get_faculty_candidates(department=department)
    clubs_cache.set(cache_key, candidates, ttl_seconds=60.0)
    return APIResponse(data=candidates)


@router.get("/alumni-candidates", response_model=APIResponse[list[ClubLeadUser]])
async def get_alumni_candidates(
    department: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve alumni available to be requested as club mentors (Controllers/Admins)."""
    from app.core.cache import clubs_cache

    cache_key = f"alumni_candidates:{department}"
    cached = clubs_cache.get(cache_key)
    if cached is not None:
        return APIResponse(data=cached)

    service = ClubService(db)
    candidates = await service.get_alumni_candidates(department=department)
    clubs_cache.set(cache_key, candidates, ttl_seconds=60.0)
    return APIResponse(data=candidates)


@router.get("/{club_id}", response_model=APIResponse[ClubDetailResponse])
async def get_club_detail(
    club_id: int = Path(..., ge=1),
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single club with details and its member roster."""
    service = ClubService(db)
    club_detail = await service.get_club_detail(club_id, current_user=current_user)
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
    from app.clubs.repository.club import ClubRepository
    from app.clubs.services.club import _map_club_lead_user

    loaded = await ClubRepository(db).get_with_details(club.id)
    res = ClubResponse(
        id=club.id,
        name=club.name,
        description=club.description,
        category=club.category,
        creator_id=club.creator_id,
        head_id=club.head_id,
        co_head_id=club.co_head_id,
        head=_map_club_lead_user(loaded.head if loaded else None),
        co_head=_map_club_lead_user(loaded.co_head if loaded else None),
    )
    return APIResponse(message="Club details updated successfully", data=res)


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


@router.get("/{club_id}/members", response_model=APIResponse[list[ClubMemberResponse]])
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


@router.delete("/{club_id}/members/{user_id}", response_model=APIResponse)
async def remove_member(
    club_id: int = Path(..., ge=1),
    user_id: int = Path(..., ge=1, description="The target user's ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member or reject a pending join request (Leader/Controller or self)."""
    service = ClubService(db)
    await service.remove_member(
        club_id=club_id,
        current_user_id=current_user.id,
        target_user_id=user_id,
    )
    return APIResponse(message="Member removed or request rejected successfully")


@router.put("/{club_id}/coordinator", response_model=APIResponse[ClubDetailResponse])
async def set_club_faculty_coordinator(
    payload: ClubSetCoordinator,
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign or remove a Faculty Coordinator for this club (Department Controller or Admin only)."""
    service = ClubService(db)
    detail = await service.set_faculty_coordinator(
        club_id=club_id,
        current_user=current_user,
        faculty_id=payload.faculty_id,
    )
    action = "assigned" if payload.faculty_id else "removed"
    from app.core.cache import clubs_cache

    clubs_cache.clear()
    return APIResponse(
        message=f"Faculty coordinator successfully {action}",
        data=detail,
    )


@router.put("/{club_id}/appointments", response_model=APIResponse[ClubDetailResponse])
async def update_club_appointments(
    payload: ClubAppointmentsUpdate,
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Appoint Student Head, Student Co-Head, Faculty Coordinator, and Alumni Mentor (Controller / Admin only)."""
    service = ClubService(db)
    detail = await service.update_appointments(
        club_id=club_id,
        current_user=current_user,
        payload=payload,
    )
    return APIResponse(
        message="Club leadership and mentor appointments updated successfully",
        data=detail,
    )


# ── Club Resources ────────────────────────────────────────────────────────────


@router.get(
    "/{club_id}/resources", response_model=APIResponse[list[ClubResourceResponse]]
)
async def get_club_resources(
    club_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve shared resources for a club."""
    service = ClubService(db)
    resources = await service.get_club_resources(club_id)
    return APIResponse(data=resources)


@router.post("/{club_id}/resources", response_model=APIResponse[ClubResourceResponse])
async def add_club_resource(
    payload: ClubResourceCreate,
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Share a new resource with a club."""
    service = ClubService(db)
    resource = await service.create_club_resource(
        club_id=club_id, user_id=current_user.id, payload=payload
    )
    return APIResponse(message="Resource shared successfully", data=resource)


@router.post(
    "/{club_id}/resources/upload", response_model=APIResponse[ClubResourceResponse]
)
async def upload_club_resource(
    club_id: int = Path(..., ge=1),
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("Notes"),
    resource_type: str = Form("DOC"),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file and share it as a club resource."""
    file_url = await storage_service.upload_file(file, folder="club_resources")
    service = ClubService(db)
    payload = ClubResourceCreate(
        title=title,
        url=file_url,
        category=category,
        resource_type=resource_type,
        description=description,
    )
    resource = await service.create_club_resource(
        club_id=club_id, user_id=current_user.id, payload=payload
    )
    return APIResponse(
        message="Resource uploaded and shared successfully", data=resource
    )


@router.delete("/{club_id}/resources/{resource_id}", response_model=APIResponse)
async def delete_club_resource(
    club_id: int = Path(..., ge=1),
    resource_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a shared resource from a club."""
    role_name = current_user.role.name.lower().strip() if current_user.role else ""
    is_controller = (
        current_user.role_id in (1, 2, 8, 9, 10)
        or any(r in role_name for r in ["controller", "admin", "hod"])
        or "controller" in current_user.email.lower()
        or "admin" in current_user.email.lower()
    )
    service = ClubService(db)
    await service.delete_club_resource(
        club_id=club_id,
        resource_id=resource_id,
        user_id=current_user.id,
        is_controller=is_controller,
    )
    return APIResponse(message="Resource deleted successfully")


# ── Club Gallery ──────────────────────────────────────────────────────────────


@router.get("/{club_id}/gallery", response_model=APIResponse[list[ClubGalleryResponse]])
async def get_club_gallery(
    club_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve photo gallery moments for a club."""
    service = ClubService(db)
    items = await service.get_club_gallery(club_id)
    return APIResponse(data=items)


@router.post("/{club_id}/gallery", response_model=APIResponse[ClubGalleryResponse])
async def add_club_gallery_item(
    payload: ClubGalleryCreate,
    club_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a photo moment to a club gallery."""
    service = ClubService(db)
    item = await service.create_club_gallery(
        club_id=club_id, user_id=current_user.id, payload=payload
    )
    return APIResponse(message="Photo added to gallery successfully", data=item)


@router.delete("/{club_id}/gallery/{item_id}", response_model=APIResponse)
async def delete_club_gallery_item(
    club_id: int = Path(..., ge=1),
    item_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a photo moment from a club gallery."""
    role_name = current_user.role.name.lower().strip() if current_user.role else ""
    is_controller = (
        current_user.role_id in (1, 2, 8, 9, 10)
        or any(r in role_name for r in ["controller", "admin", "hod"])
        or "controller" in current_user.email.lower()
        or "admin" in current_user.email.lower()
    )
    service = ClubService(db)
    await service.delete_club_gallery(
        club_id=club_id,
        item_id=item_id,
        user_id=current_user.id,
        is_controller=is_controller,
    )
    return APIResponse(message="Gallery photo deleted successfully")
