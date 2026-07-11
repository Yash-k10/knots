from sqlalchemy.ext.asyncio import AsyncSession
from app.users.repository.user import UserRepository
from app.users.schemas.user import UserCreate
from app.core import security
from app.users.models.user import User


class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)

    async def create_user(self, user_in: UserCreate) -> User:
        """Create a new user with hashed password."""
        hashed_password = security.hash_password(user_in.password)
        obj_data = user_in.dict(exclude={"password"})
        obj_data["hashed_password"] = hashed_password
        return await self.repository.create(obj_data)

    async def get_user(self, user_id: int) -> User:
        return await self.repository.get(user_id)
