import unittest
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.core.base  # noqa: F401
from app.analytics.services.analytics import AnalyticsService
from app.core.database import Base
from app.posts.models.post import Post
from app.profiles.models.profile import Profile
from app.profiles.models.skill_endorsement import SkillEndorsement
from app.profiles.services.profile import ProfileService
from app.users.models.user import User


class TestAnalyticsAndEndorsements(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed initial users and profiles
        self.user1 = User(
            email="user1@example.com", hashed_password="hashed_password_1"
        )
        self.user2 = User(
            email="user2@example.com", hashed_password="hashed_password_2"
        )
        self.db.add_all([self.user1, self.user2])
        await self.db.flush()

        self.profile1 = Profile(
            user_id=self.user1.id,
            first_name="Alice",
            last_name="Smith",
            skills={"Languages": ["Python", "JavaScript"]},
        )
        self.profile2 = Profile(
            user_id=self.user2.id,
            first_name="Bob",
            last_name="Jones",
            skills={"Languages": ["Java", "C++"]},
        )
        self.db.add_all([self.profile1, self.profile2])
        await self.db.flush()
        await self.db.commit()

    async def asyncTearDown(self):
        await self.db.close()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_record_and_get_profile_views(self):
        analytics_service = AnalyticsService(self.db)

        # Alice profile viewed by Bob
        await analytics_service.record_profile_view(self.profile1.id, self.user2.id)
        # Alice profile viewed anonymously
        await analytics_service.record_profile_view(self.profile1.id, None)

        views_resp = await analytics_service.get_profile_views(self.user1.id, days=7)
        self.assertEqual(views_resp.total_views, 2)
        # Check views history contains today's views
        today_str = datetime.now(timezone.utc).date().isoformat()
        today_item = next(
            (item for item in views_resp.history if item.date == today_str), None
        )
        self.assertIsNotNone(today_item)
        self.assertEqual(today_item.views, 2)

    async def test_post_view_engagement_and_trending(self):
        analytics_service = AnalyticsService(self.db)

        # Create post by Alice
        post = Post(content="Hello networking world!", author_id=self.user1.id)
        self.db.add(post)
        await self.db.flush()

        # Bob views Alice's post
        await analytics_service.record_post_view(post.id, self.user2.id)

        # Get Alice's posts engagement
        eng_resp = await analytics_service.get_posts_engagement(self.user1.id)
        self.assertEqual(eng_resp.total_views, 1)
        self.assertEqual(len(eng_resp.posts), 1)
        self.assertEqual(eng_resp.posts[0].views, 1)

        # Check trending posts list
        trending = await analytics_service.get_trending_posts(limit=5)
        self.assertEqual(len(trending), 1)
        self.assertEqual(trending[0].post_id, post.id)
        self.assertEqual(trending[0].views, 1)
        self.assertEqual(trending[0].score, 1)  # view = 1 point

    async def test_skills_endorsement(self):
        profile_service = ProfileService(self.db)

        # Bob endorses Alice's skill: Python
        endorsement = SkillEndorsement(
            profile_id=self.profile1.id, skill_name="Python", endorser_id=self.user2.id
        )
        self.db.add(endorsement)
        await self.db.flush()

        # Alice's profile should now be enriched with Bob's endorsement
        alice_profile = await profile_service.get_profile_by_user_id(self.user1.id)
        self.assertEqual(len(alice_profile.endorsements), 1)
        self.assertEqual(alice_profile.endorsements[0]["skill_name"], "Python")
        self.assertEqual(alice_profile.endorsements[0]["endorser_name"], "Bob Jones")

    async def test_system_stats(self):
        analytics_service = AnalyticsService(self.db)
        stats = await analytics_service.get_system_stats()
        self.assertEqual(stats.total_users, 2)
        self.assertEqual(stats.total_posts, 0)
        self.assertEqual(stats.total_connections, 0)
        self.assertEqual(stats.total_jobs, 0)
