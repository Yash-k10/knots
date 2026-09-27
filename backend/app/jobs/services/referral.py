import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.email import send_referral_email
from app.core.exceptions import NotFoundError
from app.jobs.models.referral import Referral
from app.jobs.repository.job import JobPostingRepository
from app.jobs.repository.referral import ReferralRepository
from app.jobs.schemas.referral import ReferralCreate, DirectReferralEmailRequest
from app.users.models.user import User

logger = logging.getLogger(__name__)


class ReferralService:
    def __init__(self, db: AsyncSession):
        self.db = db
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
            stmt = select(User).options(selectinload(User.profile)).where(User.id == referrer_id)
            res = await self.db.execute(stmt)
            student = res.scalars().first()

            alumni_id = referral_in.referred_user_id or job.posted_by_id
            alumni = None
            if alumni_id:
                stmt_alumni = select(User).options(selectinload(User.profile)).where(User.id == alumni_id)
                res_alumni = await self.db.execute(stmt_alumni)
                alumni = res_alumni.scalars().first()

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

                loop = asyncio.get_event_loop()
                loop.run_in_executor(
                    None,
                    send_referral_email,
                    alumni.email,
                    alumni_name,
                    student_name,
                    department,
                    job.title,
                    job.company.name if job.company else "Campus Partner",
                    student_profile_link,
                    opportunity_link,
                    getattr(student.profile, "resume_url", None) if hasattr(student, "profile") and student.profile else None,
                    getattr(student.profile, "linkedin_url", None) if hasattr(student, "profile") and student.profile else None,
                    getattr(student.profile, "github_url", None) if hasattr(student, "profile") and student.profile else None,
                    student.email,
                    getattr(student.profile, "phone_number", None) if hasattr(student, "profile") and student.profile else None,
                    str(student.profile.graduation_year) if hasattr(student, "profile") and student.profile and student.profile.graduation_year else None,
                    getattr(student.profile, "placement_status", "Actively Seeking Placement") if hasattr(student, "profile") and student.profile else "Actively Seeking Placement",
                    str(student.profile.cgpa) if hasattr(student, "profile") and student.profile and getattr(student.profile, "cgpa", None) else None,
                    getattr(student.profile, "skills", None) if hasattr(student, "profile") and student.profile else None,
                    referral_in.message,
                )
        except Exception as e:
            logger.warning(f"Failed to send referral email: {e}")

        return referral

    async def send_direct_referral_email(
        self, current_user_id: int, payload: DirectReferralEmailRequest
    ) -> dict:
        """Process and send a direct referral request to an alumni's email inbox and internal Knots inbox."""
        # 1. Fetch current student details from database
        stmt = select(User).options(selectinload(User.profile)).where(User.id == current_user_id)
        res = await self.db.execute(stmt)
        student_user = res.scalars().first()

        student_name = payload.student_name
        if not student_name and student_user:
            student_name = (
                student_user.profile.full_name
                if (hasattr(student_user, "profile") and student_user.profile and student_user.profile.full_name)
                else (student_user.first_name + " " + (student_user.last_name or "")).strip() or student_user.email.split("@")[0]
            )

        student_email = payload.student_email or (student_user.email if student_user else "")
        student_phone = payload.student_phone or (student_user.profile.phone_number if student_user and hasattr(student_user, "profile") and student_user.profile else None)
        department = payload.department or (student_user.profile.department if student_user and hasattr(student_user, "profile") and student_user.profile else "Engineering")
        batch = payload.batch or (str(student_user.profile.graduation_year) if student_user and hasattr(student_user, "profile") and student_user.profile and student_user.profile.graduation_year else "2025")
        placement_status = payload.placement_status or (getattr(student_user.profile, "placement_status", None) if student_user and hasattr(student_user, "profile") and student_user.profile else "Not Placed yet / Looking for Placement")
        cgpa = payload.cgpa or (str(student_user.profile.cgpa) if student_user and hasattr(student_user, "profile") and student_user.profile and getattr(student_user.profile, "cgpa", None) else None)
        skills = payload.skills or (getattr(student_user.profile, "skills", None) if student_user and hasattr(student_user, "profile") and student_user.profile else None)

        frontend_url = "http://localhost:5173"
        student_profile_link = f"{frontend_url}/profile/{current_user_id}"

        # 2. Check if the alumni email matches an existing user on Knots
        alumni_email_norm = payload.alumni_email.strip().lower()
        stmt_alum = select(User).where(User.email.ilike(alumni_email_norm))
        res_alum = await self.db.execute(stmt_alum)
        alumni_user = res_alum.scalars().first()

        # 3. Create a referral record in the database if possible
        job_id = payload.job_posting_id
        if not job_id:
            # Look up an existing job or default job ID for reference
            jobs_multi = await self.job_repository.get_multi(limit=1)
            if jobs_multi:
                job_id = jobs_multi[0].id

        if job_id:
            try:
                referral_obj = Referral(
                    referrer_id=current_user_id,
                    job_posting_id=job_id,
                    referred_user_id=alumni_user.id if alumni_user else None,
                    message=f"Direct Referral Request to {payload.alumni_name} ({payload.alumni_company}) for Role: {payload.target_job_title}. Note: {payload.message_pitch} | Resume: {payload.resume_url}",
                )
                self.db.add(referral_obj)
                await self.db.flush()
            except Exception as ref_err:
                logger.warning(f"Could not persist referral entry in DB: {ref_err}")

        # 4. If alumni is a registered Knots user, deliver in-app notification / direct message into their Knots inbox
        if alumni_user and alumni_user.id != current_user_id:
            try:
                from app.messaging.services.message import MessagingService
                from app.messaging.schemas.message import MessageCreate

                inbox_msg = (
                    f"📨 **Referral Request Received**\n\n"
                    f"Hi {payload.alumni_name},\n"
                    f"**{student_name}** ({department}, Batch {batch}) has requested a referral for **{payload.target_job_title}** at **{payload.alumni_company}**.\n\n"
                    f"**Status:** {placement_status}\n"
                    f"**Resume Link:** {payload.resume_url}\n"
                    f"**Candidate Pitch:** \"{payload.message_pitch}\"\n"
                    f"**Email:** {student_email}"
                )

                msg_service = MessagingService(self.db)
                await msg_service.send_message(
                    sender_id=current_user_id,
                    msg_in=MessageCreate(
                        receiver_id=alumni_user.id,
                        content=inbox_msg,
                    ),
                )
                logger.info(f"Delivered referral message into Knots Inbox for user ID {alumni_user.id}")
            except Exception as msg_err:
                logger.info(f"In-app inbox message dispatch skipped: {msg_err}")

        # 5. Send Rich Email to Alumni Inbox
        loop = asyncio.get_event_loop()
        loop.run_in_executor(
            None,
            send_referral_email,
            payload.alumni_email,
            payload.alumni_name,
            student_name,
            department,
            payload.target_job_title,
            payload.alumni_company,
            student_profile_link,
            payload.target_job_url,
            payload.resume_url,
            payload.linkedin_url,
            payload.github_url,
            student_email,
            student_phone,
            batch,
            placement_status,
            cgpa,
            skills,
            payload.message_pitch,
        )

        return {
            "status": "success",
            "message": f"Referral request email successfully delivered to {payload.alumni_name}'s inbox at {payload.alumni_company}!",
            "alumni_name": payload.alumni_name,
            "alumni_email": payload.alumni_email,
            "company": payload.alumni_company,
            "target_role": payload.target_job_title,
        }

    async def get_user_referrals(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Referral]:
        return await self.repository.get_user_referrals(
            user_id=user_id, skip=skip, limit=limit
        )

