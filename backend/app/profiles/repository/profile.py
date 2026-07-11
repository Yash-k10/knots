from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.profiles.models.profile import Profile


class ProfileRepository(BaseRepository[Profile]):
    def __init__(self, db: AsyncSession):
        super().__init__(Profile, db)
