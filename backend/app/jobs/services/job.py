from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError
from app.jobs.models.enums import JobStatusEnum, JobTypeEnum, WorkplaceTypeEnum
from app.jobs.models.job_posting import JobPosting
from app.jobs.repository.company import CompanyRepository
from app.jobs.repository.job import JobPostingRepository
from app.jobs.schemas.job_posting import JobPostingCreate, JobPostingUpdate


class JobService:
    def __init__(self, db: AsyncSession):
        self.repository = JobPostingRepository(db)
        self.company_repository = CompanyRepository(db)

    async def create_job(
        self, posted_by_id: int, job_in: JobPostingCreate
    ) -> JobPosting:
        company = await self.company_repository.get(job_in.company_id)
        if not company:
            raise NotFoundError(
                message=f"Company with ID {job_in.company_id} not found."
            )

        data = job_in.model_dump()
        data["posted_by_id"] = posted_by_id
        job = await self.repository.create(data)
        return await self.get_job(job.id)

    async def list_jobs(
        self,
        search: str | None = None,
        job_type: JobTypeEnum | None = None,
        workplace_type: WorkplaceTypeEnum | None = None,
        company_id: int | None = None,
        status: JobStatusEnum | None = JobStatusEnum.OPEN,
        skip: int = 0,
        limit: int = 100,
    ) -> list[JobPosting]:
        return await self.repository.filter_jobs(
            search=search,
            job_type=job_type,
            workplace_type=workplace_type,
            company_id=company_id,
            status=status,
            skip=skip,
            limit=limit,
        )

    async def get_job(self, job_id: int) -> JobPosting:
        job = await self.repository.get_with_details(job_id)
        if not job:
            raise NotFoundError(message=f"Job posting with ID {job_id} not found.")
        return job

    async def update_job(
        self,
        job_id: int,
        user_id: int,
        job_in: JobPostingUpdate,
        is_admin: bool = False,
    ) -> JobPosting:
        job = await self.get_job(job_id)
        if job.posted_by_id != user_id and not is_admin:
            raise AuthorizationError(message="Not authorized to edit this job posting.")
        update_data = job_in.model_dump(exclude_unset=True)
        updated_job = await self.repository.update(job, update_data)
        return await self.get_job(updated_job.id)

    async def delete_job(
        self, job_id: int, user_id: int, is_admin: bool = False
    ) -> JobPosting:
        job = await self.get_job(job_id)
        if job.posted_by_id != user_id and not is_admin:
            raise AuthorizationError(
                message="Not authorized to delete this job posting."
            )
        return await self.repository.remove(job_id)
