from sqlalchemy.ext.asyncio import AsyncSession
from app.profiles.repository.profile import ProfileRepository
from app.profiles.repository.education import EducationRepository
from app.profiles.repository.employment_history import EmploymentHistoryRepository
from app.profiles.schemas.profile import (
    ProfileUpdate,
    EducationCreate,
    EducationUpdate,
    EmploymentHistoryCreate,
    EmploymentHistoryUpdate,
)
from app.profiles.models.profile import Profile
from app.profiles.models.education import Education
from app.profiles.models.employment_history import EmploymentHistory
from app.core.exceptions import NotFoundError


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.profile_repo = ProfileRepository(db)
        self.education_repo = EducationRepository(db)
        self.employment_repo = EmploymentHistoryRepository(db)

    async def get_profile_by_user_id(self, user_id: int) -> Profile:
        """Retrieve user's profile, creating a blank one if it doesn't exist yet."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            # Auto-create profile if it doesn't exist
            profile = await self.profile_repo.create({"user_id": user_id})
            # Reload with empty relationship lists
            profile = await self.profile_repo.get_by_user_id(user_id)
        return profile

    async def update_profile(self, user_id: int, profile_in: ProfileUpdate) -> Profile:
        """Create or update a profile for a given user."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            data = profile_in.dict(exclude_unset=True)
            data["user_id"] = user_id
            await self.profile_repo.create(data)
            return await self.profile_repo.get_by_user_id(user_id)

        await self.profile_repo.update(profile, profile_in.dict(exclude_unset=True))
        return await self.profile_repo.get_by_user_id(user_id)

    # --- Education CRUD ---
    async def add_education(
        self, user_id: int, education_in: EducationCreate
    ) -> Education:
        """Add an education entry to the user's profile."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundError("Profile not found.")
        data = education_in.dict()
        data["profile_id"] = profile.id
        return await self.education_repo.create(data)

    async def update_education(
        self, user_id: int, education_id: int, education_in: EducationUpdate
    ) -> Education:
        """Update an education entry."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundError("Profile not found.")
        education = await self.education_repo.get(education_id)
        if not education or education.profile_id != profile.id:
            raise NotFoundError("Education record not found.")
        return await self.education_repo.update(
            education, education_in.dict(exclude_unset=True)
        )

    async def delete_education(self, user_id: int, education_id: int) -> Education:
        """Delete an education entry."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundError("Profile not found.")
        education = await self.education_repo.get(education_id)
        if not education or education.profile_id != profile.id:
            raise NotFoundError("Education record not found.")
        return await self.education_repo.remove(education_id)

    # --- Employment History CRUD ---
    async def add_employment_history(
        self, user_id: int, employment_in: EmploymentHistoryCreate
    ) -> EmploymentHistory:
        """Add an employment history entry to the user's profile."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundError("Profile not found.")
        data = employment_in.dict()
        data["profile_id"] = profile.id
        return await self.employment_repo.create(data)

    async def update_employment_history(
        self, user_id: int, employment_id: int, employment_in: EmploymentHistoryUpdate
    ) -> EmploymentHistory:
        """Update an employment history entry."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundError("Profile not found.")
        employment = await self.employment_repo.get(employment_id)
        if not employment or employment.profile_id != profile.id:
            raise NotFoundError("Employment history record not found.")
        return await self.employment_repo.update(
            employment, employment_in.dict(exclude_unset=True)
        )

    async def delete_employment_history(
        self, user_id: int, employment_id: int
    ) -> EmploymentHistory:
        """Delete an employment history entry."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundError("Profile not found.")
        employment = await self.employment_repo.get(employment_id)
        if not employment or employment.profile_id != profile.id:
            raise NotFoundError("Employment history record not found.")
        return await self.employment_repo.remove(employment_id)
