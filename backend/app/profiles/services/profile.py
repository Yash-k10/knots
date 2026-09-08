from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.profiles.models.education import Education
from app.profiles.models.employment_history import EmploymentHistory
from app.profiles.models.profile import Profile
from app.profiles.repository.education import EducationRepository
from app.profiles.repository.employment_history import EmploymentHistoryRepository
from app.profiles.repository.profile import ProfileRepository
from app.profiles.schemas.profile import (
    EducationCreate,
    EducationUpdate,
    EmploymentHistoryCreate,
    EmploymentHistoryUpdate,
    ProfileUpdate,
)


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.profile_repo = ProfileRepository(db)
        self.education_repo = EducationRepository(db)
        self.employment_repo = EmploymentHistoryRepository(db)

    async def _enrich_profile(self, profile: Profile) -> Profile:
        if not profile:
            return profile

        # 1. Fetch skill endorsements
        from sqlalchemy import select

        from app.profiles.models.skill_endorsement import SkillEndorsement

        stmt = (
            select(
                SkillEndorsement.id,
                SkillEndorsement.profile_id,
                SkillEndorsement.skill_name,
                SkillEndorsement.endorser_id,
                Profile.first_name,
                Profile.last_name,
            )
            .join(
                Profile, Profile.user_id == SkillEndorsement.endorser_id, isouter=True
            )
            .where(SkillEndorsement.profile_id == profile.id)
        )
        res = await self.profile_repo.db.execute(stmt)
        rows = res.all()

        endorsements = []
        for id_, prof_id, skill, endorser_id, first_name, last_name in rows:
            name = (
                f"{first_name or ''} {last_name or ''}".strip() or f"User {endorser_id}"
            )
            endorsements.append(
                {
                    "id": id_,
                    "profile_id": prof_id,
                    "skill_name": skill,
                    "endorser_id": endorser_id,
                    "endorser_name": name,
                }
            )

        profile.endorsements = endorsements

        # 2. Fetch connection count
        from sqlalchemy import and_, func, or_

        from app.connections.models.connection import Connection, ConnectionStatus

        conn_stmt = select(func.count(Connection.id)).where(
            and_(
                or_(
                    Connection.requester_id == profile.user_id,
                    Connection.addressee_id == profile.user_id,
                ),
                Connection.status == ConnectionStatus.ACCEPTED,
            )
        )
        conn_res = await self.profile_repo.db.execute(conn_stmt)
        profile.connection_count = conn_res.scalar() or 0

        return profile

    async def get_profile_by_user_id(self, user_id: int) -> Profile:
        """Retrieve user's profile, creating a blank one if it doesn't exist yet."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            # Auto-create profile if it doesn't exist
            profile = await self.profile_repo.create({"user_id": user_id})
            # Reload with empty relationship lists
            profile = await self.profile_repo.get_by_user_id(user_id)
        return await self._enrich_profile(profile)

    async def update_profile(self, user_id: int, profile_in: ProfileUpdate) -> Profile:
        """Create or update a profile for a given user."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            data = profile_in.model_dump(exclude_unset=True)
            data["user_id"] = user_id
            await self.profile_repo.create(data)
            return await self.get_profile_by_user_id(user_id)

        await self.profile_repo.update(
            profile, profile_in.model_dump(exclude_unset=True)
        )
        return await self.get_profile_by_user_id(user_id)

    async def list_profiles(
        self,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> list[Profile]:
        """Retrieve a paginated list of profiles with enriched endorsements and connection counts."""
        profiles = await self.profile_repo.list_profiles(
            skip=skip, limit=limit, search=search
        )
        enriched = []
        for profile in profiles:
            enriched.append(await self._enrich_profile(profile))
        return enriched

    # --- Education CRUD ---
    async def add_education(
        self, user_id: int, education_in: EducationCreate
    ) -> Education:
        """Add an education entry to the user's profile."""
        profile = await self.get_profile_by_user_id(user_id)
        data = education_in.model_dump()
        data["profile_id"] = profile.id
        return await self.education_repo.create(data)

    async def update_education(
        self, user_id: int, education_id: int, education_in: EducationUpdate
    ) -> Education:
        """Update an education entry."""
        profile = await self.get_profile_by_user_id(user_id)
        education = await self.education_repo.get(education_id)
        if not education or education.profile_id != profile.id:
            raise NotFoundError("Education record not found.")
        return await self.education_repo.update(
            education, education_in.model_dump(exclude_unset=True)
        )

    async def delete_education(self, user_id: int, education_id: int) -> Education:
        """Delete an education entry."""
        profile = await self.get_profile_by_user_id(user_id)
        education = await self.education_repo.get(education_id)
        if not education or education.profile_id != profile.id:
            raise NotFoundError("Education record not found.")
        return await self.education_repo.remove(education_id)

    # --- Employment History CRUD ---
    async def add_employment_history(
        self, user_id: int, employment_in: EmploymentHistoryCreate
    ) -> EmploymentHistory:
        """Add an employment history entry to the user's profile."""
        profile = await self.get_profile_by_user_id(user_id)
        data = employment_in.model_dump()
        data["profile_id"] = profile.id
        return await self.employment_repo.create(data)

    async def update_employment_history(
        self, user_id: int, employment_id: int, employment_in: EmploymentHistoryUpdate
    ) -> EmploymentHistory:
        """Update an employment history entry."""
        profile = await self.get_profile_by_user_id(user_id)
        employment = await self.employment_repo.get(employment_id)
        if not employment or employment.profile_id != profile.id:
            raise NotFoundError("Employment history record not found.")
        return await self.employment_repo.update(
            employment, employment_in.model_dump(exclude_unset=True)
        )

    async def delete_employment_history(
        self, user_id: int, employment_id: int
    ) -> EmploymentHistory:
        """Delete an employment history entry."""
        profile = await self.get_profile_by_user_id(user_id)
        employment = await self.employment_repo.get(employment_id)
        if not employment or employment.profile_id != profile.id:
            raise NotFoundError("Employment history record not found.")
        return await self.employment_repo.remove(employment_id)
