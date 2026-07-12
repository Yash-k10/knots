from sqlalchemy.ext.asyncio import AsyncSession
from app.profiles.repository.profile import ProfileRepository
from app.profiles.schemas.profile import ProfileUpdate
from app.profiles.models.profile import Profile


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.repository = ProfileRepository(db)

    async def update_profile(self, user_id: int, profile_in: ProfileUpdate) -> Profile:
        # Check if profile exists, if not create one, else update
        # For boilerplate, just mock the fetch or create
        profile = await self.repository.get(user_id)
        if not profile:
            data = profile_in.dict()
            data["user_id"] = user_id
            return await self.repository.create(data)
        return await self.repository.update(
            profile, profile_in.dict(exclude_unset=True)
        )
