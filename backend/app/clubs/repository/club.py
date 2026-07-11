from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.clubs.models.club import Club


class ClubRepository(BaseRepository[Club]):
    def __init__(self, db: AsyncSession):
        super().__init__(Club, db)
