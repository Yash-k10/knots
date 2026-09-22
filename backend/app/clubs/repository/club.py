from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.clubs.models.club import Club
from app.clubs.models.club_member import ClubMember
from app.core.repository import BaseRepository

from app.users.models.user import User


class ClubRepository(BaseRepository[Club]):
    """Repository for Club CRUD and listing queries."""

    def __init__(self, db: AsyncSession):
        super().__init__(Club, db)

    async def get_by_name(self, name: str) -> Club | None:
        """Fetch club by its name."""
        result = await self.db.execute(select(Club).filter(Club.name == name))
        return result.scalars().first()

    async def get_with_details(self, club_id: int) -> Club | None:
        """Fetch a single club with all its members and user profiles loaded."""
        result = await self.db.execute(
            select(Club)
            .options(
                selectinload(Club.head).selectinload(User.profile),
                selectinload(Club.head).selectinload(User.role),
                selectinload(Club.co_head).selectinload(User.profile),
                selectinload(Club.co_head).selectinload(User.role),
                selectinload(Club.faculty_coordinator).selectinload(User.profile),
                selectinload(Club.faculty_coordinator).selectinload(User.role),
                selectinload(Club.alumni_mentor).selectinload(User.profile),
                selectinload(Club.alumni_mentor).selectinload(User.role),
                selectinload(Club.members)
                .selectinload(ClubMember.user)
                .selectinload(User.profile),
                selectinload(Club.members)
                .selectinload(ClubMember.user)
                .selectinload(User.role),
            )
            .filter(Club.id == club_id)
        )
        return result.scalars().first()

    async def get_clubs_filtered(
        self,
        category: str | None = None,
        search: str | None = None,
        faculty_coordinator_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Club]:
        """Fetch clubs matching optional category or search text."""
        query = select(Club).options(
            selectinload(Club.creator).selectinload(User.profile),
            selectinload(Club.creator).selectinload(User.role),
            selectinload(Club.head).selectinload(User.profile),
            selectinload(Club.head).selectinload(User.role),
            selectinload(Club.co_head).selectinload(User.profile),
            selectinload(Club.co_head).selectinload(User.role),
            selectinload(Club.faculty_coordinator).selectinload(User.profile),
            selectinload(Club.faculty_coordinator).selectinload(User.role),
            selectinload(Club.alumni_mentor).selectinload(User.profile),
            selectinload(Club.alumni_mentor).selectinload(User.role),
        )
        if category:
            query = query.filter(Club.category == category)
        if search:
            query = query.filter(
                (Club.name.ilike(f"%{search}%"))
                | (Club.description.ilike(f"%{search}%"))
            )
        if faculty_coordinator_id is not None:
            query = query.filter(Club.faculty_coordinator_id == faculty_coordinator_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_filtered(
        self,
        category: str | None = None,
        search: str | None = None,
        faculty_coordinator_id: int | None = None,
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
        if faculty_coordinator_id is not None:
            query = query.filter(Club.faculty_coordinator_id == faculty_coordinator_id)
        result = await self.db.execute(query)
        return result.scalar_one()
