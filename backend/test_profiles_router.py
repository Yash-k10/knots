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


class TestProfilesRouter(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        self.student_role = Role(id=2, name="STUDENT", permissions=["view_profile"])
        self.db.add(self.student_role)
        await self.db.commit()

        self.test_user = User(
            id=1,
            email="student_profile@sbjit.edu.in",
            hashed_password="hashed_password",
            role_id=2,
            is_active=True,
            is_verified=True,
        )
        self.peer_user = User(
            id=2,
            email="peer_student@sbjit.edu.in",
            hashed_password="hashed_password",
            role_id=2,
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([self.test_user, self.peer_user])
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

    async def test_profiles_full_flow(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            # 1. Get own profile (should auto-create)
            res = await ac.get("/api/v1/profiles/me")
            self.assertEqual(res.status_code, 200)
            data = res.json()["data"]
            self.assertEqual(data["user_id"], self.test_user.id)

            # 2. Update own profile
            update_payload = {
                "first_name": "Bob",
                "last_name": "Smith",
                "bio": "Alumni of SBJIT",
                "department": "Mechanical Engineering",
                "graduation_year": 2025,
                "skills": ["CAD", "Robotics", "Python"],
            }
            res = await ac.put("/api/v1/profiles/me", json=update_payload)
            self.assertEqual(res.status_code, 200)
            data = res.json()["data"]
            self.assertEqual(data["first_name"], "Bob")
            self.assertEqual(data["last_name"], "Smith")
            self.assertEqual(data["department"], "Mechanical Engineering")

            # 3. Add education
            edu_payload = {
                "institution_name": "SBJITMR",
                "degree": "B.E.",
                "field_of_study": "Mechanical Engineering",
                "start_date": "2021-08-01",
                "end_date": "2025-05-30",
                "gpa": 8.5,
                "description": "Robotics Club Lead",
            }
            res = await ac.post("/api/v1/profiles/me/education", json=edu_payload)
            self.assertEqual(res.status_code, 200)
            edu_id = res.json()["data"]["id"]

            # 4. Update education
            res = await ac.put(
                f"/api/v1/profiles/me/education/{edu_id}",
                json={"gpa": 8.8},
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["gpa"], 8.8)

            # 5. Add employment history
            exp_payload = {
                "company_name": "AutoRobots Ltd",
                "title": "Robotics Engineer Intern",
                "location": "Nagpur, India",
                "start_date": "2024-05-01",
                "end_date": "2024-07-31",
                "description": "Designed automated robotic arms",
            }
            res = await ac.post("/api/v1/profiles/me/experience", json=exp_payload)
            self.assertEqual(res.status_code, 200)
            exp_id = res.json()["data"]["id"]

            # 6. Update employment history
            res = await ac.put(
                f"/api/v1/profiles/me/experience/{exp_id}",
                json={"title": "Senior Robotics Intern"},
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["title"], "Senior Robotics Intern")

            # 7. Endorse peer skill
            res = await ac.post(
                f"/api/v1/profiles/{self.peer_user.id}/skills/Python/endorse"
            )
            self.assertEqual(res.status_code, 200)

            # 8. Get peer profile by ID
            res = await ac.get(f"/api/v1/profiles/{self.peer_user.id}")
            self.assertEqual(res.status_code, 200)

            # Unendorse skill
            res = await ac.delete(
                f"/api/v1/profiles/{self.peer_user.id}/skills/Python/endorse"
            )
            self.assertEqual(res.status_code, 200)

            # 9. Delete education and employment
            res = await ac.delete(f"/api/v1/profiles/me/education/{edu_id}")
            self.assertEqual(res.status_code, 200)

            res = await ac.delete(f"/api/v1/profiles/me/experience/{exp_id}")
            self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
