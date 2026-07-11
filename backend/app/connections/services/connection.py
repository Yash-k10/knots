from sqlalchemy.ext.asyncio import AsyncSession
from app.connections.repository.connection import ConnectionRepository
from app.connections.models.connection import Connection


class ConnectionService:
    def __init__(self, db: AsyncSession):
        self.repository = ConnectionRepository(db)

    async def request_connection(self, requester_id: int, addressee_id: int) -> Connection:
        return await self.repository.create({
            "requester_id": requester_id,
            "addressee_id": addressee_id,
            "status": "PENDING"
        })

    async def update_status(self, connection_id: int, status: str) -> Connection:
        conn = await self.repository.get(connection_id)
        if conn:
            return await self.repository.update(conn, {"status": status})
        return None
