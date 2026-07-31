from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.connections.models.connection import Connection, ConnectionStatus
from app.connections.repository.connection import ConnectionRepository
from app.users.models.user import User


class ConnectionService:
    def __init__(self, db: AsyncSession):
        self.repository = ConnectionRepository(db)
        self.db = db

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

        return await self.repository.create(
            {
                "requester_id": requester_id,
                "addressee_id": addressee_id,
                "status": ConnectionStatus.PENDING,
            }
        )

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

    async def withdraw_connection_request(
        self, connection_id: int, user_id: int
    ) -> bool:
        conn = await self.repository.get(connection_id)
        if not conn:
            raise ValueError("Connection not found")
        if conn.requester_id != user_id:
            raise ValueError("Not authorized to withdraw this connection request")
        if conn.status != ConnectionStatus.PENDING:
            raise ValueError("Can only withdraw pending requests")

        await self.repository.delete(connection_id)
        return True

    async def list_my_connections(self, user_id: int) -> list[Connection]:
        return await self.repository.get_user_connections(user_id)

    async def list_my_pending_requests(self, user_id: int) -> list[Connection]:
        return await self.repository.get_pending_requests(user_id)

    async def list_my_sent_requests(self, user_id: int) -> list[Connection]:
        return await self.repository.get_sent_pending_requests(user_id)

    async def get_mutual_connections(
        self, user1_id: int, user2_id: int
    ) -> dict[str, any]:
        user1_conns = await self.repository.get_user_connected_user_ids(user1_id)
        user2_conns = await self.repository.get_user_connected_user_ids(user2_id)
        mutual_ids = sorted(list(user1_conns.intersection(user2_conns)))

        return {
            "target_user_id": user2_id,
            "mutual_count": len(mutual_ids),
            "mutual_user_ids": mutual_ids,
        }

    async def get_connection_suggestions(
        self, user_id: int, limit: int = 10
    ) -> list[dict[str, any]]:
        my_connected_ids = await self.repository.get_user_connected_user_ids(user_id)

        # Get existing requests (sent or received)
        pending_incoming = await self.repository.get_pending_requests(user_id)
        pending_sent = await self.repository.get_sent_pending_requests(user_id)

        excluded_user_ids = {user_id}.union(my_connected_ids)
        for req in pending_incoming:
            excluded_user_ids.add(req.requester_id)
        for req in pending_sent:
            excluded_user_ids.add(req.addressee_id)

        # Fetch candidate users
        stmt = (
            select(User)
            .options(selectinload(User.profile))
            .where(User.id.not_in(excluded_user_ids))
            .limit(50)
        )
        result = await self.db.execute(stmt)
        candidates = result.scalars().all()

        suggestions = []
        for candidate in candidates:
            cand_id = candidate.id
            cand_conns = await self.repository.get_user_connected_user_ids(cand_id)
            mutual_ids = my_connected_ids.intersection(cand_conns)
            mutual_count = len(mutual_ids)

            score = 10 + (mutual_count * 25)
            reason = "Member of your network"
            if mutual_count > 0:
                reason = (
                    f"{mutual_count} mutual connection{'s' if mutual_count > 1 else ''}"
                )
            elif candidate.profile and candidate.profile.bio:
                reason = "Suggested based on active profile"

            suggestions.append(
                {
                    "user_id": cand_id,
                    "email": candidate.email,
                    "mutual_count": mutual_count,
                    "recommendation_reason": reason,
                    "score": score,
                }
            )

        suggestions.sort(key=lambda x: x["score"], reverse=True)
        return suggestions[:limit]
