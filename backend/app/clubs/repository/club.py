from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.clubs.models.club import Club
from app.clubs.models.club_member import ClubMember
from app.core.repository import BaseRepository


class ClubRepository(BaseRepository[Club]):
    """Repository for Club CRUD and listing queries."""

    def __init__(self, db: AsyncSession):
        super().__init__(Club, db)

    async def get_by_name(self, name: str) -> Club | None:
        """Fetch club by its name."""
        result = await self.db.execute(select(Club).filter(Club.name == name))
        return result.scalars().first()

    async def get_with_details(self, club_id: int) -> Club | None:
        """Fetch a single club with all its members loaded."""
        result = await self.db.execute(
            select(Club)
            .options(selectinload(Club.members).selectinload(ClubMember.user))
            .filter(Club.id == club_id)
        )
        return result.scalars().first()

    async def get_clubs_filtered(
        self,
        category: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Club]:
        """Fetch clubs matching optional category or search text."""
        query = select(Club)
        if category:
            query = query.filter(Club.category == category)
        if search:
            query = query.filter(
                (Club.name.ilike(f"%{search}%"))
                | (Club.description.ilike(f"%{search}%"))
            )
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_filtered(
        self,
        category: str | None = None,
        search: str | None = None,
    ) -> int:
        """Count clubs matching optional category or search text."""
        query = select(func.count()).select_from(Club)
        if category:
            query = query.filter(Club.category == category)
        if search:
            query = query.filter(
                (Club.name.ilike(f"%{search}%"))
                | (Club.description.ilike(f"%{search}%"))
            )
        result = await self.db.execute(query)
        return result.scalar_one()
