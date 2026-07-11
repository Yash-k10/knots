from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.ai.models.ai_log import AILog


class AIRepository(BaseRepository[AILog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AILog, db)
