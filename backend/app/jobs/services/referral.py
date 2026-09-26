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
        referral = await self.repository.create(data)

        # Trigger referral email
        try:
            from app.users.repository.user import UserRepository
            from app.core.email import send_referral_email
            import asyncio
            import logging

            user_repo = UserRepository(self.repository.session)
            student = await user_repo.get(referrer_id)

            alumni_id = referral_in.referred_user_id or job.posted_by_id
            alumni = await user_repo.get(alumni_id) if alumni_id else None

            if student and alumni and alumni.email:
                student_name = (
                    student.profile.full_name
                    if (
                        hasattr(student, "profile")
                        and student.profile
                        and student.profile.full_name
                    )
                    else student.email
                )
                alumni_name = (
                    alumni.profile.full_name
                    if (
                        hasattr(alumni, "profile")
                        and alumni.profile
                        and alumni.profile.full_name
                    )
                    else alumni.email
                )
                department = (
                    student.profile.department
                    if (
                        hasattr(student, "profile")
                        and student.profile
                        and student.profile.department
                    )
                    else "General"
                )

                frontend_url = "http://localhost:5173"
                student_profile_link = f"{frontend_url}/profile/{student.id}"
                opportunity_link = f"{frontend_url}/jobs/{job.id}"

                # Run the email dispatch asynchronously
                loop = asyncio.get_event_loop()
                loop.run_in_executor(
                    None,
                    send_referral_email,
                    alumni.email,
                    alumni_name,
                    student_name,
                    department,
                    job.title,
                    job.company_name,
                    student_profile_link,
                    opportunity_link,
                )
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to send referral email: {e}")

        return referral

    async def get_user_referrals(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Referral]:
        return await self.repository.get_user_referrals(
            user_id=user_id, skip=skip, limit=limit
        )
