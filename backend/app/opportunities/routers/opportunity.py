from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.opportunities.models.opportunity import OpportunityStatus, OpportunityType
from app.opportunities.schemas.opportunity import (
    OpportunityApplicationCreate,
    OpportunityApplicationResponse,
    OpportunityApplicationUpdate,
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
    StudentSearchResult,
)
from app.opportunities.services.opportunity import OpportunityService
from app.users.models.user import User

router = APIRouter(prefix="/opportunities", tags=["Faculty Opportunities"])


# ── Opportunity CRUD ─────────────────────────────────────────────────────────


@router.post(
    "",
    response_model=APIResponse[OpportunityResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_opportunity(
    payload: OpportunityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Faculty creates a new opportunity (Job, Internship, or Mentorship)."""
    service = OpportunityService(db)
    result = await service.create_opportunity(payload, current_user)
    return APIResponse(message="Opportunity created successfully", data=result)


@router.get("", response_model=APIResponse[list[OpportunityResponse]])
async def list_opportunities(
    opportunity_type: OpportunityType | None = Query(None),
    opp_status: OpportunityStatus | None = Query(None, alias="status"),
    department: str | None = Query(None),
    search: str | None = Query(None),
    skills: str | None = Query(None, description="Comma-separated list of skills"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List opportunities with optional filters."""
    skills_list = (
        [s.strip() for s in skills.split(",") if s.strip()] if skills else None
    )
    service = OpportunityService(db)
    results = await service.list_opportunities(
        skip=skip,
        limit=limit,
        opportunity_type=opportunity_type,
        status=opp_status,
        department=department,
        search=search,
        skills=skills_list,
        current_user=current_user,
    )
    return APIResponse(data=results)


@router.get("/me", response_model=APIResponse[list[OpportunityResponse]])
async def get_my_postings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get opportunities posted by the current user."""
    service = OpportunityService(db)
    results = await service.get_my_postings(current_user)
    return APIResponse(data=results)


@router.get(
    "/applications/me",
    response_model=APIResponse[list[OpportunityApplicationResponse]],
)
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get applications submitted by the current user."""
    service = OpportunityService(db)
    results = await service.get_my_applications(current_user)
    return APIResponse(data=results)


@router.get(
    "/students/search",
    response_model=APIResponse[list[StudentSearchResult]],
)
async def search_students(
    skills: str | None = Query(None, description="Comma-separated list of skills"),
    department: str | None = Query(None),
    graduation_year: int | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Faculty searches students by skills, department, graduation year, or name."""
    skills_list = (
        [s.strip() for s in skills.split(",") if s.strip()] if skills else None
    )
    service = OpportunityService(db)
    results = await service.search_students(
        user=current_user,
        skills=skills_list,
        department=department,
        graduation_year=graduation_year,
        search=search,
        skip=skip,
        limit=limit,
    )
    return APIResponse(data=results)


@router.get("/{opportunity_id}", response_model=APIResponse[OpportunityResponse])
async def get_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details for a specific opportunity."""
    service = OpportunityService(db)
    result = await service.get_opportunity(opportunity_id)
    return APIResponse(data=result)


@router.patch("/{opportunity_id}", response_model=APIResponse[OpportunityResponse])
async def update_opportunity(
    opportunity_id: int,
    payload: OpportunityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing opportunity."""
    service = OpportunityService(db)
    result = await service.update_opportunity(opportunity_id, payload, current_user)
    return APIResponse(message="Opportunity updated successfully", data=result)


@router.delete("/{opportunity_id}", status_code=status.HTTP_200_OK)
async def delete_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an opportunity."""
    service = OpportunityService(db)
    await service.delete_opportunity(opportunity_id, current_user)
    return APIResponse(message="Opportunity deleted successfully", data=None)


# ── Application Endpoints ────────────────────────────────────────────────────


@router.post(
    "/{opportunity_id}/apply",
    response_model=APIResponse[OpportunityApplicationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_opportunity(
    opportunity_id: int,
    payload: OpportunityApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply to an opportunity."""
    service = OpportunityService(db)
    result = await service.apply_to_opportunity(opportunity_id, payload, current_user)
    return APIResponse(message="Application submitted successfully", data=result)


@router.get(
    "/{opportunity_id}/applications",
    response_model=APIResponse[list[OpportunityApplicationResponse]],
)
async def get_opportunity_applications(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications for a specific opportunity (faculty only)."""
    service = OpportunityService(db)
    results = await service.get_opportunity_applications(opportunity_id, current_user)
    return APIResponse(data=results)


@router.patch(
    "/applications/{application_id}",
    response_model=APIResponse[OpportunityApplicationResponse],
)
async def update_application_status(
    application_id: int,
    payload: OpportunityApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update application status (faculty only)."""
    service = OpportunityService(db)
    result = await service.update_application_status(
        application_id, payload, current_user
    )
    return APIResponse(message="Application status updated", data=result)
