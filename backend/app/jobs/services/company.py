from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.jobs.repository.company import CompanyRepository
from app.jobs.schemas.company import CompanyCreate, CompanyUpdate
from app.jobs.models.company import Company
from app.core.exceptions import ConflictError, NotFoundError


class CompanyService:
    def __init__(self, db: AsyncSession):
        self.repository = CompanyRepository(db)

    async def create_company(self, company_in: CompanyCreate) -> Company:
        existing = await self.repository.get_by_name(company_in.name)
        if existing:
            raise ConflictError(
                message=f"Company with name '{company_in.name}' already exists."
            )
        return await self.repository.create(company_in.model_dump())

    async def list_companies(
        self, search: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[Company]:
        if search:
            return await self.repository.search_companies(search, limit=limit)
        return await self.repository.get_multi(skip=skip, limit=limit)

    async def get_company(self, company_id: int) -> Company:
        company = await self.repository.get(company_id)
        if not company:
            raise NotFoundError(message=f"Company with ID {company_id} not found.")
        return company

    async def update_company(
        self, company_id: int, company_in: CompanyUpdate
    ) -> Company:
        company = await self.get_company(company_id)
        update_data = company_in.model_dump(exclude_unset=True)
        return await self.repository.update(company, update_data)
