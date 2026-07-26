import unittest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import Base
from app.main import app
from app.core.database import get_db
from app.auth.dependencies.auth import get_current_user
from app.users.models.user import User
from app.users.models.role import Role
from app.clubs.services.club import ClubService
from app.clubs.schemas.club import ClubCreate, ClubUpdate, ClubMemberUpdateRole
from app.core.exceptions import (
    ConflictError,
)


class TestClubsModule(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )
        self.db = self.SessionLocal()

        # Seed roles & users
        self.student_role = Role(id=1, name="STUDENT")
        self.db.add(self.student_role)
        await self.db.commit()

        # Create two mock users
        self.leader_user = User(
            id=1,
            email="leader@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.member_user = User(
            id=2,
            email="member@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.db.add_all([self.leader_user, self.member_user])
        await self.db.commit()

        self.current_mock_user = self.leader_user

        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session
                await session.commit()

        async def override_get_current_user():
            async with self.SessionLocal() as session:
                stmt = (
                    select(User)
                    .where(User.id == self.current_mock_user.id)
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

    async def test_club_service_flow(self):
        service = ClubService(self.db)

        # 1. Create Club
        payload = ClubCreate(
            name="Coding Club", description="For coders", category="TECH"
        )
        club = await service.create_club(self.leader_user.id, payload)
        self.assertEqual(club.name, "Coding Club")

        # 2. Prevent duplicate name creation
        with self.assertRaises(ConflictError):
            await service.create_club(self.member_user.id, payload)

        # 3. Get Club Detail
        detail = await service.get_club_detail(club.id, self.leader_user.id)
        self.assertEqual(detail.name, "Coding Club")
        self.assertEqual(detail.user_role, "LEADER")
        self.assertEqual(detail.members_count, 1)

        # 4. Join Club
        member_membership = await service.join_club(club.id, self.member_user.id)
        self.assertEqual(member_membership.role, "MEMBER")

        # 5. List Clubs
        clubs = await service.list_clubs(category="TECH")
        self.assertEqual(len(clubs), 1)

        # 6. Update Member Role (Leader promotes Member to OFFICER)
        update_role_payload = ClubMemberUpdateRole(role="OFFICER")
        updated_member = await service.update_member_role(
            club.id, self.leader_user.id, self.member_user.id, update_role_payload
        )
        self.assertEqual(updated_member.role, "OFFICER")

        # 7. Update Club Metadata
        update_club_payload = ClubUpdate(description="For advanced coders")
        updated_club = await service.update_club(
            club.id, self.leader_user.id, update_club_payload
        )
        self.assertEqual(updated_club.description, "For advanced coders")

        # 8. Leave Club
        await service.leave_club(club.id, self.member_user.id)
        detail_after_leave = await service.get_club_detail(club.id, self.leader_user.id)
        self.assertEqual(detail_after_leave.members_count, 1)

    async def test_club_router_endpoints(self):
        # We test HTTP endpoints using AsyncClient
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            # 1. Create Club
            payload = {
                "name": "Designers Hub",
                "description": "For UI/UX",
                "category": "DESIGN",
            }
            res = await ac.post("/api/v1/clubs", json=payload)
            self.assertEqual(res.status_code, 200)
            club_data = res.json()["data"]
            club_id = club_data["id"]

            # 2. Get list of clubs
            res = await ac.get("/api/v1/clubs?category=DESIGN")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 1)

            # 3. Get single club detail
            res = await ac.get(f"/api/v1/clubs/{club_id}")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["name"], "Designers Hub")

            # 4. Join Club
            # Switch current mock user to member_user
            self.current_mock_user = self.member_user
            res = await ac.post(f"/api/v1/clubs/{club_id}/join")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["role"], "MEMBER")

            # 5. Get members list
            res = await ac.get(f"/api/v1/clubs/{club_id}/members")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(res.json()["data"]), 2)

            # 6. Update Member Role
            # Switch current mock user back to leader_user to allow authorization
            self.current_mock_user = self.leader_user
            role_payload = {"role": "OFFICER"}
            res = await ac.put(
                f"/api/v1/clubs/{club_id}/members/{self.member_user.id}/role",
                json=role_payload,
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["role"], "OFFICER")

            # 7. Leave Club
            self.current_mock_user = self.member_user
            res = await ac.post(f"/api/v1/clubs/{club_id}/leave")
            self.assertEqual(res.status_code, 200)

            # 8. Delete Club
            self.current_mock_user = self.leader_user
            res = await ac.delete(f"/api/v1/clubs/{club_id}")
            self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
