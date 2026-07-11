from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.admin.models.audit import AuditLog


class AdminRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)
