import unittest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.messaging.models.conversation import Conversation
from app.messaging.models.message import Message
from app.messaging.routers.conversation import (
    create_group_conversation,
    get_conversation_messages,
    get_my_conversations,
    mark_conversation_read,
)
from app.messaging.routers.message import (
    get_unread_count,
    send_message,
)
from app.messaging.schemas.conversation import ConversationCreate
from app.messaging.schemas.message import MessageCreate
from app.users.models.user import User


class TestMessagingRouters(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = User(id=1, email="test@example.com")
        self.db = MagicMock()
        self.db.commit = AsyncMock()

    @patch("app.messaging.routers.conversation.MessagingService")
    async def test_get_my_conversations(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        service_instance.get_user_conversations.return_value = []

        res = await get_my_conversations(
            skip=0, limit=20, current_user=self.user, db=self.db
        )
        self.assertEqual(res.message, "Conversations retrieved successfully")
        self.assertEqual(res.data, [])
        service_instance.get_user_conversations.assert_called_once_with(
            1, skip=0, limit=20
        )

    @patch("app.messaging.routers.conversation.MessagingService")
    async def test_create_group_conversation_router(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        now = datetime.utcnow()
        mock_conv = Conversation(
            id=5,
            is_group=True,
            name="Test Group",
            created_at=now,
            updated_at=now,
            participants=[],
        )
        service_instance.create_group_conversation.return_value = mock_conv
        service_instance.get_user_conversations.return_value = []

        payload = ConversationCreate(
            is_group=True, name="Test Group", participant_ids=[2, 3]
        )
        res = await create_group_conversation(
            payload=payload, current_user=self.user, db=self.db
        )
        self.assertEqual(res.message, "Group conversation created successfully")
        self.assertEqual(res.data.id, 5)

    @patch("app.messaging.routers.conversation.MessagingService")
    async def test_get_conversation_messages_router(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        service_instance.get_conversation_messages.return_value = []

        res = await get_conversation_messages(
            conversation_id=10, skip=0, limit=10, current_user=self.user, db=self.db
        )
        self.assertEqual(res.message, "Messages retrieved successfully")
        self.assertEqual(res.data, [])

    @patch("app.messaging.routers.conversation.MessagingService")
    async def test_mark_conversation_read_router(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        service_instance.mark_conversation_as_read.return_value = 4

        res = await mark_conversation_read(
            conversation_id=10, current_user=self.user, db=self.db
        )
        self.assertEqual(res.message, "Conversation marked as read")
        self.assertEqual(res.data["marked_read_count"], 4)

    @patch("app.messaging.routers.message.manager")
    @patch("app.messaging.routers.message.ConversationRepository")
    @patch("app.messaging.routers.message.MessageService")
    async def test_send_message_router(
        self, mock_service_class, mock_conv_repo_class, mock_ws_manager
    ):
        mock_ws_manager.broadcast_to_conversation = AsyncMock()
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        fake_msg = Message(
            id=1,
            conversation_id=10,
            sender_id=1,
            receiver_id=2,
            content="Hi",
            is_read=False,
        )
        service_instance.send_message.return_value = fake_msg

        conv_repo_instance = AsyncMock()
        mock_conv_repo_class.return_value = conv_repo_instance
        conv_repo_instance.get.return_value = None

        payload = MessageCreate(conversation_id=10, content="Hi")
        res = await send_message(payload=payload, current_user=self.user, db=self.db)
        self.assertEqual(res.message, "Message sent successfully")
        self.assertEqual(res.data.id, 1)

    @patch("app.messaging.routers.message.MessageService")
    async def test_get_unread_count_router(self, mock_service_class):
        service_instance = AsyncMock()
        mock_service_class.return_value = service_instance
        mock_summary = MagicMock()
        service_instance.get_unread_summary.return_value = mock_summary

        res = await get_unread_count(current_user=self.user, db=self.db)
        self.assertEqual(res.message, "Unread count retrieved successfully")
        self.assertEqual(res.data, mock_summary)


if __name__ == "__main__":
    unittest.main()
