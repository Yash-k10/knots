from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.users.models.role import Role
from app.users.models.user import User
from app.users.repository.user import UserRepository
from app.users.schemas.user import ChangePassword, UserCreate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)

    async def create_user(self, user_in: UserCreate) -> User:
        """Create a new user with hashed password after validating email and role."""
        existing_user = await self.repository.get_by_field("email", user_in.email)
        if existing_user:
            raise ConflictError(message="Email already registered")

        # Verify role exists
        role_stmt = select(Role).filter(Role.id == user_in.role_id)
        role_result = await self.repository.db.execute(role_stmt)
        role = role_result.scalars().first()
        if not role:
            raise ValidationError(message="Role not found")

        hashed_password = security.hash_password(user_in.password)
        obj_data = user_in.model_dump(exclude={"password"})
        obj_data["hashed_password"] = hashed_password
        return await self.repository.create(obj_data)

    async def get_user(self, user_id: int) -> User:
        """Fetch user by ID or raise NotFoundError."""
        user = await self.repository.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        """List multiple users with pagination support."""
        return await self.repository.get_multi(skip=skip, limit=limit)

    async def update_user(self, user_id: int, user_in: UserUpdate) -> User:
        """Update a user's details, enforcing unique email and hashing password if updated."""
        user = await self.get_user(user_id)

        update_data = user_in.model_dump(exclude_unset=True)

        if update_data.get("email"):
            existing_user = await self.repository.get_by_field(
                "email", update_data["email"]
            )
            if existing_user and existing_user.id != user_id:
                raise ConflictError(message="Email already in use by another account")

        if update_data.get("password"):
            update_data["hashed_password"] = security.hash_password(
                update_data["password"]
            )
            del update_data["password"]
        elif "password" in update_data:
            del update_data["password"]

        return await self.repository.update(user, update_data)

    async def delete_user(self, user_id: int) -> User:
        """Remove user by ID."""
        user = await self.get_user(user_id)
        return await self.repository.remove(user.id)

    async def get_all_roles(self) -> list[Role]:
        """Fetch all available database roles."""
        result = await self.repository.db.execute(select(Role))
        return list(result.scalars().all())

    async def update_user_role(self, user_id: int, role_id: int) -> User:
        """Update user role after validating the role exists."""
        user = await self.get_user(user_id)

        # Verify role exists
        role_stmt = select(Role).filter(Role.id == role_id)
        role_result = await self.repository.db.execute(role_stmt)
        role = role_result.scalars().first()
        if not role:
            raise ValidationError(message="Role not found")

        return await self.repository.update(user, {"role_id": role_id})

    async def change_password(self, user_id: int, payload: ChangePassword) -> User:
        """Change user password after verifying the current password."""
        user = await self.get_user(user_id)

        if not security.verify_password(payload.current_password, user.hashed_password):
            raise AuthenticationError(message="Current password is incorrect")

        if payload.current_password == payload.new_password:
            raise ValidationError(
                message="New password must be different from the current password"
            )

        new_hashed = security.hash_password(payload.new_password)
        return await self.repository.update(user, {"hashed_password": new_hashed})
