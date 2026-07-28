import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.auth.dependencies.auth import get_current_user
from app.connections.models.connection import Connection, ConnectionStatus
from app.core.database import Base, get_db
from app.main import app
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class TestAIConnectionSuggestions(unittest.IsolatedAsyncioTestCase):
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
                email="user1@knots.edu",
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
                graduation_year=2025,
                skills=["Python", "FastAPI", "React", "Docker"],
            )

            # User 2 (Candidate 1 - High Match)
            self.user2 = User(
                id=2,
                email="user2@knots.edu",
                hashed_password="pw",
                role_id=2,
                is_active=True,
            )
            self.profile2 = Profile(
                id=2,
                user_id=2,
                first_name="Alice",
                last_name="Smith",
                department="Computer Science",
                graduation_year=2025,
                skills=["Python", "React", "TypeScript"],
            )

            # User 3 (Candidate 2 - Moderate Match)
            self.user3 = User(
                id=3,
                email="user3@knots.edu",
                hashed_password="pw",
                role_id=2,
                is_active=True,
            )
            self.profile3 = Profile(
                id=3,
                user_id=3,
                first_name="Bob",
                last_name="Jones",
                department="Electrical Engineering",
                graduation_year=2026,
                skills=["Python", "C++"],
            )

            db.add_all(
                [
                    self.user1,
                    self.profile1,
                    self.user2,
                    self.profile2,
                    self.user3,
                    self.profile3,
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

    async def test_get_connection_suggestions_success(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/ai/connection-suggestions")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIn("data", data)
            suggestions = data["data"]
            self.assertEqual(len(suggestions), 2)

            # High match should be first (Alice - User 2)
            top_match = suggestions[0]
            self.assertEqual(top_match["user_id"], 2)
            self.assertEqual(top_match["first_name"], "Alice")
            self.assertEqual(top_match["department"], "Computer Science")
            self.assertIn("Python", top_match["common_skills"])
            self.assertIn("React", top_match["common_skills"])
            self.assertGreater(top_match["match_score"], 70)
            self.assertIn("Matching department", top_match["reason"])

    async def test_get_connection_suggestions_excludes_connected(self):
        # Add connection between user 1 and user 2
        async with self.SessionLocal() as db:
            connection = Connection(
                requester_id=1,
                addressee_id=2,
                status=ConnectionStatus.ACCEPTED,
            )
            db.add(connection)
            await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/ai/connection-suggestions")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            suggestions = data["data"]
            self.assertEqual(len(suggestions), 1)
            self.assertEqual(suggestions[0]["user_id"], 3)  # Only Bob remains

    async def test_unauthenticated_connection_suggestions(self):
        app.dependency_overrides.pop(get_current_user, None)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/ai/connection-suggestions")
            self.assertEqual(response.status_code, 401)
