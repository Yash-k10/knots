from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.jobs.models.enums import JobStatusEnum, JobTypeEnum, WorkplaceTypeEnum
from app.jobs.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.jobs.schemas.company import (
    CompanyCreate,
    CompanyResponse,
)
from app.jobs.schemas.job_posting import (
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
)
from app.jobs.schemas.referral import (
    ReferralCreate,
    ReferralResponse,
)
from app.jobs.services.application import ApplicationService
from app.jobs.services.company import CompanyService
from app.jobs.services.job import JobService
from app.jobs.services.referral import ReferralService
from app.users.models.user import User

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _is_user_admin(user: User) -> bool:
    return user.role_id == 1 or (
        getattr(user, "role", None) is not None and user.role.name.lower() == "admin"
    )


# --- Companies Endpoints ---


@router.post(
    "/companies",
    response_model=APIResponse[CompanyResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new company profile."""
    service = CompanyService(db)
    company = await service.create_company(payload)
    return APIResponse(message="Company created successfully", data=company)


@router.get("/companies", response_model=APIResponse[list[CompanyResponse]])
async def list_companies(
    search: str | None = Query(None, description="Search company by name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of companies."""
    service = CompanyService(db)
    companies = await service.list_companies(search=search, skip=skip, limit=limit)
    return APIResponse(data=companies)


@router.get("/companies/{company_id}", response_model=APIResponse[CompanyResponse])
async def get_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get details for a specific company."""
    service = CompanyService(db)
    company = await service.get_company(company_id)
    return APIResponse(data=company)


# --- Applications & Referrals Listing Endpoints ---


@router.get("/applications/me", response_model=APIResponse[list[ApplicationResponse]])
async def read_my_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all job applications submitted by current user."""
    service = ApplicationService(db)
    applications = await service.get_user_applications(
        applicant_id=current_user.id, skip=skip, limit=limit
    )
    return APIResponse(data=applications)


@router.get("/referrals", response_model=APIResponse[list[ReferralResponse]])
async def read_my_referrals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all referral requests submitted by current user."""
    service = ReferralService(db)
    referrals = await service.get_user_referrals(
        user_id=current_user.id, skip=skip, limit=limit
    )
    return APIResponse(data=referrals)


@router.post(
    "/referrals",
    response_model=APIResponse[ReferralResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_referral(
    payload: ReferralCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a referral request for a job posting."""
    service = ReferralService(db)
    referral = await service.create_referral(
        referrer_id=current_user.id, referral_in=payload
    )
    return APIResponse(message="Referral submitted successfully", data=referral)


# --- Job Postings Endpoints ---


@router.post(
    "",
    response_model=APIResponse[JobPostingResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_job(
    payload: JobPostingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Post a new job or internship opportunity."""
    service = JobService(db)
    job = await service.create_job(current_user.id, payload)
    return APIResponse(message="Job posting created successfully", data=job)


@router.get("", response_model=APIResponse[list[JobPostingResponse]])
async def read_jobs(
    search: str | None = Query(
        None, description="Search keyword in title, description or location"
    ),
    job_type: JobTypeEnum | None = Query(None, description="Filter by job type"),
    workplace_type: WorkplaceTypeEnum | None = Query(
        None, description="Filter by workplace type"
    ),
    company_id: int | None = Query(None, description="Filter by company ID"),
    status: JobStatusEnum | None = Query(
        JobStatusEnum.OPEN, description="Filter by job status"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of job opportunities with search and filtering."""
    service = JobService(db)
    jobs = await service.list_jobs(
        search=search,
        job_type=job_type,
        workplace_type=workplace_type,
        company_id=company_id,
        status=status,
        skip=skip,
        limit=limit,
    )
    return APIResponse(data=jobs)


@router.get("/{job_id}", response_model=APIResponse[JobPostingResponse])
async def get_job_details(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed information about a single job posting."""
    service = JobService(db)
    job = await service.get_job(job_id)
    return APIResponse(data=job)


@router.put("/{job_id}", response_model=APIResponse[JobPostingResponse])
async def update_job(
    job_id: int,
    payload: JobPostingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing job posting."""
    service = JobService(db)
    is_admin = _is_user_admin(current_user)
    job = await service.update_job(
        job_id=job_id, user_id=current_user.id, job_in=payload, is_admin=is_admin
    )
    return APIResponse(message="Job posting updated successfully", data=job)


@router.delete("/{job_id}", response_model=APIResponse[dict])
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a job posting."""
    service = JobService(db)
    is_admin = _is_user_admin(current_user)
    await service.delete_job(job_id=job_id, user_id=current_user.id, is_admin=is_admin)
    return APIResponse(message="Job posting deleted successfully", data={"id": job_id})


@router.post(
    "/{job_id}/apply",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def apply_for_job(
    job_id: int,
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an application for a job posting."""
    service = ApplicationService(db)
    application = await service.apply_for_job(
        applicant_id=current_user.id, job_posting_id=job_id, application_in=payload
    )
    return APIResponse(message="Application submitted successfully", data=application)


@router.get(
    "/{job_id}/applications", response_model=APIResponse[list[ApplicationResponse]]
)
async def read_job_applications(
    job_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all applicants for a job posting (Recruiter/Poster or Admin)."""
    service = ApplicationService(db)
    is_admin = _is_user_admin(current_user)
    applications = await service.get_job_applications(
        job_posting_id=job_id,
        user_id=current_user.id,
        is_admin=is_admin,
        skip=skip,
        limit=limit,
    )
    return APIResponse(data=applications)


@router.patch(
    "/applications/{application_id}", response_model=APIResponse[ApplicationResponse]
)
async def update_application_status(
    application_id: int,
    payload: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update application status (e.g., PENDING -> REVIEWING -> ACCEPTED / REJECTED)."""
    service = ApplicationService(db)
    is_admin = _is_user_admin(current_user)
    application = await service.update_application_status(
        application_id=application_id,
        user_id=current_user.id,
        application_in=payload,
        is_admin=is_admin,
    )
    return APIResponse(
        message="Application status updated successfully", data=application
    )
