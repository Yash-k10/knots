from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.jobs.models.application import Application
from app.jobs.models.enums import ApplicationStatusEnum
from app.jobs.repository.application import ApplicationRepository
from app.jobs.repository.job import JobPostingRepository
from app.jobs.schemas.application import ApplicationCreate, ApplicationUpdate


class ApplicationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ApplicationRepository(db)
        self.job_repository = JobPostingRepository(db)

    async def apply_for_job(
        self, applicant_id: int, job_posting_id: int, application_in: ApplicationCreate
    ) -> Application:
        job = await self.job_repository.get(job_posting_id)
        if not job:
            raise NotFoundError(
                message=f"Job posting with ID {job_posting_id} not found."
            )

        existing = await self.repository.get_by_user_and_job(
            applicant_id, job_posting_id
        )
        if existing:
            raise ConflictError(
                message="You have already applied for this job posting."
            )

        data = application_in.model_dump()
        data["applicant_id"] = applicant_id
        data["job_posting_id"] = job_posting_id
        if not data.get("status"):
            if getattr(job, "form_link", None):
                data["status"] = ApplicationStatusEnum.APPLIED
            else:
                data["status"] = ApplicationStatusEnum.PENDING
        app_obj = await self.repository.create(data)

        # Trigger email notification to job poster
        try:
            import logging
            from app.core.email import send_application_alert_email
            from app.users.repository.user import UserRepository

            user_repo = UserRepository(self.db)
            poster = await user_repo.get(job.posted_by_id)
            applicant = await user_repo.get(applicant_id)

            if poster and poster.email and applicant:
                applicant_profile = getattr(applicant, "profile", None)
                app_name = (
                    f"{applicant_profile.first_name or ''} {applicant_profile.last_name or ''}".strip()
                    if applicant_profile
                    else applicant.email.split("@")[0]
                ) or applicant.email.split("@")[0]

                poster_profile = getattr(poster, "profile", None)
                p_name = (
                    f"{poster_profile.first_name or ''} {poster_profile.last_name or ''}".strip()
                    if poster_profile
                    else poster.email.split("@")[0]
                ) or poster.email.split("@")[0]

                company_name = (
                    job.company.name
                    if getattr(job, "company", None)
                    else "Campus Opportunity"
                )

                send_application_alert_email(
                    poster_email=poster.email,
                    poster_name=p_name,
                    applicant_name=app_name,
                    applicant_email=applicant.email,
                    job_title=job.title,
                    company_name=company_name,
                    resume_url=data.get("resume_url"),
                    cover_note=data.get("cover_letter"),
                )
        except Exception as email_err:
            import logging

            logging.getLogger(__name__).warning(
                f"Could not dispatch application alert email: {email_err}"
            )

        return await self.repository.get(app_obj.id)

    async def get_user_applications(
        self, applicant_id: int, skip: int = 0, limit: int = 50
    ) -> list[Application]:
        return await self.repository.get_user_applications(
            applicant_id=applicant_id, skip=skip, limit=limit
        )

    async def get_job_applications(
        self,
        job_posting_id: int,
        user_id: int,
        is_admin: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Application]:
        job = await self.job_repository.get(job_posting_id)
        if not job:
            raise NotFoundError(
                message=f"Job posting with ID {job_posting_id} not found."
            )
        if job.posted_by_id != user_id and not is_admin:
            raise AuthorizationError(
                message="Not authorized to view applicants for this job."
            )

        return await self.repository.get_job_applications(
            job_posting_id=job_posting_id, skip=skip, limit=limit
        )

    async def update_application_status(
        self,
        application_id: int,
        user_id: int,
        application_in: ApplicationUpdate,
        is_admin: bool = False,
    ) -> Application:
        app_obj = await self.repository.get(application_id)
        if not app_obj:
            raise NotFoundError(
                message=f"Application with ID {application_id} not found."
            )

        job = await self.job_repository.get(app_obj.job_posting_id)
        if not job:
            raise NotFoundError(message="Associated job posting not found.")
        if job.posted_by_id != user_id and not is_admin:
            raise AuthorizationError(
                message="Not authorized to update status for this application."
            )

        update_data = application_in.model_dump(exclude_unset=True)
        updated_app = await self.repository.update(app_obj, update_data)
        return await self.repository.get(updated_app.id)
