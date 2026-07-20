from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.repository import BaseRepository
from app.jobs.models.job_posting import JobPosting
from app.jobs.models.enums import JobTypeEnum, WorkplaceTypeEnum, JobStatusEnum


class JobPostingRepository(BaseRepository[JobPosting]):
    def __init__(self, db: AsyncSession):
        super().__init__(JobPosting, db)

    async def get_with_details(self, job_id: int) -> Optional[JobPosting]:
        stmt = (
            select(JobPosting)
            .options(
                selectinload(JobPosting.company),
                selectinload(JobPosting.posted_by),
                selectinload(JobPosting.applications),
                selectinload(JobPosting.referrals),
            )
            .filter(JobPosting.id == job_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def filter_jobs(
        self,
        search: Optional[str] = None,
        job_type: Optional[JobTypeEnum] = None,
        workplace_type: Optional[WorkplaceTypeEnum] = None,
        company_id: Optional[int] = None,
        status: Optional[JobStatusEnum] = JobStatusEnum.OPEN,
        skip: int = 0,
        limit: int = 100,
    ) -> List[JobPosting]:
        stmt = select(JobPosting).options(
            selectinload(JobPosting.company),
            selectinload(JobPosting.posted_by),
        )

        filters = []
        if status is not None:
            filters.append(JobPosting.status == status)
        if company_id is not None:
            filters.append(JobPosting.company_id == company_id)
        if job_type is not None:
            filters.append(JobPosting.job_type == job_type)
        if workplace_type is not None:
            filters.append(JobPosting.workplace_type == workplace_type)
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    JobPosting.title.ilike(search_pattern),
                    JobPosting.description.ilike(search_pattern),
                    JobPosting.location.ilike(search_pattern),
                )
            )

        if filters:
            stmt = stmt.filter(*filters)

        stmt = stmt.order_by(JobPosting.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


JobRepository = JobPostingRepository
