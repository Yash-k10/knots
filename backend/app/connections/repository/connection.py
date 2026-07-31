from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connections.models.connection import Connection, ConnectionStatus
from app.core.repository import BaseRepository


class ConnectionRepository(BaseRepository[Connection]):
    def __init__(self, db: AsyncSession):
        super().__init__(Connection, db)

    async def get_user_connections(self, user_id: int) -> list[Connection]:
        stmt = select(self.model).where(
            and_(
                or_(
                    self.model.requester_id == user_id,
                    self.model.addressee_id == user_id,
                ),
                self.model.status == ConnectionStatus.ACCEPTED,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_pending_requests(self, user_id: int) -> list[Connection]:
        stmt = select(self.model).where(
            and_(
                self.model.addressee_id == user_id,
                self.model.status == ConnectionStatus.PENDING,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_connection_between_users(
        self, user1_id: int, user2_id: int
    ) -> Connection | None:
        stmt = select(self.model).where(
            or_(
                and_(
                    self.model.requester_id == user1_id,
                    self.model.addressee_id == user2_id,
                ),
                and_(
                    self.model.requester_id == user2_id,
                    self.model.addressee_id == user1_id,
                ),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_connected_user_ids(self, user_id: int) -> set[int]:
        conns = await self.get_user_connections(user_id)
        connected_ids = set()
        for conn in conns:
            if conn.requester_id == user_id:
                connected_ids.add(conn.addressee_id)
            else:
                connected_ids.add(conn.requester_id)
        return connected_ids

    async def get_sent_pending_requests(self, user_id: int) -> list[Connection]:
        stmt = select(self.model).where(
            and_(
                self.model.requester_id == user_id,
                self.model.status == ConnectionStatus.PENDING,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_accepted_connections(self) -> list[Connection]:
        stmt = select(self.model).where(self.model.status == ConnectionStatus.ACCEPTED)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
