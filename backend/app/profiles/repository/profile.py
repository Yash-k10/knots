from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.repository import BaseRepository
from app.profiles.models.profile import Profile


class ProfileRepository(BaseRepository[Profile]):
    def __init__(self, db: AsyncSession):
        super().__init__(Profile, db)

    async def get_by_user_id(self, user_id: int) -> Optional[Profile]:
        """Fetch profile by user_id with education and employment history loaded."""
        stmt = (
            select(self.model)
            .filter(self.model.user_id == user_id)
            .options(
                selectinload(self.model.education),
                selectinload(self.model.employment_history),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, profile_id: int) -> Optional[Profile]:
        """Fetch profile by ID with education and employment history loaded."""
        stmt = (
            select(self.model)
            .filter(self.model.id == profile_id)
            .options(
                selectinload(self.model.education),
                selectinload(self.model.employment_history),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()
