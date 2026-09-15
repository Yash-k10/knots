from datetime import datetime, timedelta
import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.admin.models.controller_invite import ControllerInvite
from app.admin.services.controller_invite import hash_activation_code
from app.auth.dependencies.auth import get_current_user
from app.auth.schemas.auth import UserRegister
from app.auth.services.auth import AuthService, save_otp
from app.core.database import Base, get_db
from app.core.exceptions import ValidationError
from app.main import app
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class TestControllerInvites(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine(
            "sqlite+aiosqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )

        async with self.SessionLocal() as db:
            self.admin_role = Role(id=1, name="Admin")
            self.controller_role = Role(id=2, name="Controller")
            self.student_role = Role(id=3, name="Student")
            db.add_all([self.admin_role, self.controller_role, self.student_role])
            await db.commit()

            self.admin_user = User(
                id=1,
                email="central_admin@sbjit.edu.in",
                hashed_password="hashed_pw",
                role_id=1,
                is_active=True,
                is_verified=True,
            )
            self.admin_user.role = self.admin_role
            db.add(self.admin_user)
            await db.commit()

        async def override_get_db():
            async with self.SessionLocal() as session:
                try:
                    yield session
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise

        app.dependency_overrides[get_db] = override_get_db

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def test_admin_generate_controller_invite(self):
        """Admin generates code, receives plaintext code, DB stores only SHA-256 hash."""
        self.admin_user.role = self.admin_role

        async def override_admin():
            self.admin_user.role = self.admin_role
            return self.admin_user

        app.dependency_overrides[get_current_user] = override_admin

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            res = await client.post(
                "/api/v1/admin/controller-invites",
                json={
                    "department": "CSE",
                    "validity_days": 7,
                    "max_uses": 1,
                    "role": "Controller",
                },
            )
            self.assertEqual(res.status_code, 200)
            data = res.json()["data"]
            self.assertTrue(data["code"].startswith("KNT-"))
            self.assertEqual(data["department"], "CSE")
            self.assertEqual(data["max_uses"], 1)
            self.assertEqual(data["status"], "ACTIVE")

            # Check DB record stores hash, NOT plaintext code
            async with self.SessionLocal() as db:
                result = await db.execute(select(ControllerInvite))
                invite = result.scalars().first()
                self.assertIsNotNone(invite)
                self.assertEqual(invite.code_hash, hash_activation_code(data["code"]))
                self.assertNotEqual(invite.code_hash, data["code"])
                self.assertEqual(invite.department, "CSE")

            # Test listing invites
            list_res = await client.get("/api/v1/admin/controller-invites")
            self.assertEqual(list_res.status_code, 200)
            invites_list = list_res.json()["data"]
            self.assertEqual(len(invites_list), 1)
            self.assertEqual(invites_list[0]["department"], "CSE")
            self.assertNotIn("code", invites_list[0])  # Plaintext code is never leaked

            # Test revoking invite
            revoke_res = await client.delete(
                f"/api/v1/admin/controller-invites/{invite.id}"
            )
            self.assertEqual(revoke_res.status_code, 200)
            self.assertEqual(revoke_res.json()["data"]["status"], "REVOKED")

    async def test_controller_registration_authoritative_department_and_single_use(self):
        """Registering with code binds department from invite authoritatively and sets status to USED."""
        # 1. Generate code via invite service
        async with self.SessionLocal() as db:
            from app.admin.services.controller_invite import ControllerInviteService
            from app.admin.schemas.controller_invite import ControllerInviteCreate

            service = ControllerInviteService(db)
            generated = await service.generate_invite(
                admin_id=1,
                payload=ControllerInviteCreate(
                    department="CSE", validity_days=7, max_uses=1
                ),
            )
            raw_code = generated["code"]
            await db.commit()

        # 2. Register controller with code, intentionally trying to claim "Mechanical"
        async with self.SessionLocal() as db:
            auth_service = AuthService(db)
            email = "cse_head@sbjit.edu.in"
            save_otp(email, "123456", "registration")

            reg_data = UserRegister(
                email=email,
                password="SecurePassword123!",
                role_id=2,
                otp="123456",
                management_role="Controller",
                department="Mechanical",  # Attempted override by client
                access_key=raw_code,
            )

            response = await auth_service.register_user(reg_data)
            await db.commit()
            self.assertIsNotNone(response.user)

            # Verify authoritative department is CSE (from invite), NOT Mechanical
            prof_res = await db.execute(
                select(Profile).filter(Profile.user_id == response.user.id)
            )
            profile = prof_res.scalars().first()
            self.assertEqual(profile.department, "CSE")

            # Verify invite is marked USED
            inv_res = await db.execute(
                select(ControllerInvite).filter(
                    ControllerInvite.code_hash == hash_activation_code(raw_code)
                )
            )
            invite = inv_res.scalars().first()
            self.assertEqual(invite.status, "USED")
            self.assertEqual(invite.used_count, 1)
            self.assertEqual(invite.used_by, response.user.id)

        # 3. Second registration attempt with the SAME code must fail
        async with self.SessionLocal() as db:
            auth_service = AuthService(db)
            second_email = "another_prof@sbjit.edu.in"
            save_otp(second_email, "654321", "registration")

            second_reg = UserRegister(
                email=second_email,
                password="AnotherPassword123!",
                role_id=2,
                otp="654321",
                management_role="Controller",
                department="CSE",
                access_key=raw_code,
            )

            with self.assertRaises(ValidationError) as ctx:
                await auth_service.register_user(second_reg)
            self.assertIn("already been used", str(ctx.exception.message))

    async def test_expired_and_revoked_codes_rejected(self):
        """Expired or revoked codes are rejected."""
        async with self.SessionLocal() as db:
            # Create expired invite
            expired_invite = ControllerInvite(
                code_hash=hash_activation_code("KNT-EXPIRED-CODE-1234"),
                department="IT",
                expires_at=datetime.utcnow() - timedelta(days=1),
                status="ACTIVE",
                max_uses=1,
                used_count=0,
            )
            # Create revoked invite
            revoked_invite = ControllerInvite(
                code_hash=hash_activation_code("KNT-REVOKED-CODE-1234"),
                department="ETC",
                expires_at=datetime.utcnow() + timedelta(days=7),
                status="REVOKED",
                max_uses=1,
                used_count=0,
            )
            db.add_all([expired_invite, revoked_invite])
            await db.commit()

            auth_service = AuthService(db)

            # Test Expired
            save_otp("it_prof@sbjit.edu.in", "111111", "registration")
            with self.assertRaises(ValidationError) as ctx:
                await auth_service.register_user(
                    UserRegister(
                        email="it_prof@sbjit.edu.in",
                        password="Password123!",
                        role_id=2,
                        otp="111111",
                        management_role="Controller",
                        access_key="KNT-EXPIRED-CODE-1234",
                    )
                )
            self.assertIn("expired", str(ctx.exception.message).lower())

            # Test Revoked
            save_otp("etc_prof@sbjit.edu.in", "222222", "registration")
            with self.assertRaises(ValidationError) as ctx:
                await auth_service.register_user(
                    UserRegister(
                        email="etc_prof@sbjit.edu.in",
                        password="Password123!",
                        role_id=2,
                        otp="222222",
                        management_role="Controller",
                        access_key="KNT-REVOKED-CODE-1234",
                    )
                )
            self.assertIn("revoked", str(ctx.exception.message).lower())
