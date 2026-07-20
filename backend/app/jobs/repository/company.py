from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.jobs.models.company import Company


class CompanyRepository(BaseRepository[Company]):
    def __init__(self, db: AsyncSession):
        super().__init__(Company, db)

    async def get_by_name(self, name: str) -> Optional[Company]:
        result = await self.db.execute(select(Company).filter(Company.name == name))
        return result.scalars().first()

    async def search_companies(self, query: str, limit: int = 20) -> List[Company]:
        result = await self.db.execute(
            select(Company).filter(Company.name.ilike(f"%{query}%")).limit(limit)
        )
        return list(result.scalars().all())
