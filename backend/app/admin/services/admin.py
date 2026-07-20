from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.repository.admin import AdminRepository
from app.admin.models.audit import AuditLog
from app.users.models.user import User
from app.users.repository.user import UserRepository
from app.core.exceptions import NotFoundError


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AdminRepository(db)

    async def get_audit_logs(self, skip: int = 0, limit: int = 100) -> list[AuditLog]:
        return await self.repository.get_multi(skip=skip, limit=limit)

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        user_repo = UserRepository(self.db)
        return await user_repo.get_multi(skip=skip, limit=limit)

    async def ban_user(
        self, user_id: int, actor_id: int, ip_address: Optional[str] = None
    ) -> User:
        user_repo = UserRepository(self.db)
        user = await user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        user = await user_repo.update(user, {"is_active": False})

        # Log audit trail
        await self.repository.create(
            {
                "actor_id": actor_id,
                "action": "ban_user",
                "target": f"User ID: {user_id}, Email: {user.email}",
                "ip_address": ip_address,
            }
        )
        return user

    async def unban_user(
        self, user_id: int, actor_id: int, ip_address: Optional[str] = None
    ) -> User:
        user_repo = UserRepository(self.db)
        user = await user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        user = await user_repo.update(user, {"is_active": True})

        # Log audit trail
        await self.repository.create(
            {
                "actor_id": actor_id,
                "action": "unban_user",
                "target": f"User ID: {user_id}, Email: {user.email}",
                "ip_address": ip_address,
            }
        )
        return user

    async def delete_user(
        self, user_id: int, actor_id: int, ip_address: Optional[str] = None
    ) -> User:
        user_repo = UserRepository(self.db)
        user = await user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        email = user.email
        await user_repo.remove(user.id)

        # Log audit trail
        await self.repository.create(
            {
                "actor_id": actor_id,
                "action": "delete_user",
                "target": f"User ID: {user_id}, Email: {email}",
                "ip_address": ip_address,
            }
        )
        return user
