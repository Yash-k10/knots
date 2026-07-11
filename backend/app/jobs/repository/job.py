from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.jobs.models.job import Job


class JobRepository(BaseRepository[Job]):
    def __init__(self, db: AsyncSession):
        super().__init__(Job, db)
