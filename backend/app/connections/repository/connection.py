from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.connections.models.connection import Connection


class ConnectionRepository(BaseRepository[Connection]):
    def __init__(self, db: AsyncSession):
        super().__init__(Connection, db)
