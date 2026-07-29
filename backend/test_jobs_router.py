import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from app.auth.dependencies.auth import get_current_user
from app.core.database import Base, get_db
from app.main import app
from app.users.models.role import Role
from app.users.models.user import User


class TestJobsRouter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed initial roles
        self.admin_role = Role(id=1, name="ADMIN", permissions=["admin"])
        self.student_role = Role(id=2, name="STUDENT", permissions=["apply_job"])
        self.recruiter_role = Role(id=3, name="RECRUITER", permissions=["create_job"])
        self.db.add_all([self.admin_role, self.student_role, self.recruiter_role])
        await self.db.commit()

        # Create mock user
        self.test_user = User(
            id=1,
            email="test_user@sbjit.edu.in",
            hashed_password="hashed_password",
            role_id=1,  # Set as Admin for testing all endpoints
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.test_user)
        await self.db.commit()
        await self.db.refresh(self.test_user)

        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session
                await session.commit()

        async def override_get_current_user():
            async with self.SessionLocal() as session:
                stmt = (
                    select(User)
                    .where(User.id == self.test_user.id)
                    .options(selectinload(User.role))
                )
                res = await session.execute(stmt)
                return res.scalar()

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_full_jobs_flow(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            # 1. Create company
            company_payload = {
                "name": "SuperTech",
                "industry": "Tech",
                "location": "Boston",
                "description": "Building cool things.",
            }
            res = await ac.post("/api/v1/jobs/companies", json=company_payload)
            self.assertEqual(res.status_code, 201)
            company_id = res.json()["data"]["id"]

            # 2. Get company
            res = await ac.get(f"/api/v1/jobs/companies/{company_id}")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["name"], "SuperTech")

            # 3. List companies
            res = await ac.get("/api/v1/jobs/companies")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 1)

            # 4. Create Job Posting
            job_payload = {
                "title": "FastAPI Developer",
                "description": "Build high-performance REST APIs",
                "company_id": company_id,
                "job_type": "full-time",
                "workplace_type": "remote",
                "location": "Remote",
                "salary_min": 100000,
                "salary_max": 130000,
                "salary_range": "$100k-$130k",
                "required_skills": ["Python", "FastAPI"],
            }
            res = await ac.post("/api/v1/jobs", json=job_payload)
            self.assertEqual(res.status_code, 201)
            job_id = res.json()["data"]["id"]

            # 5. List Jobs
            res = await ac.get("/api/v1/jobs")
            self.assertEqual(res.status_code, 200)
            self.assertGreaterEqual(len(res.json()["data"]), 1)

            # 6. Get Job details
            res = await ac.get(f"/api/v1/jobs/{job_id}")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["title"], "FastAPI Developer")

            # 7. Update Job
            update_payload = {"title": "Lead FastAPI Developer"}
            res = await ac.put(f"/api/v1/jobs/{job_id}", json=update_payload)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["title"], "Lead FastAPI Developer")

            # 8. Apply for job
            app_payload = {
                "job_posting_id": job_id,
                "resume_url": "http://example.com/cv.pdf",
                "cover_letter": "Hire me please",
            }
            res = await ac.post(f"/api/v1/jobs/{job_id}/apply", json=app_payload)
            self.assertEqual(res.status_code, 201)
            app_id = res.json()["data"]["id"]

            # 9. Get my applications
            res = await ac.get("/api/v1/jobs/applications/me")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 1)

            # 10. Get job applications
            res = await ac.get(f"/api/v1/jobs/{job_id}/applications")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 1)

            # 11. Update application status
            status_payload = {"status": "accepted"}
            res = await ac.patch(
                f"/api/v1/jobs/applications/{app_id}", json=status_payload
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["status"], "accepted")

            # 12. Create referral request
            ref_payload = {
                "job_posting_id": job_id,
                "referred_user_id": 1,
                "message": "Refer me!",
            }
            res = await ac.post("/api/v1/jobs/referrals", json=ref_payload)
            self.assertEqual(res.status_code, 201)

            # 13. Get referrals
            res = await ac.get("/api/v1/jobs/referrals")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 1)

            # 14. Delete Job
            res = await ac.delete(f"/api/v1/jobs/{job_id}")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["message"], "Job posting deleted successfully")

            # Verify deleted
            res = await ac.get(f"/api/v1/jobs/{job_id}")
            self.assertEqual(res.status_code, 404)
