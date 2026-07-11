from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies.auth import RoleRequired
from app.admin.schemas.admin import AuditLogResponse
from app.admin.services.admin import AdminService
from app.core.database import get_db
from app.core.response_models import APIResponse

# Protect all routes under this admin router
router = APIRouter(
    prefix="/admin",
    tags=["Admin Only"],
    dependencies=[Depends(RoleRequired(["Admin"]))]
)


@router.get("/audit-logs", response_model=APIResponse[List[AuditLogResponse]])
async def read_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve system audit logs for administrative audit tracking."""
    service = AdminService(db)
    logs = await service.get_audit_logs(skip=skip, limit=limit)
    return APIResponse(data=logs)
