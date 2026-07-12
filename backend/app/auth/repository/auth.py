from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.users.models.user import User


class AuthRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email with role relationship loaded."""
        stmt = (
            select(self.model)
            .filter(self.model.email == email)
            .options(selectinload(self.model.role))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()
