from typing import List, Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.clubs.models.club_member import ClubMember


class ClubMemberRepository(BaseRepository[ClubMember]):
    """Repository for ClubMember operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(ClubMember, db)

    async def get_with_user(self, member_id: int) -> Optional[ClubMember]:
        """Fetch ClubMember with user relationship eagerly loaded."""
        result = await self.db.execute(
            select(ClubMember)
            .options(selectinload(ClubMember.user))
            .filter(ClubMember.id == member_id)
        )
        return result.scalars().first()

    async def get_by_club_and_user(
        self, club_id: int, user_id: int
    ) -> Optional[ClubMember]:
        """Find membership of a user in a club."""
        result = await self.db.execute(
            select(ClubMember).filter(
                and_(ClubMember.club_id == club_id, ClubMember.user_id == user_id)
            )
        )
        return result.scalars().first()

    async def get_by_club(
        self, club_id: int, skip: int = 0, limit: int = 100
    ) -> List[ClubMember]:
        """List all members of a club, including user details."""
        result = await self.db.execute(
            select(ClubMember)
            .filter(ClubMember.club_id == club_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_club(self, club_id: int) -> int:
        """Count the number of members in a club."""
        result = await self.db.execute(
            select(func.count())
            .select_from(ClubMember)
            .filter(ClubMember.club_id == club_id)
        )
        return result.scalar_one()
