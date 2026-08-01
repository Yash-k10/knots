from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.profiles.models.profile import Profile


class ProfileRepository(BaseRepository[Profile]):
    def __init__(self, db: AsyncSession):
        super().__init__(Profile, db)

    async def get_by_user_id(self, user_id: int) -> Profile | None:
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

    async def get_by_id(self, profile_id: int) -> Profile | None:
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

    async def list_profiles(
        self,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> list[Profile]:
        """Fetch paginated list of profiles with education and employment history loaded."""
        stmt = (
            select(self.model)
            .options(
                selectinload(self.model.education),
                selectinload(self.model.employment_history),
            )
            .offset(skip)
            .limit(limit)
        )
        if search:
            from sqlalchemy import or_

            search_pattern = f"%{search}%"
            stmt = stmt.filter(
                or_(
                    self.model.first_name.ilike(search_pattern),
                    self.model.last_name.ilike(search_pattern),
                    self.model.department.ilike(search_pattern),
                    self.model.bio.ilike(search_pattern),
                )
            )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
