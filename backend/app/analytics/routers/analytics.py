from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.schemas.analytics import SystemStats
from app.analytics.services.analytics import AnalyticsService
from app.core.database import get_db
from app.core.response_models import APIResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/stats", response_model=APIResponse[SystemStats])
async def read_system_stats(db: AsyncSession = Depends(get_db)):
    """Retrieve system analytics metrics (user count, active jobs, etc.)."""
    service = AnalyticsService(db)
    stats = await service.get_system_stats()
    return APIResponse(data=stats)
