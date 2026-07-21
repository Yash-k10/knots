import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import app.core.base  # noqa: F401
from app.messaging.services.message import MessagingService
from app.messaging.schemas.message import MessageCreate, DirectMessageCreate
from app.messaging.models.message import Message
from app.messaging.models.conversation import Conversation
from app.core.exceptions import NotFoundError, AuthorizationError, ValidationError


class TestMessagingService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.db = MagicMock()
        self.db.flush = AsyncMock()
        self.db.add = MagicMock()
        self.db.add_all = MagicMock()
        self.db.get = AsyncMock()

    @patch("app.messaging.services.message.MessageRepository")
    @patch("app.messaging.services.message.ConversationRepository")
    async def test_send_direct_message_creates_conversation(
        self, mock_conv_repo_class, mock_msg_repo_class
    ):
        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo
        mock_msg_repo = AsyncMock()
        mock_msg_repo_class.return_value = mock_msg_repo

        service = MessagingService(self.db)

        fake_conv = Conversation(id=10, is_group=False)
        mock_conv_repo.get_or_create_direct_conversation.return_value = fake_conv

        fake_msg = Message(
            id=1, sender_id=100, receiver_id=200, content="Hello", conversation_id=10
        )
        mock_msg_repo.create_message.return_value = fake_msg

        payload = DirectMessageCreate(receiver_id=200, content="Hello")
        result = await service.send_direct_message(sender_id=100, payload=payload)

        self.assertEqual(result, fake_msg)
        mock_conv_repo.get_or_create_direct_conversation.assert_called_once_with(
            100, 200
        )
        mock_msg_repo.create_message.assert_called_once_with(
            sender_id=100,
            content="Hello",
            conversation_id=10,
            receiver_id=200,
        )

    @patch("app.messaging.services.message.MessageRepository")
    @patch("app.messaging.services.message.ConversationRepository")
    async def test_send_message_validation_error_self(
        self, mock_conv_repo_class, mock_msg_repo_class
    ):
        service = MessagingService(self.db)
        payload = MessageCreate(receiver_id=100, content="Hello")

        with self.assertRaises(ValidationError):
            await service.send_message(sender_id=100, msg_in=payload)

    @patch("app.messaging.services.message.MessageRepository")
    @patch("app.messaging.services.message.ConversationRepository")
    async def test_send_message_not_participant(
        self, mock_conv_repo_class, mock_msg_repo_class
    ):
        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo
        mock_conv_repo.is_participant.return_value = False

        service = MessagingService(self.db)
        payload = MessageCreate(conversation_id=5, content="Hello group")

        with self.assertRaises(AuthorizationError):
            await service.send_message(sender_id=100, msg_in=payload)

    @patch("app.messaging.services.message.MessageRepository")
    @patch("app.messaging.services.message.ConversationRepository")
    async def test_get_conversation_messages_not_found(
        self, mock_conv_repo_class, mock_msg_repo_class
    ):
        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo
        mock_conv_repo.get.return_value = None

        service = MessagingService(self.db)

        with self.assertRaises(NotFoundError):
            await service.get_conversation_messages(user_id=100, conversation_id=999)

    @patch("app.messaging.services.message.MessageRepository")
    @patch("app.messaging.services.message.ConversationRepository")
    async def test_get_conversation_messages_authorization_error(
        self, mock_conv_repo_class, mock_msg_repo_class
    ):
        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo
        mock_conv = Conversation(id=5)
        mock_conv_repo.get.return_value = mock_conv
        mock_conv_repo.is_participant.return_value = False

        service = MessagingService(self.db)

        with self.assertRaises(AuthorizationError):
            await service.get_conversation_messages(user_id=100, conversation_id=5)

    @patch("app.messaging.services.message.MessageRepository")
    @patch("app.messaging.services.message.ConversationRepository")
    async def test_mark_conversation_as_read_success(
        self, mock_conv_repo_class, mock_msg_repo_class
    ):
        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo
        mock_msg_repo = AsyncMock()
        mock_msg_repo_class.return_value = mock_msg_repo

        mock_conv = Conversation(id=5)
        mock_conv_repo.get.return_value = mock_conv
        mock_conv_repo.is_participant.return_value = True
        mock_msg_repo.mark_messages_as_read.return_value = 3

        service = MessagingService(self.db)

        result = await service.mark_conversation_as_read(user_id=100, conversation_id=5)
        self.assertEqual(result, 3)
        mock_msg_repo.mark_messages_as_read.assert_called_once_with(5, 100)


if __name__ == "__main__":
    unittest.main()
