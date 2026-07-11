from sqlalchemy.ext.asyncio import AsyncSession
from app.messaging.repository.message import MessageRepository
from app.messaging.schemas.message import MessageCreate
from app.messaging.models.message import Message


class MessageService:
    def __init__(self, db: AsyncSession):
        self.repository = MessageRepository(db)

    async def send_message(self, sender_id: int, msg_in: MessageCreate) -> Message:
        data = msg_in.dict()
        data["sender_id"] = sender_id
        return await self.repository.create(data)
