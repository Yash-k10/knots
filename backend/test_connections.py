import unittest
from unittest.mock import AsyncMock

import app.main  # noqa: F401
from app.connections.models.connection import Connection, ConnectionStatus
from app.connections.services.connection import ConnectionService


class TestConnectionService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.db = AsyncMock()
        self.service = ConnectionService(self.db)
        self.service.repository = AsyncMock()

    async def test_cannot_connect_with_self(self):
        with self.assertRaises(ValueError) as ctx:
            await self.service.request_connection(1, 1)
        self.assertIn("Cannot connect with yourself", str(ctx.exception))

    async def test_cannot_connect_if_already_exists(self):
        self.service.repository.get_connection_between_users.return_value = Connection(
            id=10, requester_id=1, addressee_id=2, status=ConnectionStatus.PENDING
        )
        with self.assertRaises(ValueError) as ctx:
            await self.service.request_connection(1, 2)
        self.assertIn("Connection or request already exists", str(ctx.exception))

    async def test_successful_request_connection(self):
        self.service.repository.get_connection_between_users.return_value = None
        mock_conn = Connection(
            id=11, requester_id=1, addressee_id=2, status=ConnectionStatus.PENDING
        )
        self.service.repository.create.return_value = mock_conn

        with unittest.mock.patch(
            "app.profiles.repository.profile.ProfileRepository.get_by_user_id",
            new_callable=AsyncMock,
        ) as mock_get_prof, unittest.mock.patch(
            "app.notifications.services.notification.NotificationService.create_notification",
            new_callable=AsyncMock,
        ):
            mock_get_prof.return_value = None
            res = await self.service.request_connection(1, 2)
            self.assertEqual(res.id, 11)
            self.assertEqual(res.status, ConnectionStatus.PENDING)

    async def test_accept_connection(self):
        mock_conn = Connection(
            id=15, requester_id=2, addressee_id=1, status=ConnectionStatus.PENDING
        )
        self.service.repository.get.return_value = mock_conn
        self.service.repository.update.return_value = Connection(
            id=15, requester_id=2, addressee_id=1, status=ConnectionStatus.ACCEPTED
        )

        res = await self.service.accept_connection(15, user_id=1)
        self.assertEqual(res.status, ConnectionStatus.ACCEPTED)

    async def test_withdraw_connection_request(self):
        mock_conn = Connection(
            id=20, requester_id=1, addressee_id=3, status=ConnectionStatus.PENDING
        )
        self.service.repository.get.return_value = mock_conn
        self.service.repository.delete.return_value = True

        res = await self.service.withdraw_connection_request(20, user_id=1)
        self.assertTrue(res)

    async def test_get_mutual_connections(self):
        self.service.repository.get_user_connected_user_ids.side_effect = [
            {2, 3, 4},  # user 1's connections
            {3, 4, 5},  # user 2's connections
        ]

        res = await self.service.get_mutual_connections(1, 2)
        self.assertEqual(res["target_user_id"], 2)
        self.assertEqual(res["mutual_count"], 2)
        self.assertEqual(res["mutual_user_ids"], [3, 4])


if __name__ == "__main__":
    unittest.main()
