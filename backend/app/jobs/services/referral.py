from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.jobs.models.referral import Referral
from app.jobs.repository.job import JobPostingRepository
from app.jobs.repository.referral import ReferralRepository
from app.jobs.schemas.referral import ReferralCreate


class ReferralService:
    def __init__(self, db: AsyncSession):
        self.repository = ReferralRepository(db)
        self.job_repository = JobPostingRepository(db)

    async def create_referral(
        self, referrer_id: int, referral_in: ReferralCreate
    ) -> Referral:
        job = await self.job_repository.get(referral_in.job_posting_id)
        if not job:
            raise NotFoundError(
                message=f"Job posting with ID {referral_in.job_posting_id} not found."
            )

        data = referral_in.model_dump()
        data["referrer_id"] = referrer_id
        return await self.repository.create(data)

    async def get_user_referrals(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Referral]:
        return await self.repository.get_user_referrals(
            user_id=user_id, skip=skip, limit=limit
        )
