from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.repository.admin import AdminRepository
from app.admin.models.audit import AuditLog


class AdminService:
    def __init__(self, db: AsyncSession):
        self.repository = AdminRepository(db)

    async def get_audit_logs(self, skip: int = 0, limit: int = 100) -> list[AuditLog]:
        return await self.repository.get_multi(skip=skip, limit=limit)
