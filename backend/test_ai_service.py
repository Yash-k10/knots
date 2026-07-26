import unittest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.database import Base
import app.core.base  # noqa: F401
from app.users.models.user import User
from app.profiles.models.profile import Profile
from app.jobs.models.company import Company
from app.jobs.models.job_posting import (
    JobPosting,
    JobStatusEnum,
    JobTypeEnum,
    WorkplaceTypeEnum,
)
from app.posts.models.post import Post, PostVisibility
from app.ai.services.ai import (
    AIResumeService,
    CareerRoadmapService,
    AIRecommendationService,
)


class TestAIServices(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed users & profiles
        self.user1 = User(email="student@campus.edu", hashed_password="pw")
        self.user2 = User(email="peer@campus.edu", hashed_password="pw")
        self.db.add_all([self.user1, self.user2])
        await self.db.flush()

        self.profile1 = Profile(
            user_id=self.user1.id,
            first_name="Alice",
            last_name="Student",
            department="Computer Science",
            graduation_year=2026,
            skills=["Python", "FastAPI", "React", "SQL", "Machine Learning"],
        )
        self.profile2 = Profile(
            user_id=self.user2.id,
            first_name="Bob",
            last_name="Peer",
            department="Computer Science",
            graduation_year=2026,
            skills=["Python", "Docker", "AWS"],
        )
        self.db.add_all([self.profile1, self.profile2])
        await self.db.flush()

        # Seed company and open job posting
        self.company = Company(
            name="TechCorp", industry="Software", location="Bangalore"
        )
        self.db.add(self.company)
        await self.db.flush()

        self.job = JobPosting(
            title="Python Backend Engineer",
            description="Looking for Python and FastAPI developer",
            company_id=self.company.id,
            posted_by_id=self.user2.id,
            job_type=JobTypeEnum.FULL_TIME,
            workplace_type=WorkplaceTypeEnum.HYBRID,
            required_skills=["Python", "FastAPI", "SQL"],
            status=JobStatusEnum.OPEN,
        )
        self.db.add(self.job)
        await self.db.flush()

        # Seed a campus post
        self.post = Post(
            content="Check out the new campus Machine Learning club discussion and share your thoughts!",
            author_id=self.user2.id,
            visibility=PostVisibility.PUBLIC,
        )
        self.db.add(self.post)
        await self.db.commit()

    async def asyncTearDown(self):
        await self.db.close()
        await self.engine.dispose()

    async def test_analyze_resume(self):
        service = AIResumeService()
        resume_text = "Experienced Software Engineering intern with skills in Python, FastAPI, React, SQL, and Docker. Implemented REST API project that improved performance by 35%."
        res = await service.analyze_resume(resume_text)
        self.assertGreaterEqual(res["score"], 80)
        self.assertIn("score", res)
        self.assertIn("feedback", res)
        self.assertIn("suggestions", res)

    async def test_generate_roadmap(self):
        service = CareerRoadmapService()
        res = await service.generate_roadmap("Backend Engineer", ["Python"])
        self.assertEqual(res["role"], "Backend Engineer")
        self.assertGreater(len(res["steps"]), 0)

    async def test_connection_recommendations(self):
        service = AIRecommendationService(self.db)
        recs = await service.get_recommended_connections(self.user1.id)
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0].user_id, self.user2.id)
        self.assertGreaterEqual(recs[0].match_score, 70)
        self.assertIn("Python", recs[0].shared_skills)

    async def test_job_recommendations(self):
        service = AIRecommendationService(self.db)
        recs = await service.get_recommended_jobs(self.user1.id)
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0].job_id, self.job.id)
        self.assertEqual(recs[0].company_name, "TechCorp")
        self.assertGreaterEqual(recs[0].match_score, 70)
        self.assertIn("Python", recs[0].matching_skills)

    async def test_post_recommendations(self):
        service = AIRecommendationService(self.db)
        recs = await service.get_recommended_posts(self.user1.id)
        self.assertEqual(len(recs), 1)
        self.assertEqual(recs[0].post_id, self.post.id)
        self.assertEqual(recs[0].author_name, "Peer")

    async def test_all_recommendations(self):
        service = AIRecommendationService(self.db)
        all_recs = await service.get_all_recommendations(self.user1.id)
        self.assertEqual(len(all_recs.connections), 1)
        self.assertEqual(len(all_recs.jobs), 1)
        self.assertEqual(len(all_recs.posts), 1)


if __name__ == "__main__":
    unittest.main()
