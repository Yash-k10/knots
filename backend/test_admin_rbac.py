import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.dependencies.auth import get_current_user
from app.core.database import Base, get_db
from app.main import app
from app.users.models.role import Role
from app.users.models.user import User


class TestAdminRoleBasedAccessControl(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create an in-memory SQLite engine
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        self.SessionLocal = async_sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )

        async with self.SessionLocal() as db:
            # Seed roles
            self.admin_role = Role(id=1, name="Admin")
            self.student_role = Role(id=2, name="Student")
            db.add_all([self.admin_role, self.student_role])
            await db.commit()

            # Seed Admin User
            self.admin_user = User(
                id=1,
                email="admin@knots.edu",
                hashed_password="hashed_pw",
                role_id=1,
                is_active=True,
            )
            # Seed Student User
            self.student_user = User(
                id=2,
                email="student@knots.edu",
                hashed_password="hashed_pw",
                role_id=2,
                is_active=True,
            )
            db.add_all([self.admin_user, self.student_user])
            await db.commit()

        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def test_non_admin_forbidden_on_admin_routes(self):
        """Verify non-admin users receive 403 Forbidden on all admin routes."""
        # Attach student_role to student_user object
        self.student_user.role = self.student_role

        async def override_current_user_as_student():
            return self.student_user

        app.dependency_overrides[get_current_user] = override_current_user_as_student

        endpoints_to_test = [
            ("GET", "/api/v1/admin/stats"),
            ("GET", "/api/v1/admin/dashboard/stats"),
            ("GET", "/api/v1/admin/users"),
            ("GET", "/api/v1/admin/audit-logs"),
            ("GET", "/api/v1/admin/posts/flagged"),
            ("POST", "/api/v1/admin/users/1/ban"),
            ("POST", "/api/v1/admin/users/1/unban"),
            ("DELETE", "/api/v1/admin/users/1"),
            ("DELETE", "/api/v1/admin/posts/1"),
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            for method, endpoint in endpoints_to_test:
                with self.subTest(endpoint=endpoint, method=method):
                    if method == "GET":
                        res = await ac.get(endpoint)
                    elif method == "POST":
                        res = await ac.post(endpoint)
                    elif method == "DELETE":
                        res = await ac.delete(endpoint)

                    self.assertEqual(
                        res.status_code,
                        403,
                        f"Expected 403 Forbidden for non-admin on {method} {endpoint}, got {res.status_code}",
                    )

    async def test_admin_allowed_on_admin_routes(self):
        """Verify admin users are allowed to access admin routes (returning 200 status)."""
        self.admin_user.role = self.admin_role

        async def override_current_user_as_admin():
            return self.admin_user

        app.dependency_overrides[get_current_user] = override_current_user_as_admin

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res_stats = await ac.get("/api/v1/admin/stats")
            self.assertEqual(res_stats.status_code, 200)

            res_users = await ac.get("/api/v1/admin/users")
            self.assertEqual(res_users.status_code, 200)


if __name__ == "__main__":
    unittest.main()
