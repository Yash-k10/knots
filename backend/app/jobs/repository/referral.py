from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.jobs.models.referral import Referral


class ReferralRepository(BaseRepository[Referral]):
    def __init__(self, db: AsyncSession):
        super().__init__(Referral, db)

    async def get_user_referrals(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Referral]:
        stmt = (
            select(Referral)
            .options(
                selectinload(Referral.job_posting),
                selectinload(Referral.referrer),
                selectinload(Referral.referred_user),
            )
            .filter(Referral.referrer_id == user_id)
            .order_by(Referral.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
