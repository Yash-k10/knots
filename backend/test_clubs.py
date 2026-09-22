import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from app.auth.dependencies.auth import get_current_user
from app.clubs.schemas.club import (
    ClubCreate,
    ClubMemberUpdateRole,
    ClubResourceCreate,
    ClubUpdate,
)
from app.clubs.services.club import ClubService
from app.core.database import Base, get_db
from app.core.exceptions import (
    AuthorizationError,
    ConflictError,
)
from app.main import app
from app.users.models.role import Role
from app.users.models.user import User


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
        self.faculty_role = Role(id=3, name="FACULTY")
        self.alumni_role = Role(id=4, name="ALUMNI")
        self.db.add_all([self.student_role, self.faculty_role, self.alumni_role])
        await self.db.commit()

        # Create mock users
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
        self.head_user = User(
            id=3,
            email="head@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.co_head_user = User(
            id=4,
            email="cohead@knots.edu",
            hashed_password="pwd",
            role_id=1,
            is_active=True,
            is_verified=True,
        )
        self.faculty_user = User(
            id=5,
            email="faculty@knots.edu",
            hashed_password="pwd",
            role_id=3,
            is_active=True,
            is_verified=True,
        )
        self.alumni_user = User(
            id=6,
            email="alumni@knots.edu",
            hashed_password="pwd",
            role_id=4,
            is_active=True,
            is_verified=True,
        )
        self.db.add_all(
            [
                self.leader_user,
                self.member_user,
                self.head_user,
                self.co_head_user,
                self.faculty_user,
                self.alumni_user,
            ]
        )
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
        self.assertEqual(member_membership.role, "PENDING")

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
            self.assertEqual(res.json()["data"]["role"], "PENDING")

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

    async def test_club_resource_permissions_and_types(self):
        service = ClubService(self.db)

        # 1. Create Club
        payload = ClubCreate(
            name="Robotics Club", description="Robotics chapter", category="TECH"
        )
        club = await service.create_club(self.leader_user.id, payload)

        # 2. Appoint Head, Co-Head, Faculty Coordinator, Alumni Mentor
        club.head_id = self.head_user.id
        club.co_head_id = self.co_head_user.id
        club.faculty_coordinator_id = self.faculty_user.id
        club.alumni_mentor_id = self.alumni_user.id
        await self.db.commit()

        # 3. Regular student member attempts to post -> Must raise AuthorizationError
        with self.assertRaises(AuthorizationError):
            await service.create_club_resource(
                club_id=club.id,
                user_id=self.member_user.id,
                payload=ClubResourceCreate(
                    title="Unauthorized Notes",
                    url="https://drive.google.com/test",
                    category="Notes",
                    resource_type="DOC",
                ),
            )

        # 4. Club Head posts Doc under Notes -> Allowed
        doc_res = await service.create_club_resource(
            club_id=club.id,
            user_id=self.head_user.id,
            payload=ClubResourceCreate(
                title="Robotics Kinematics Notes",
                url="https://drive.google.com/kinematics.doc",
                category="Notes",
                resource_type="DOC",
            ),
        )
        self.assertEqual(doc_res.resource_type, "DOC")
        self.assertEqual(doc_res.category, "Notes")

        # 5. Club Co-Head posts PDF under Question Bank -> Allowed
        pdf_res = await service.create_club_resource(
            club_id=club.id,
            user_id=self.co_head_user.id,
            payload=ClubResourceCreate(
                title="Autonomous Navigation Question Bank",
                url="https://drive.google.com/nav-questions.pdf",
                category="Question Bank",
                resource_type="PDF",
            ),
        )
        self.assertEqual(pdf_res.resource_type, "PDF")
        self.assertEqual(pdf_res.category, "Question Bank")

        # 6. Faculty Coordinator posts Image under Notes -> Allowed
        img_res = await service.create_club_resource(
            club_id=club.id,
            user_id=self.faculty_user.id,
            payload=ClubResourceCreate(
                title="Circuit Diagram Architecture",
                url="https://images.unsplash.com/circuit.png",
                category="Notes",
                resource_type="IMAGE",
            ),
        )
        self.assertEqual(img_res.resource_type, "IMAGE")

        # 7. Alumni posts GitHub link under URL / Repo -> Allowed
        git_res = await service.create_club_resource(
            club_id=club.id,
            user_id=self.alumni_user.id,
            payload=ClubResourceCreate(
                title="ROS2 Navigation Stack Repo",
                url="https://github.com/knots/ros2-navigation",
                category="URL / Repo",
                resource_type="GITHUB",
            ),
        )
        self.assertEqual(git_res.resource_type, "GITHUB")
        self.assertEqual(git_res.category, "URL / Repo")

        # 8. Retrieve all resources -> 4 items returned with correct resource_type & categories
        resources = await service.get_club_resources(club.id)
        self.assertEqual(len(resources), 4)
        types = {r.resource_type for r in resources}
        self.assertEqual(types, {"DOC", "PDF", "IMAGE", "GITHUB"})


if __name__ == "__main__":
    unittest.main()
