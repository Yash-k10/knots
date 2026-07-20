from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.repository import BaseRepository
from app.jobs.models.application import Application
from app.jobs.models.job_posting import JobPosting


class ApplicationRepository(BaseRepository[Application]):
    def __init__(self, db: AsyncSession):
        super().__init__(Application, db)

    async def get_by_user_and_job(
        self, applicant_id: int, job_posting_id: int
    ) -> Optional[Application]:
        stmt = select(Application).filter(
            Application.applicant_id == applicant_id,
            Application.job_posting_id == job_posting_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_applications(
        self, applicant_id: int, skip: int = 0, limit: int = 50
    ) -> List[Application]:
        stmt = (
            select(Application)
            .options(
                selectinload(Application.job_posting).selectinload(JobPosting.company)
            )
            .filter(Application.applicant_id == applicant_id)
            .order_by(Application.applied_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_job_applications(
        self, job_posting_id: int, skip: int = 0, limit: int = 50
    ) -> List[Application]:
        stmt = (
            select(Application)
            .options(selectinload(Application.applicant))
            .filter(Application.job_posting_id == job_posting_id)
            .order_by(Application.applied_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
