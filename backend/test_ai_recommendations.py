import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.auth.dependencies.auth import get_current_user
from app.core.database import Base, get_db
from app.jobs.models.application import Application
from app.jobs.models.company import Company
from app.jobs.models.enums import JobStatusEnum, JobTypeEnum, WorkplaceTypeEnum
from app.jobs.models.job_posting import JobPosting
from app.main import app
from app.posts.models.post import Post, PostVisibility
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class TestAIRecommendations(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )

        async with self.SessionLocal() as db:
            student_role = Role(id=2, name="Student")
            db.add(student_role)
            await db.commit()

            # User 1 (Current User)
            self.user1 = User(
                id=1,
                email="student@knots.edu",
                hashed_password="pw",
                role_id=2,
                is_active=True,
            )
            self.profile1 = Profile(
                id=1,
                user_id=1,
                first_name="Yash",
                last_name="Lead",
                department="Computer Science",
                skills=["Python", "FastAPI", "React", "Machine Learning"],
            )

            # Company & Job Postings
            self.company = Company(
                id=1, name="TechCorp", description="Leading Tech Firm"
            )
            self.job1 = JobPosting(
                id=1,
                title="Full Stack Python Developer",
                description="Looking for Python and FastAPI expert in Computer Science.",
                company_id=1,
                posted_by_id=1,
                job_type=JobTypeEnum.FULL_TIME,
                workplace_type=WorkplaceTypeEnum.REMOTE,
                salary_range="$100k - $120k",
                required_skills=["Python", "FastAPI", "React"],
                status=JobStatusEnum.OPEN,
            )
            self.job2 = JobPosting(
                id=2,
                title="Embedded Systems Engineer",
                description="C++ and Microcontrollers.",
                company_id=1,
                posted_by_id=1,
                job_type=JobTypeEnum.FULL_TIME,
                workplace_type=WorkplaceTypeEnum.ON_SITE,
                salary_range="$80k - $90k",
                required_skills=["C++", "Assembly"],
                status=JobStatusEnum.OPEN,
            )

            # Posts
            self.post1 = Post(
                id=1,
                author_id=1,
                content="Machine Learning and Python are transforming campus AI projects!",
                visibility=PostVisibility.PUBLIC,
            )
            self.post2 = Post(
                id=2,
                author_id=1,
                content="Campus cafeteria lunch menu update for today.",
                visibility=PostVisibility.PUBLIC,
            )

            db.add_all(
                [
                    self.user1,
                    self.profile1,
                    self.company,
                    self.job1,
                    self.job2,
                    self.post1,
                    self.post2,
                ]
            )
            await db.commit()

        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session
                await session.commit()

        async def override_get_current_user():
            return self.user1

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def test_get_job_recommendations_success(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/ai/job-recommendations")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIn("data", data)
            jobs = data["data"]
            self.assertEqual(len(jobs), 2)

            # Job 1 (Python) should be ranked first with higher match_score
            top_job = jobs[0]
            self.assertEqual(top_job["job_id"], 1)
            self.assertEqual(top_job["title"], "Full Stack Python Developer")
            self.assertIn("Python", top_job["matching_skills"])
            self.assertGreater(top_job["match_score"], 70)

    async def test_get_job_recommendations_excludes_applied_jobs(self):
        async with self.SessionLocal() as db:
            app_obj = Application(
                job_posting_id=1,
                applicant_id=1,
            )
            db.add(app_obj)
            await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/ai/job-recommendations")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            jobs = data["data"]
            self.assertEqual(len(jobs), 1)
            self.assertEqual(jobs[0]["job_id"], 2)  # Only Job 2 remains

    async def test_get_content_recommendations_success(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/ai/content-recommendations")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIn("data", data)
            posts = data["data"]
            self.assertEqual(len(posts), 2)

            # Post 1 (Machine Learning & Python) should be ranked higher
            top_post = posts[0]
            self.assertEqual(top_post["post_id"], 1)
            self.assertIn("Python", top_post["matched_topics"])
            self.assertGreater(top_post["relevance_score"], 50)
