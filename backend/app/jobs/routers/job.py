from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import get_current_user
from app.jobs.schemas.job import JobCreate, JobResponse
from app.jobs.services.job import JobService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=APIResponse[JobResponse])
async def create_job(
    payload: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Post a new job or internship opportunity."""
    service = JobService(db)
    job = await service.create_job(current_user.id, payload)
    return APIResponse(message="Job created successfully", data=job)


@router.get("", response_model=APIResponse[List[JobResponse]])
async def read_jobs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of job opportunities with pagination."""
    service = JobService(db)
    jobs = await service.list_jobs(skip=skip, limit=limit)
    return APIResponse(data=jobs)
