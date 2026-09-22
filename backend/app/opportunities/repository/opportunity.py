from sqlalchemy import func, select, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.opportunities.models.opportunity import (
    Opportunity,
    OpportunityStatus,
    OpportunityType,
)
from app.opportunities.models.opportunity_application import (
    OpportunityApplication,
)
from app.profiles.models.profile import Profile
from app.users.models.user import User


class OpportunityRepository:
    """Repository for Opportunity CRUD and queries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, opportunity: Opportunity) -> Opportunity:
        self.db.add(opportunity)
        await self.db.commit()
        await self.db.refresh(opportunity)
        return opportunity

    async def get_by_id(self, opportunity_id: int) -> Opportunity | None:
        result = await self.db.execute(
            select(Opportunity)
            .options(
                selectinload(Opportunity.posted_by).selectinload(User.profile),
                selectinload(Opportunity.posted_by).selectinload(User.role),
                selectinload(Opportunity.applications)
                .selectinload(OpportunityApplication.applicant)
                .selectinload(User.profile),
            )
            .where(Opportunity.id == opportunity_id)
        )
        return result.scalars().first()

    async def list_opportunities(
        self,
        skip: int = 0,
        limit: int = 20,
        opportunity_type: OpportunityType | None = None,
        status: OpportunityStatus | None = None,
        department: str | None = None,
        search: str | None = None,
        skills: list[str] | None = None,
    ) -> list[Opportunity]:
        stmt = (
            select(Opportunity)
            .options(
                selectinload(Opportunity.posted_by).selectinload(User.profile),
                selectinload(Opportunity.posted_by).selectinload(User.role),
                selectinload(Opportunity.applications)
                .selectinload(OpportunityApplication.applicant)
                .selectinload(User.profile),
            )
            .order_by(Opportunity.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if opportunity_type:
            stmt = stmt.where(Opportunity.opportunity_type == opportunity_type)
        if status:
            stmt = stmt.where(Opportunity.status == status)
        if department:
            stmt = stmt.where(Opportunity.department.ilike(f"%{department}%"))
        if search:
            stmt = stmt.where(
                or_(
                    Opportunity.title.ilike(f"%{search}%"),
                    Opportunity.description.ilike(f"%{search}%"),
                )
            )
        if skills:
            # Filter opportunities that require any of the given skills
            # Using JSON contains for PostgreSQL
            for skill in skills:
                stmt = stmt.where(
                    cast(Opportunity.required_skills, String).ilike(f"%{skill}%")
                )

        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_by_posted_by(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> list[Opportunity]:
        result = await self.db.execute(
            select(Opportunity)
            .options(
                selectinload(Opportunity.posted_by).selectinload(User.profile),
                selectinload(Opportunity.posted_by).selectinload(User.role),
                selectinload(Opportunity.applications)
                .selectinload(OpportunityApplication.applicant)
                .selectinload(User.profile),
            )
            .where(Opportunity.posted_by_id == user_id)
            .order_by(Opportunity.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().unique().all())

    async def update(self, opportunity: Opportunity) -> Opportunity:
        await self.db.commit()
        await self.db.refresh(opportunity)
        return opportunity

    async def delete(self, opportunity: Opportunity) -> None:
        await self.db.delete(opportunity)
        await self.db.commit()


class OpportunityApplicationRepository:
    """Repository for OpportunityApplication CRUD and queries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, application: OpportunityApplication
    ) -> OpportunityApplication:
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def get_by_id(self, application_id: int) -> OpportunityApplication | None:
        result = await self.db.execute(
            select(OpportunityApplication)
            .options(
                selectinload(OpportunityApplication.applicant).selectinload(
                    User.profile
                ),
                selectinload(OpportunityApplication.opportunity),
            )
            .where(OpportunityApplication.id == application_id)
        )
        return result.scalars().first()

    async def get_by_opportunity_and_applicant(
        self, opportunity_id: int, applicant_id: int
    ) -> OpportunityApplication | None:
        result = await self.db.execute(
            select(OpportunityApplication).where(
                OpportunityApplication.opportunity_id == opportunity_id,
                OpportunityApplication.applicant_id == applicant_id,
            )
        )
        return result.scalars().first()

    async def get_by_opportunity(
        self, opportunity_id: int
    ) -> list[OpportunityApplication]:
        result = await self.db.execute(
            select(OpportunityApplication)
            .options(
                selectinload(OpportunityApplication.applicant).selectinload(
                    User.profile
                ),
            )
            .where(OpportunityApplication.opportunity_id == opportunity_id)
            .order_by(OpportunityApplication.applied_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get_by_applicant(self, applicant_id: int) -> list[OpportunityApplication]:
        result = await self.db.execute(
            select(OpportunityApplication)
            .options(
                selectinload(OpportunityApplication.opportunity)
                .selectinload(Opportunity.posted_by)
                .selectinload(User.profile),
            )
            .where(OpportunityApplication.applicant_id == applicant_id)
            .order_by(OpportunityApplication.applied_at.desc())
        )
        return list(result.scalars().unique().all())

    async def update(
        self, application: OpportunityApplication
    ) -> OpportunityApplication:
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def count_by_opportunity(self, opportunity_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(OpportunityApplication)
            .where(OpportunityApplication.opportunity_id == opportunity_id)
        )
        return result.scalar_one()


class StudentSearchRepository:
    """Repository for searching students by skills, department, etc."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_students(
        self,
        skills: list[str] | None = None,
        department: str | None = None,
        graduation_year: int | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[dict]:
        """Search students by skills, department, graduation year, or name."""
        stmt = (
            select(User, Profile)
            .join(Profile, User.id == Profile.user_id)
            .offset(skip)
            .limit(limit)
        )

        # Only search students and alumni
        from app.users.models.role import Role

        stmt = stmt.join(Role, User.role_id == Role.id).where(
            Role.name.in_(["Student", "Alumni", "student", "alumni"])
        )

        if department:
            stmt = stmt.where(Profile.department.ilike(f"%{department}%"))
        if graduation_year:
            stmt = stmt.where(Profile.graduation_year == graduation_year)
        if search:
            stmt = stmt.where(
                or_(
                    Profile.first_name.ilike(f"%{search}%"),
                    Profile.last_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                )
            )
        if skills:
            skill_clauses = [
                cast(Profile.skills, String).ilike(f"%{skill.strip()}%")
                for skill in skills
                if skill.strip()
            ]
            if skill_clauses:
                stmt = stmt.where(or_(*skill_clauses))

        result = await self.db.execute(stmt)
        rows = result.unique().all()
        return [{"user": row[0], "profile": row[1]} for row in rows]
