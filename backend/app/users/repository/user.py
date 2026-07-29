from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.users.models.user import User


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get(self, id: int) -> User | None:
        """Fetch user by ID with role relationship loaded."""
        stmt = (
            select(self.model)
            .filter(self.model.id == id)
            .options(selectinload(self.model.role))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_multi(self, skip: int = 0, limit: int = 100) -> list[User]:
        """Fetch multiple users with role relationship loaded."""
        stmt = (
            select(self.model)
            .offset(skip)
            .limit(limit)
            .options(selectinload(self.model.role))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
