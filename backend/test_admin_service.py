import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import app.core.base  # noqa: F401
from app.admin.services.admin import AdminService
from app.core.exceptions import NotFoundError
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


if __name__ == "__main__":
    unittest.main()
