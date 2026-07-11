from sqlalchemy.ext.asyncio import AsyncSession
from app.jobs.repository.job import JobRepository
from app.jobs.schemas.job import JobCreate
from app.jobs.models.job import Job


class JobService:
    def __init__(self, db: AsyncSession):
        self.repository = JobRepository(db)

    async def create_job(self, creator_id: int, job_in: JobCreate) -> Job:
        data = job_in.dict()
        data["creator_id"] = creator_id
        return await self.repository.create(data)

    async def list_jobs(self, skip: int = 0, limit: int = 100) -> list[Job]:
        return await self.repository.get_multi(skip=skip, limit=limit)
