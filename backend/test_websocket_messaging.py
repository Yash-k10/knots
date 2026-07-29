import unittest
from unittest.mock import AsyncMock, patch

import app.core.base  # noqa: F401
from app.messaging.routers.websocket import authenticate_websocket
from app.messaging.websocket_manager import ConnectionManager


class TestWebSocketConnectionManager(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.manager = ConnectionManager()
        self.mock_socket1 = AsyncMock()
        self.mock_socket2 = AsyncMock()

    async def test_connect_and_disconnect(self):
        user_id = 101
        await self.manager.connect(self.mock_socket1, user_id)

        self.assertTrue(self.manager.is_user_online(user_id))
        self.assertIn(user_id, self.manager.get_online_users())
        self.assertEqual(len(self.manager.active_connections[user_id]), 1)

        # Connect a second socket for the same user
        await self.manager.connect(self.mock_socket2, user_id)
        self.assertEqual(len(self.manager.active_connections[user_id]), 2)

        # Disconnect first socket
        self.manager.disconnect(self.mock_socket1, user_id)
        self.assertEqual(len(self.manager.active_connections[user_id]), 1)
        self.assertTrue(self.manager.is_user_online(user_id))

        # Disconnect second socket
        self.manager.disconnect(self.mock_socket2, user_id)
        self.assertFalse(self.manager.is_user_online(user_id))
        self.assertNotIn(user_id, self.manager.get_online_users())

    async def test_send_personal_message(self):
        user_id = 202
        await self.manager.connect(self.mock_socket1, user_id)

        msg_payload = {"type": "new_message", "content": "Hello!"}
        await self.manager.send_personal_message(msg_payload, user_id)

        self.mock_socket1.send_json.assert_called_once_with(msg_payload)

    async def test_broadcast_to_conversation(self):
        user1 = 301
        user2 = 302
        user3 = 303

        await self.manager.connect(self.mock_socket1, user1)
        await self.manager.connect(self.mock_socket2, user2)

        msg_payload = {
            "type": "user_typing",
            "conversation_id": 5,
            "user_id": user1,
            "is_typing": True,
        }

        # Broadcast excluding sender user1
        await self.manager.broadcast_to_conversation(
            msg_payload, participant_ids=[user1, user2, user3], exclude_user_id=user1
        )

        self.mock_socket1.send_json.assert_not_called()
        self.mock_socket2.send_json.assert_called_once_with(msg_payload)


class TestWebSocketAuthentication(unittest.IsolatedAsyncioTestCase):
    @patch("app.messaging.routers.websocket.security.decode_token")
    async def test_authenticate_websocket_success(self, mock_decode_token):
        mock_socket = AsyncMock()
        mock_socket.query_params = {"token": "valid_jwt_token"}
        mock_decode_token.return_value = {"sub": "505", "type": "access"}

        user_id = await authenticate_websocket(mock_socket, token=None)
        self.assertEqual(user_id, 505)

    async def test_authenticate_websocket_missing_token(self):
        mock_socket = AsyncMock()
        mock_socket.query_params = {}

        user_id = await authenticate_websocket(mock_socket, token=None)
        self.assertIsNone(user_id)
        mock_socket.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
