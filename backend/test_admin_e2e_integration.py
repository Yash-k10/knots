import unittest

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.admin.models import FlaggedPost
from app.auth.dependencies.auth import get_current_user
from app.core.database import Base, get_db
from app.main import app
from app.posts.models.post import Post
from app.users.models.role import Role
from app.users.models.user import User


class TestAdminE2EIntegration(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Create SQLite in-memory engine
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

            # Seed Admin user
            self.admin_user = User(
                id=1,
                email="admin@knots.edu",
                hashed_password="hashed_pw",
                role_id=1,
                is_active=True,
            )
            self.admin_user.role = self.admin_role

            # Seed Target user 1 (to be banned/unbanned)
            self.target_user_1 = User(
                id=2,
                email="student1@knots.edu",
                hashed_password="hashed_pw",
                role_id=2,
                is_active=True,
            )

            # Seed Target user 2 (to be deleted)
            self.target_user_2 = User(
                id=3,
                email="student2@knots.edu",
                hashed_password="hashed_pw",
                role_id=2,
                is_active=True,
            )

            db.add_all([self.admin_user, self.target_user_1, self.target_user_2])
            await db.commit()

            # Seed a post
            self.post = Post(
                id=10, author_id=2, content="Test post content for moderation"
            )
            db.add(self.post)
            await db.commit()

            # Seed a flagged post
            self.flagged_post = FlaggedPost(
                id=1,
                post_id=10,
                flagger_id=3,
                reason="Inappropriate content",
                status="pending",
            )
            db.add(self.flagged_post)
            await db.commit()

        async def override_get_db():
            async with self.SessionLocal() as session:
                yield session
                await session.commit()

        async def override_get_current_user():
            return self.admin_user

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_current_user

    async def asyncTearDown(self):
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def test_admin_dashboard_stats_e2e(self):
        """Test retrieving dashboard statistics for admin."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/v1/admin/dashboard/stats")
            self.assertEqual(res.status_code, 200)
            data = res.json()["data"]
            self.assertIn("total_users", data)
            self.assertIn("total_posts", data)
            self.assertIn("active_users", data)
            self.assertIn("daily_activity", data)

    async def test_admin_user_management_e2e(self):
        """Test listing users, banning user, unbanning user, and deleting user."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. List users
            res_list = await ac.get("/api/v1/admin/users")
            self.assertEqual(res_list.status_code, 200)
            users_data = res_list.json()["data"]
            self.assertGreaterEqual(len(users_data), 3)

            # 2. Ban user 2
            res_ban = await ac.post("/api/v1/admin/users/2/ban")
            self.assertEqual(res_ban.status_code, 200)
            self.assertFalse(res_ban.json()["data"]["is_active"])

            # 3. Unban user 2
            res_unban = await ac.post("/api/v1/admin/users/2/unban")
            self.assertEqual(res_unban.status_code, 200)
            self.assertTrue(res_unban.json()["data"]["is_active"])

            # 4. Delete user 3
            res_del = await ac.delete("/api/v1/admin/users/3")
            self.assertEqual(res_del.status_code, 200)

            # Verify audit logs created
            res_logs = await ac.get("/api/v1/admin/audit-logs")
            self.assertEqual(res_logs.status_code, 200)
            logs = res_logs.json()["data"]
            self.assertGreaterEqual(len(logs), 3)
            actions = [log["action"] for log in logs]
            self.assertIn("ban_user", actions)
            self.assertIn("unban_user", actions)
            self.assertIn("delete_user", actions)

    async def test_admin_content_moderation_e2e(self):
        """Test listing flagged posts, resolving flag, and removing post as admin."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. List flagged posts
            res_flagged = await ac.get("/api/v1/admin/posts/flagged")
            self.assertEqual(res_flagged.status_code, 200)
            flagged = res_flagged.json()["data"]
            self.assertEqual(len(flagged), 1)
            self.assertEqual(flagged[0]["reason"], "Inappropriate content")

            # 2. Resolve flagged post
            res_resolve = await ac.post(
                "/api/v1/admin/posts/1/resolve", json={"action": "resolved"}
            )
            self.assertEqual(res_resolve.status_code, 200)
            self.assertEqual(res_resolve.json()["data"]["status"], "resolved")

            # 3. Delete post as admin
            res_del_post = await ac.delete("/api/v1/admin/posts/10")
            self.assertEqual(res_del_post.status_code, 200)

            # Verify audit log recorded for remove_post
            res_logs = await ac.get("/api/v1/admin/audit-logs")
            logs = res_logs.json()["data"]
            actions = [log["action"] for log in logs]
            self.assertIn("remove_post", actions)


if __name__ == "__main__":
    unittest.main()
