from sqlalchemy.ext.asyncio import AsyncSession

from app.connections.models.connection import Connection, ConnectionStatus
from app.connections.repository.connection import ConnectionRepository


class ConnectionService:
    def __init__(self, db: AsyncSession):
        self.repository = ConnectionRepository(db)

    async def request_connection(
        self, requester_id: int, addressee_id: int
    ) -> Connection:
        if requester_id == addressee_id:
            raise ValueError("Cannot connect with yourself")

        existing = await self.repository.get_connection_between_users(
            requester_id, addressee_id
        )
        if existing:
            raise ValueError("Connection or request already exists")

        conn = await self.repository.create(
            {
                "requester_id": requester_id,
                "addressee_id": addressee_id,
                "status": ConnectionStatus.PENDING,
            }
        )

        from app.notifications.services.notification import NotificationService
        from app.profiles.repository.profile import ProfileRepository

        prof_repo = ProfileRepository(self.repository.db)
        req_prof = await prof_repo.get_by_user_id(requester_id)
        req_name = (
            f"{req_prof.first_name} {req_prof.last_name}"
            if (req_prof and req_prof.first_name)
            else "Someone"
        )
        notif_service = NotificationService(self.repository.db)
        await notif_service.create_notification(
            user_id=addressee_id,
            title="New Connection Request",
            content=f"{req_name} sent you a connection request.",
            type="connection_request",
        )

        return conn

    async def accept_connection(self, connection_id: int, user_id: int) -> Connection:
        conn = await self.repository.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        if conn.addressee_id != user_id:
            raise ValueError("Not authorized to accept this connection")
        if conn.status != ConnectionStatus.PENDING:
            raise ValueError("Connection is not in a pending state")

        return await self.repository.update(conn, {"status": ConnectionStatus.ACCEPTED})

    async def reject_connection(self, connection_id: int, user_id: int) -> Connection:
        conn = await self.repository.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        if conn.addressee_id != user_id:
            raise ValueError("Not authorized to reject this connection")
        if conn.status != ConnectionStatus.PENDING:
            raise ValueError("Connection is not in a pending state")

        return await self.repository.update(conn, {"status": ConnectionStatus.REJECTED})

    async def list_my_connections(self, user_id: int) -> list[Connection]:
        return await self.repository.get_user_connections(user_id)

    async def list_my_pending_requests(self, user_id: int) -> list[Connection]:
        return await self.repository.get_pending_requests(user_id)
