import unittest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.users.models.role import Role
from app.users.models.user import User
from app.profiles.models.profile import Profile
from app.jobs.models.company import Company
from app.posts.models.post import Post


class TestMember2Week4E2E(unittest.IsolatedAsyncioTestCase):
    """Week 4 Member 2 E2E Integration Suite for Profiles, Jobs, and Analytics."""

    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )

        async with self.SessionLocal() as db:
            # Create Roles
            self.admin_role = Role(id=1, name="Admin")
            self.student_role = Role(id=2, name="Student")
            db.add_all([self.admin_role, self.student_role])
            await db.commit()

            # Create Company
            self.company = Company(id=1, name="Innovate Tech", industry="Software")
            db.add(self.company)
            await db.commit()

            # Create Admin User
            self.admin_user = User(
                id=1,
                email="admin@knots.edu.in",
                hashed_password=hash_password("adminpass123"),
                role_id=1,
                is_active=True,
            )
            # Create Student User 1
            self.student1 = User(
                id=2,
                email="alice@knots.edu.in",
                hashed_password=hash_password("studentpass123"),
                role_id=2,
                is_active=True,
            )
            # Create Student User 2
            self.student2 = User(
                id=3,
                email="bob@knots.edu.in",
                hashed_password=hash_password("studentpass123"),
                role_id=2,
                is_active=True,
            )
            db.add_all([self.admin_user, self.student1, self.student2])
            await db.commit()

            # Create Profiles
            self.admin_profile = Profile(
                id=1,
                user_id=1,
                first_name="Admin",
                last_name="User",
                department="Administration",
                bio="Managing Knots platform",
            )
            self.profile1 = Profile(
                id=2,
                user_id=2,
                first_name="Alice",
                last_name="Smith",
                department="Computer Science",
                bio="Passionate Python developer",
                skills={"Technical": ["Python", "React", "FastAPI"]},
            )
            self.profile2 = Profile(
                id=3,
                user_id=3,
                first_name="Bob",
                last_name="Jones",
                department="AI & DS",
                bio="Machine learning enthusiast",
                skills={"Technical": ["PyTorch", "Python"]},
            )
            db.add_all([self.admin_profile, self.profile1, self.profile2])
            await db.commit()

            # Create sample Post for analytics testing
            self.post = Post(
                id=1,
                author_id=2,
                content="Excited to build Knots platform with full stack analytics!",
            )
            db.add(self.post)
            await db.commit()

        # Override get_db dependency
        async def override_get_db():
            async with self.SessionLocal() as session:
                try:
                    yield session
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise

        app.dependency_overrides[get_db] = override_get_db

        self.admin_token = create_access_token("1")
        self.student1_token = create_access_token("2")
        self.student2_token = create_access_token("3")

        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        self.student1_headers = {"Authorization": f"Bearer {self.student1_token}"}
        self.student2_headers = {"Authorization": f"Bearer {self.student2_token}"}

        self.client = AsyncClient(
            transport=ASGITransport(app=app), base_url="http://testserver"
        )

    async def asyncTearDown(self):
        await self.client.aclose()
        app.dependency_overrides.clear()
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await self.engine.dispose()

    async def test_paginated_list_profiles_and_search(self):
        # List all profiles
        resp = await self.client.get(
            "/api/v1/profiles?skip=0&limit=10", headers=self.student1_headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertGreaterEqual(len(data), 3)

        # Search profiles by keyword
        resp_search = await self.client.get(
            "/api/v1/profiles?search=Python", headers=self.student1_headers
        )
        self.assertEqual(resp_search.status_code, 200)
        search_data = resp_search.json()["data"]
        # Alice should be found
        names = [p["first_name"] for p in search_data]
        self.assertIn("Alice", names)

    async def test_analytics_record_views_and_not_found_validation(self):
        # Valid profile view
        resp = await self.client.post(
            f"/api/v1/analytics/profile/{self.profile1.id}/view",
            headers=self.student2_headers,
        )
        self.assertEqual(resp.status_code, 200)

        # Invalid profile view (should return 404 cleanly)
        resp_404_prof = await self.client.post(
            "/api/v1/analytics/profile/9999/view",
            headers=self.student2_headers,
        )
        self.assertEqual(resp_404_prof.status_code, 404)

        # Valid post view
        resp_post = await self.client.post(
            f"/api/v1/analytics/posts/{self.post.id}/view",
            headers=self.student2_headers,
        )
        self.assertEqual(resp_post.status_code, 200)

        # Invalid post view (should return 404 cleanly)
        resp_404_post = await self.client.post(
            "/api/v1/analytics/posts/9999/view",
            headers=self.student2_headers,
        )
        self.assertEqual(resp_404_post.status_code, 404)

    async def test_job_posting_admin_rbac_and_lifecycle(self):
        # Student 1 creates a job posting
        job_payload = {
            "title": "Backend Python Developer",
            "description": "Looking for a skilled FastAPI developer to join our team.",
            "company_id": 1,
            "location": "Nagpur, India",
            "workplace_type": "hybrid",
            "job_type": "full-time",
            "salary_range": "10-15 LPA",
            "required_skills": ["Python", "FastAPI", "SQLAlchemy"],
        }
        create_resp = await self.client.post(
            "/api/v1/jobs", json=job_payload, headers=self.student1_headers
        )
        self.assertEqual(create_resp.status_code, 201)
        job_id = create_resp.json()["data"]["id"]

        # Student 2 should NOT be able to edit Student 1's job
        update_payload = {"title": "Hacked Title"}
        forbidden_resp = await self.client.put(
            f"/api/v1/jobs/{job_id}",
            json=update_payload,
            headers=self.student2_headers,
        )
        self.assertEqual(forbidden_resp.status_code, 403)

        # Admin SHOULD be able to update Student 1's job (testing _is_user_admin fix)
        admin_update = {"title": "Updated by Admin"}
        admin_update_resp = await self.client.put(
            f"/api/v1/jobs/{job_id}",
            json=admin_update,
            headers=self.admin_headers,
        )
        self.assertEqual(admin_update_resp.status_code, 200)
        self.assertEqual(admin_update_resp.json()["data"]["title"], "Updated by Admin")

        # Admin SHOULD be able to delete Student 1's job
        admin_del_resp = await self.client.delete(
            f"/api/v1/jobs/{job_id}",
            headers=self.admin_headers,
        )
        self.assertEqual(admin_del_resp.status_code, 200)


if __name__ == "__main__":
    unittest.main()
