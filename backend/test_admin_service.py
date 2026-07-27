import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import app.core.base  # noqa: F401
from app.admin.models.flagged_post import FlaggedPost
from app.admin.services.admin import AdminService
from app.core.exceptions import NotFoundError
from app.posts.models.post import Post
from app.users.models.user import User


class TestAdminService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.db = MagicMock()
        self.db.flush = AsyncMock()
        self.db.delete = AsyncMock()

    @patch("app.admin.services.admin.UserRepository")
    async def test_list_users(self, mock_user_repo_class):
        mock_user_repo = AsyncMock()
        mock_user_repo_class.return_value = mock_user_repo

        service = AdminService(self.db)

        mock_users = [
            User(id=1, email="test1@example.com"),
            User(id=2, email="test2@example.com"),
        ]
        mock_user_repo.get_multi.return_value = mock_users

        result = await service.list_users(skip=0, limit=10)

        self.assertEqual(result, mock_users)
        mock_user_repo.get_multi.assert_called_once_with(skip=0, limit=10)

    @patch("app.admin.services.admin.UserRepository")
    @patch("app.admin.services.admin.AdminRepository")
    async def test_ban_user_success(self, mock_admin_repo_class, mock_user_repo_class):
        mock_user_repo = AsyncMock()
        mock_user_repo_class.return_value = mock_user_repo
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)

        mock_user = User(id=1, email="test@example.com", is_active=True)
        mock_user_repo.get.return_value = mock_user
        mock_user_repo.update.return_value = mock_user

        result = await service.ban_user(user_id=1, actor_id=99, ip_address="127.0.0.1")

        self.assertEqual(result, mock_user)
        mock_user_repo.get.assert_called_once_with(1)
        mock_user_repo.update.assert_called_once_with(mock_user, {"is_active": False})
        mock_admin_repo.create.assert_called_once_with(
            {
                "actor_id": 99,
                "action": "ban_user",
                "target": "User ID: 1, Email: test@example.com",
                "ip_address": "127.0.0.1",
            }
        )

    @patch("app.admin.services.admin.UserRepository")
    async def test_ban_user_not_found(self, mock_user_repo_class):
        mock_user_repo = AsyncMock()
        mock_user_repo_class.return_value = mock_user_repo
        mock_user_repo.get.return_value = None

        service = AdminService(self.db)

        with self.assertRaises(NotFoundError):
            await service.ban_user(user_id=1, actor_id=99)

    @patch("app.admin.services.admin.UserRepository")
    @patch("app.admin.services.admin.AdminRepository")
    async def test_unban_user_success(
        self, mock_admin_repo_class, mock_user_repo_class
    ):
        mock_user_repo = AsyncMock()
        mock_user_repo_class.return_value = mock_user_repo
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)

        mock_user = User(id=1, email="test@example.com", is_active=False)
        mock_user_repo.get.return_value = mock_user
        mock_user_repo.update.return_value = mock_user

        result = await service.unban_user(
            user_id=1, actor_id=99, ip_address="127.0.0.1"
        )

        self.assertEqual(result, mock_user)
        mock_user_repo.get.assert_called_once_with(1)
        mock_user_repo.update.assert_called_once_with(mock_user, {"is_active": True})
        mock_admin_repo.create.assert_called_once_with(
            {
                "actor_id": 99,
                "action": "unban_user",
                "target": "User ID: 1, Email: test@example.com",
                "ip_address": "127.0.0.1",
            }
        )

    @patch("app.admin.services.admin.UserRepository")
    @patch("app.admin.services.admin.AdminRepository")
    async def test_delete_user_success(
        self, mock_admin_repo_class, mock_user_repo_class
    ):
        mock_user_repo = AsyncMock()
        mock_user_repo_class.return_value = mock_user_repo
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)

        mock_user = User(id=1, email="test@example.com")
        mock_user_repo.get.return_value = mock_user
        mock_user_repo.remove.return_value = mock_user

        result = await service.delete_user(
            user_id=1, actor_id=99, ip_address="127.0.0.1"
        )

        self.assertEqual(result, mock_user)
        mock_user_repo.get.assert_called_once_with(1)
        mock_user_repo.remove.assert_called_once_with(1)
        mock_admin_repo.create.assert_called_once_with(
            {
                "actor_id": 99,
                "action": "delete_user",
                "target": "User ID: 1, Email: test@example.com",
                "ip_address": "127.0.0.1",
            }
        )

    @patch("app.admin.services.admin.FlaggedPostRepository")
    @patch("app.admin.services.admin.PostRepository")
    @patch("app.admin.services.admin.AdminRepository")
    async def test_flag_post_success(
        self, mock_admin_repo_class, mock_post_repo_class, mock_flagged_repo_class
    ):
        mock_post_repo = AsyncMock()
        mock_post_repo_class.return_value = mock_post_repo
        mock_flagged_repo = AsyncMock()
        mock_flagged_repo_class.return_value = mock_flagged_repo
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)

        mock_post = Post(id=10, author_id=5, content="Test content")
        mock_post_repo.get.return_value = mock_post

        mock_flagged = FlaggedPost(
            id=1, post_id=10, flagger_id=2, reason="spam", status="pending"
        )
        mock_flagged_repo.create.return_value = mock_flagged

        result = await service.flag_post(post_id=10, flagger_id=2, reason="spam")

        self.assertEqual(result, mock_flagged)
        mock_post_repo.get.assert_called_once_with(10)
        mock_flagged_repo.create.assert_called_once_with(
            {
                "post_id": 10,
                "flagger_id": 2,
                "reason": "spam",
                "status": "pending",
            }
        )
        mock_admin_repo.create.assert_called_once_with(
            {
                "actor_id": 2,
                "action": "flag_post",
                "target": "Post ID: 10, Reason: spam",
            }
        )

    @patch("app.admin.services.admin.PostRepository")
    async def test_flag_post_not_found(self, mock_post_repo_class):
        mock_post_repo = AsyncMock()
        mock_post_repo_class.return_value = mock_post_repo
        mock_post_repo.get.return_value = None

        service = AdminService(self.db)

        with self.assertRaises(NotFoundError):
            await service.flag_post(post_id=999, flagger_id=2)

    @patch("app.admin.services.admin.FlaggedPostRepository")
    async def test_list_flagged_posts(self, mock_flagged_repo_class):
        mock_flagged_repo = AsyncMock()
        mock_flagged_repo_class.return_value = mock_flagged_repo

        service = AdminService(self.db)

        mock_flags = [FlaggedPost(id=1), FlaggedPost(id=2)]
        mock_flagged_repo.get_flagged_posts_with_details.return_value = mock_flags

        result = await service.list_flagged_posts(skip=0, limit=10)

        self.assertEqual(result, mock_flags)
        mock_flagged_repo.get_flagged_posts_with_details.assert_called_once_with(
            skip=0, limit=10
        )

    @patch("app.admin.services.admin.FlaggedPostRepository")
    @patch("app.admin.services.admin.AdminRepository")
    async def test_resolve_flag_success(
        self, mock_admin_repo_class, mock_flagged_repo_class
    ):
        mock_flagged_repo = AsyncMock()
        mock_flagged_repo_class.return_value = mock_flagged_repo
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)

        mock_flag = FlaggedPost(id=1, post_id=10, status="pending")
        mock_flagged_repo.get.return_value = mock_flag
        mock_flagged_repo.update.return_value = mock_flag

        result = await service.resolve_flag(flag_id=1, action="resolved", actor_id=99)

        self.assertEqual(result, mock_flag)
        mock_flagged_repo.get.assert_called_once_with(1)
        mock_flagged_repo.update.assert_called_once_with(
            mock_flag, {"status": "resolved"}
        )
        mock_admin_repo.create.assert_called_once_with(
            {
                "actor_id": 99,
                "action": "resolve_flag_resolved",
                "target": "Flag ID: 1, Post ID: 10",
            }
        )

    async def test_resolve_flag_invalid_action(self):
        service = AdminService(self.db)
        with self.assertRaises(ValueError):
            await service.resolve_flag(flag_id=1, action="invalid_action", actor_id=99)

    @patch("app.admin.services.admin.FlaggedPostRepository")
    async def test_resolve_flag_not_found(self, mock_flagged_repo_class):
        mock_flagged_repo = AsyncMock()
        mock_flagged_repo_class.return_value = mock_flagged_repo
        mock_flagged_repo.get.return_value = None

        service = AdminService(self.db)

        with self.assertRaises(NotFoundError):
            await service.resolve_flag(flag_id=999, action="dismissed", actor_id=99)

    @patch("app.admin.services.admin.PostRepository")
    @patch("app.admin.services.admin.AdminRepository")
    async def test_remove_post_success(
        self, mock_admin_repo_class, mock_post_repo_class
    ):
        mock_post_repo = AsyncMock()
        mock_post_repo_class.return_value = mock_post_repo
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)

        mock_post = Post(id=10, author_id=5)
        mock_post_repo.get.return_value = mock_post
        mock_post_repo.remove.return_value = mock_post

        await service.remove_post(post_id=10, actor_id=99, ip_address="127.0.0.1")

        mock_post_repo.get.assert_called_once_with(10)
        mock_post_repo.remove.assert_called_once_with(10)
        mock_admin_repo.create.assert_called_once_with(
            {
                "actor_id": 99,
                "action": "remove_post",
                "target": "Post ID: 10, Author ID: 5",
                "ip_address": "127.0.0.1",
            }
        )

    @patch("app.admin.services.admin.PostRepository")
    async def test_remove_post_not_found(self, mock_post_repo_class):
        mock_post_repo = AsyncMock()
        mock_post_repo_class.return_value = mock_post_repo
        mock_post_repo.get.return_value = None

        service = AdminService(self.db)

        with self.assertRaises(NotFoundError):
            await service.remove_post(post_id=999, actor_id=99)

    @patch("app.admin.services.admin.AdminRepository")
    async def test_get_dashboard_stats_success(self, mock_admin_repo_class):
        mock_admin_repo = AsyncMock()
        mock_admin_repo_class.return_value = mock_admin_repo

        service = AdminService(self.db)
        expected_stats = {
            "total_users": 10,
            "total_posts": 25,
            "active_users": 8,
            "daily_activity": {
                "posts_today": 3,
                "users_today": 1,
                "actions_today": 5,
            },
        }
        mock_admin_repo.get_dashboard_stats.return_value = expected_stats

        result = await service.get_dashboard_stats()

        self.assertEqual(result, expected_stats)
        mock_admin_repo.get_dashboard_stats.assert_called_once()


if __name__ == "__main__":
    unittest.main()
