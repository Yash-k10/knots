import unittest

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.core.base  # noqa: F401
from app.core.database import Base
from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.jobs.models import (
    ApplicationStatusEnum,
    JobStatusEnum,
    JobTypeEnum,
    WorkplaceTypeEnum,
)
from app.jobs.schemas.application import ApplicationCreate, ApplicationUpdate
from app.jobs.schemas.company import CompanyCreate
from app.jobs.schemas.job_posting import JobPostingCreate, JobPostingUpdate
from app.jobs.schemas.referral import ReferralCreate
from app.jobs.services.application import ApplicationService
from app.jobs.services.company import CompanyService
from app.jobs.services.job import JobService
from app.jobs.services.referral import ReferralService


class TestJobsModule(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

    async def asyncTearDown(self):
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_company_crud(self):
        service = CompanyService(self.db)

        # 1. Create company
        company_in = CompanyCreate(
            name="TechCorp Inc",
            industry="Software Engineering",
            location="San Francisco, CA",
            description="Innovative AI Solutions Provider",
        )
        company = await service.create_company(company_in)
        self.assertIsNotNone(company.id)
        self.assertEqual(company.name, "TechCorp Inc")

        # 2. Duplicate company error
        with self.assertRaises(ConflictError):
            await service.create_company(company_in)

        # 3. Get company
        fetched = await service.get_company(company.id)
        self.assertEqual(fetched.name, "TechCorp Inc")

        # 4. List companies
        companies = await service.list_companies(search="Tech")
        self.assertEqual(len(companies), 1)

    async def test_job_posting_service(self):
        company_service = CompanyService(self.db)
        job_service = JobService(self.db)

        # Setup company
        company = await company_service.create_company(
            CompanyCreate(name="Acme Corp", industry="Tech")
        )

        # 1. Create job posting
        job_in = JobPostingCreate(
            title="Senior Backend Engineer",
            description="Looking for Python & FastAPI wizard.",
            company_id=company.id,
            job_type=JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum.REMOTE,
            location="Remote",
            salary_min=120000,
            salary_max=150000,
            salary_range="$120k - $150k",
            required_skills=["Python", "FastAPI", "SQLAlchemy"],
        )
        job = await job_service.create_job(posted_by_id=1, job_in=job_in)
        self.assertIsNotNone(job.id)
        self.assertEqual(job.title, "Senior Backend Engineer")
        self.assertEqual(job.status, JobStatusEnum.OPEN)

        # 2. Search & filter jobs
        jobs = await job_service.list_jobs(
            search="Backend",
            job_type=JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum.REMOTE,
        )
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0].id, job.id)

        # 3. Update job posting
        updated_job = await job_service.update_job(
            job_id=job.id,
            user_id=1,
            job_in=JobPostingUpdate(title="Lead Backend Engineer"),
        )
        self.assertEqual(updated_job.title, "Lead Backend Engineer")

        # 4. Forbidden update by non-owner
        with self.assertRaises(AuthorizationError):
            await job_service.update_job(
                job_id=job.id,
                user_id=999,
                job_in=JobPostingUpdate(title="Hacked Title"),
            )

        # 5. Delete job posting
        deleted = await job_service.delete_job(job_id=job.id, user_id=1)
        self.assertEqual(deleted.id, job.id)
        with self.assertRaises(NotFoundError):
            await job_service.get_job(job.id)

    async def test_job_application_service(self):
        company_service = CompanyService(self.db)
        job_service = JobService(self.db)
        app_service = ApplicationService(self.db)

        company = await company_service.create_company(
            CompanyCreate(name="Google", industry="Software")
        )
        job = await job_service.create_job(
            posted_by_id=10,
            job_in=JobPostingCreate(
                title="Software Intern",
                description="Summer internship",
                company_id=company.id,
            ),
        )

        # 1. Submit application
        app_in = ApplicationCreate(
            job_posting_id=job.id,
            resume_url="https://example.com/resume.pdf",
            cover_letter="Passionate student developer.",
        )
        app_obj = await app_service.apply_for_job(
            applicant_id=100, job_posting_id=job.id, application_in=app_in
        )
        self.assertIsNotNone(app_obj.id)
        self.assertEqual(app_obj.status, ApplicationStatusEnum.PENDING)

        # 2. Duplicate application error
        with self.assertRaises(ConflictError):
            await app_service.apply_for_job(
                applicant_id=100, job_posting_id=job.id, application_in=app_in
            )

        # 3. Get user applications
        user_apps = await app_service.get_user_applications(applicant_id=100)
        self.assertEqual(len(user_apps), 1)

        # 4. Get job applicants (posted_by owner)
        job_apps = await app_service.get_job_applications(
            job_posting_id=job.id, user_id=10
        )
        self.assertEqual(len(job_apps), 1)

        # 5. Unauthorized applicant list access
        with self.assertRaises(AuthorizationError):
            await app_service.get_job_applications(job_posting_id=job.id, user_id=99)

        # 6. Update application status
        updated_app = await app_service.update_application_status(
            application_id=app_obj.id,
            user_id=10,
            application_in=ApplicationUpdate(status=ApplicationStatusEnum.ACCEPTED),
        )
        self.assertEqual(updated_app.status, ApplicationStatusEnum.ACCEPTED)

    async def test_referral_service(self):
        company_service = CompanyService(self.db)
        job_service = JobService(self.db)
        referral_service = ReferralService(self.db)

        company = await company_service.create_company(
            CompanyCreate(name="Meta", industry="Social Media")
        )
        job = await job_service.create_job(
            posted_by_id=5,
            job_in=JobPostingCreate(
                title="Frontend Developer",
                description="React expert needed",
                company_id=company.id,
            ),
        )

        # 1. Create referral request
        ref_in = ReferralCreate(
            job_posting_id=job.id,
            referred_user_id=20,
            message="Please refer my college peer for this role.",
        )
        referral = await referral_service.create_referral(
            referrer_id=15, referral_in=ref_in
        )
        self.assertIsNotNone(referral.id)
        self.assertEqual(referral.referrer_id, 15)

        # 2. Get user referrals
        user_refs = await referral_service.get_user_referrals(user_id=15)
        self.assertEqual(len(user_refs), 1)


if __name__ == "__main__":
    unittest.main()
