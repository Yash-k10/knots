from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.profiles.models.employment_history import EmploymentHistory


class EmploymentHistoryRepository(BaseRepository[EmploymentHistory]):
    def __init__(self, db: AsyncSession):
        super().__init__(EmploymentHistory, db)
