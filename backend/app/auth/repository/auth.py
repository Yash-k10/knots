from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repository import BaseRepository
from app.users.models.user import User


class AuthRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get(self, id: int) -> User | None:
        """Fetch user by ID with role and profile relationships loaded in a single JOIN."""
        stmt = (
            select(self.model)
            .filter(self.model.id == id)
            .options(
                joinedload(self.model.role),
                joinedload(self.model.profile),
            )
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().first()

    async def get_by_email(self, email: str) -> User | None:
        """Fetch user by email (case-insensitive) with role and profile relationships loaded in a single JOIN."""
        stmt = (
            select(self.model)
            .filter(func.lower(self.model.email) == email.strip().lower())
            .options(
                joinedload(self.model.role),
                joinedload(self.model.profile),
            )
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().first()
