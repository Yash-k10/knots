from sqlalchemy.ext.asyncio import AsyncSession
from app.clubs.repository.club import ClubRepository
from app.clubs.schemas.club import ClubCreate
from app.clubs.models.club import Club


class ClubService:
    def __init__(self, db: AsyncSession):
        self.repository = ClubRepository(db)

    async def create_club(self, creator_id: int, club_in: ClubCreate) -> Club:
        data = club_in.dict()
        data["creator_id"] = creator_id
        return await self.repository.create(data)

    async def list_clubs(self, skip: int = 0, limit: int = 100) -> list[Club]:
        return await self.repository.get_multi(skip=skip, limit=limit)
