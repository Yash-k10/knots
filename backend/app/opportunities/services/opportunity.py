from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.opportunities.models.opportunity import (
    Opportunity,
    OpportunityStatus,
    OpportunityType,
)
from app.opportunities.models.opportunity_application import (
    OpportunityApplication,
    OpportunityApplicationStatus,
)
from app.opportunities.repository.opportunity import (
    OpportunityApplicationRepository,
    OpportunityRepository,
    StudentSearchRepository,
)
from app.opportunities.schemas.opportunity import (
    OpportunityApplicationCreate,
    OpportunityApplicationResponse,
    OpportunityApplicationUpdate,
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
    StudentSearchResult,
)
from app.users.models.user import User


class OpportunityService:
    """Business logic for faculty opportunities."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.opp_repo = OpportunityRepository(db)
        self.app_repo = OpportunityApplicationRepository(db)
        self.student_repo = StudentSearchRepository(db)

    # ── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _get_user_role(user: User) -> str:
        if hasattr(user, "role") and user.role:
            return user.role.name.lower().strip()
        return "student"

    @staticmethod
    def _is_faculty_or_admin(user: User) -> bool:
        if getattr(user, "role_id", None) in (1, 2, 9):
            return True
        role = OpportunityService._get_user_role(user)
        return (
            role
            in (
                "faculty",
                "hod",
                "admin",
                "super admin",
                "superadmin",
                "tpo",
                "controller",
                "management",
                "central admin",
                "coordinator",
            )
            or "coordinator" in role
            or "faculty" in role
            or "tpo" in role
        )

    @staticmethod
    def _is_admin(user: User) -> bool:
        if getattr(user, "role_id", None) in (1, 2, 9):
            return True
        role = OpportunityService._get_user_role(user)
        return role in (
            "admin",
            "super admin",
            "superadmin",
            "central admin",
            "management",
        )

    def _build_opportunity_response(self, opp: Opportunity) -> OpportunityResponse:
        posted_by_name = None
        posted_by_department = None
        posted_by_avatar = None

        if opp.posted_by:
            profile = getattr(opp.posted_by, "profile", None)
            if profile:
                first = profile.first_name or ""
                last = profile.last_name or ""
                posted_by_name = f"{first} {last}".strip() or opp.posted_by.email
                posted_by_department = profile.department
                posted_by_avatar = profile.profile_picture
            else:
                posted_by_name = opp.posted_by.email

        return OpportunityResponse(
            id=opp.id,
            title=opp.title,
            description=opp.description,
            opportunity_type=opp.opportunity_type,
            required_skills=opp.required_skills,
            department=opp.department,
            location=opp.location,
            stipend_or_salary=opp.stipend_or_salary,
            duration=opp.duration,
            max_applicants=opp.max_applicants,
            application_deadline=opp.application_deadline,
            status=opp.status,
            form_link=opp.form_link,
            posted_by_id=opp.posted_by_id,
            created_at=opp.created_at,
            updated_at=opp.updated_at,
            applications_count=len(opp.applications) if opp.applications else 0,
            posted_by_name=posted_by_name,
            posted_by_department=posted_by_department,
            posted_by_avatar=posted_by_avatar,
        )

    def _build_application_response(
        self, app: OpportunityApplication
    ) -> OpportunityApplicationResponse:
        applicant_name = None
        applicant_email = None
        applicant_department = None
        applicant_skills = None
        applicant_avatar = None
        opportunity_title = None
        opportunity_type = None

        if app.applicant:
            applicant_email = app.applicant.email
            profile = getattr(app.applicant, "profile", None)
            if profile:
                first = profile.first_name or ""
                last = profile.last_name or ""
                applicant_name = f"{first} {last}".strip() or app.applicant.email
                applicant_department = profile.department
                applicant_skills = profile.skills
                applicant_avatar = profile.profile_picture
            else:
                applicant_name = app.applicant.email

        if app.opportunity:
            opportunity_title = app.opportunity.title
            opportunity_type = app.opportunity.opportunity_type

        return OpportunityApplicationResponse(
            id=app.id,
            opportunity_id=app.opportunity_id,
            applicant_id=app.applicant_id,
            message=app.message,
            resume_url=app.resume_url,
            status=app.status,
            applied_at=app.applied_at,
            updated_at=app.updated_at,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            applicant_department=applicant_department,
            applicant_skills=applicant_skills,
            applicant_avatar=applicant_avatar,
            opportunity_title=opportunity_title,
            opportunity_type=opportunity_type,
        )

    @staticmethod
    def _depts_match(user_dept: str | None, other_dept: str | None) -> bool:
        if not user_dept or not other_dept:
            return False
        u = user_dept.strip().lower()
        o = other_dept.strip().lower()
        if u == o:
            return True
        if "aiml" in u or "artificial intelligence" in u:
            return "aiml" in o or "artificial intelligence" in o
        if "aids" in u or "data science" in u:
            return "aids" in o or "data science" in o
        if "computer" in u or "cse" in u:
            return (
                ("computer" in o or "cse" in o) and "aiml" not in o and "aids" not in o
            )
        if "information technology" in u or u == "it":
            return "information technology" in o or o == "it"
        if "electronic" in u or "etc" in u or "ece" in u:
            return "electronic" in o or "etc" in o or "ece" in o
        if "electric" in u or "ee" in u:
            return "electric" in o or o == "ee"
        if "mechanic" in u or "me" in u:
            return "mechanic" in o or o == "me"
        if "civil" in u:
            return "civil" in o
        if "bca" in u:
            return "bca" in o
        if "mca" in u:
            return "mca" in o
        if "mba" in u:
            return "mba" in o
        return u in o or o in u

    # ── Opportunity CRUD ─────────────────────────────────────────────────────

    async def create_opportunity(
        self, data: OpportunityCreate, user: User
    ) -> OpportunityResponse:
        role = self._get_user_role(user)
        if role == "hod":
            raise AuthorizationError(
                message="HOD accounts have view-only access to opportunities and cannot create new postings."
            )

        if not self._is_faculty_or_admin(user):
            raise AuthorizationError(
                message="Only faculty and admins can create opportunities"
            )

        opportunity = Opportunity(
            title=data.title,
            description=data.description,
            opportunity_type=data.opportunity_type,
            required_skills=data.required_skills,
            department=data.department,
            location=data.location,
            stipend_or_salary=data.stipend_or_salary,
            duration=data.duration,
            max_applicants=data.max_applicants,
            application_deadline=data.application_deadline,
            form_link=data.form_link,
            posted_by_id=user.id,
        )
        opportunity = await self.opp_repo.create(opportunity)
        # Re-fetch with relations
        opportunity = await self.opp_repo.get_by_id(opportunity.id)
        return self._build_opportunity_response(opportunity)

    async def get_opportunity(self, opportunity_id: int) -> OpportunityResponse:
        opp = await self.opp_repo.get_by_id(opportunity_id)
        if not opp:
            raise NotFoundError(
                message=f"Opportunity with id {opportunity_id} not found"
            )
        return self._build_opportunity_response(opp)

    async def list_opportunities(
        self,
        skip: int = 0,
        limit: int = 20,
        opportunity_type: OpportunityType | None = None,
        status: OpportunityStatus | None = None,
        department: str | None = None,
        search: str | None = None,
        skills: list[str] | None = None,
    ) -> list[OpportunityResponse]:
        opps = await self.opp_repo.list_opportunities(
            skip=skip,
            limit=limit,
            opportunity_type=opportunity_type,
            status=status,
            department=department,
            search=search,
            skills=skills,
        )
        return [self._build_opportunity_response(o) for o in opps]

    async def get_my_postings(self, user: User) -> list[OpportunityResponse]:
        if self._is_admin(user):
            all_opps = await self.opp_repo.list_opportunities(limit=100)
            return [self._build_opportunity_response(o) for o in all_opps]

        role = self._get_user_role(user)
        if role == "hod":
            # For HOD, return opportunities relevant to HOD's department,
            # with applications_count reflecting applicants from the HOD's department only.
            hod_dept = (
                user.profile.department if getattr(user, "profile", None) else None
            ) or ""
            all_opps = await self.opp_repo.list_opportunities(limit=100)
            result = []
            for opp in all_opps:
                dept_match = (
                    self._depts_match(hod_dept, opp.department)
                    if opp.department
                    else False
                )
                dept_apps = [
                    a
                    for a in (opp.applications or [])
                    if a.applicant
                    and getattr(a.applicant, "profile", None)
                    and self._depts_match(hod_dept, a.applicant.profile.department)
                ]
                if dept_match or len(dept_apps) > 0:
                    resp = self._build_opportunity_response(opp)
                    resp.applications_count = len(dept_apps)
                    result.append(resp)
            return result

        opps = await self.opp_repo.get_by_posted_by(user.id)
        return [self._build_opportunity_response(o) for o in opps]

    async def update_opportunity(
        self, opportunity_id: int, data: OpportunityUpdate, user: User
    ) -> OpportunityResponse:
        opp = await self.opp_repo.get_by_id(opportunity_id)
        if not opp:
            raise NotFoundError(
                message=f"Opportunity with id {opportunity_id} not found"
            )

        is_admin = self._is_admin(user)
        if opp.posted_by_id != user.id and not is_admin:
            raise AuthorizationError(
                message="You can only update your own opportunities"
            )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(opp, field, value)

        opp = await self.opp_repo.update(opp)
        opp = await self.opp_repo.get_by_id(opp.id)
        return self._build_opportunity_response(opp)

    async def delete_opportunity(self, opportunity_id: int, user: User) -> None:
        opp = await self.opp_repo.get_by_id(opportunity_id)
        if not opp:
            raise NotFoundError(
                message=f"Opportunity with id {opportunity_id} not found"
            )

        is_admin = self._is_admin(user)
        if opp.posted_by_id != user.id and not is_admin:
            raise AuthorizationError(
                message="You can only delete your own opportunities"
            )

        await self.opp_repo.delete(opp)

    # ── Applications ─────────────────────────────────────────────────────────

    async def apply_to_opportunity(
        self, opportunity_id: int, data: OpportunityApplicationCreate, user: User
    ) -> OpportunityApplicationResponse:
        opp = await self.opp_repo.get_by_id(opportunity_id)
        if not opp:
            raise NotFoundError(
                message=f"Opportunity with id {opportunity_id} not found"
            )

        if opp.status != OpportunityStatus.OPEN:
            raise ValidationError(
                message="This opportunity is no longer accepting applications"
            )

        # Check if already applied
        existing = await self.app_repo.get_by_opportunity_and_applicant(
            opportunity_id, user.id
        )
        if existing:
            raise ValidationError(
                message="You have already applied to this opportunity"
            )

        # Check max applicants
        if opp.max_applicants:
            current_count = await self.app_repo.count_by_opportunity(opportunity_id)
            if current_count >= opp.max_applicants:
                raise ValidationError(
                    message="This opportunity has reached its maximum number of applicants"
                )

        application = OpportunityApplication(
            opportunity_id=opportunity_id,
            applicant_id=user.id,
            message=data.message,
            resume_url=data.resume_url,
            status=OpportunityApplicationStatus.APPLIED,
        )
        application = await self.app_repo.create(application)
        application = await self.app_repo.get_by_id(application.id)
        return self._build_application_response(application)

    async def get_opportunity_applications(
        self, opportunity_id: int, user: User
    ) -> list[OpportunityApplicationResponse]:
        opp = await self.opp_repo.get_by_id(opportunity_id)
        if not opp:
            raise NotFoundError(
                message=f"Opportunity with id {opportunity_id} not found"
            )

        role = self._get_user_role(user)
        is_admin = role in (
            "admin",
            "super admin",
            "superadmin",
            "central admin",
            "tpo",
        )
        is_hod = role == "hod"

        if opp.posted_by_id != user.id and not is_admin and not is_hod:
            raise AuthorizationError(
                message="Only the opportunity poster or authorized leadership can view applications"
            )

        apps = await self.app_repo.get_by_opportunity(opportunity_id)
        if is_hod:
            hod_dept = (
                user.profile.department if getattr(user, "profile", None) else None
            ) or ""
            apps = [
                a
                for a in apps
                if a.applicant
                and getattr(a.applicant, "profile", None)
                and self._depts_match(hod_dept, a.applicant.profile.department)
            ]

        return [self._build_application_response(a) for a in apps]

    async def get_my_applications(
        self, user: User
    ) -> list[OpportunityApplicationResponse]:
        apps = await self.app_repo.get_by_applicant(user.id)
        return [self._build_application_response(a) for a in apps]

    async def update_application_status(
        self, application_id: int, data: OpportunityApplicationUpdate, user: User
    ) -> OpportunityApplicationResponse:
        app = await self.app_repo.get_by_id(application_id)
        if not app:
            raise NotFoundError(
                message=f"Application with id {application_id} not found"
            )

        # Verify the user is the opportunity poster, admin, or department leadership
        opp = await self.opp_repo.get_by_id(app.opportunity_id)
        role = self._get_user_role(user)
        is_admin = role in (
            "admin",
            "super admin",
            "superadmin",
            "central admin",
            "tpo",
        )
        is_hod = role == "hod"
        if opp.posted_by_id != user.id and not is_admin and not is_hod:
            raise AuthorizationError(
                message="Only the opportunity poster or authorized leadership can update application status"
            )

        app.status = data.status
        app = await self.app_repo.update(app)
        app = await self.app_repo.get_by_id(app.id)
        return self._build_application_response(app)

    # ── Student Search ───────────────────────────────────────────────────────

    async def search_students(
        self,
        user: User,
        skills: list[str] | None = None,
        department: str | None = None,
        graduation_year: int | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[StudentSearchResult]:
        if not self._is_faculty_or_admin(user):
            raise AuthorizationError(
                message="Only faculty and admins can search students"
            )

        rows = await self.student_repo.search_students(
            skills=skills,
            department=department,
            graduation_year=graduation_year,
            search=search,
            skip=skip,
            limit=limit,
        )

        results = []
        for row in rows:
            u = row["user"]
            p = row["profile"]
            results.append(
                StudentSearchResult(
                    id=u.id,
                    email=u.email,
                    first_name=p.first_name,
                    last_name=p.last_name,
                    department=p.department,
                    graduation_year=p.graduation_year,
                    skills=p.skills,
                    profile_picture=p.profile_picture,
                    bio=p.bio,
                )
            )
        return results
