from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.profiles.models.education import Education


class EducationRepository(BaseRepository[Education]):
    def __init__(self, db: AsyncSession):
        super().__init__(Education, db)
