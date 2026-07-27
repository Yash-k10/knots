from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models.ai_log import AILog
from app.core.repository import BaseRepository


class AIRepository(BaseRepository[AILog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AILog, db)
