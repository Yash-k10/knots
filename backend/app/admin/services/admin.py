from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.repository.admin import AdminRepository, FlaggedPostRepository
from app.admin.models.audit import AuditLog
from app.admin.models.flagged_post import FlaggedPost
from app.users.models.user import User
from app.users.repository.user import UserRepository
from app.posts.repository.post import PostRepository
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

    async def flag_post(
        self, post_id: int, flagger_id: int, reason: Optional[str] = None
    ) -> FlaggedPost:
        post_repo = PostRepository(self.db)
        post = await post_repo.get(post_id)
        if not post:
            raise NotFoundError(message="Post not found")

        flagged_repo = FlaggedPostRepository(self.db)
        flagged_post = await flagged_repo.create(
            {
                "post_id": post_id,
                "flagger_id": flagger_id,
                "reason": reason,
                "status": "pending",
            }
        )

        # Log audit trail
        await self.repository.create(
            {
                "actor_id": flagger_id,
                "action": "flag_post",
                "target": f"Post ID: {post_id}, Reason: {reason}",
            }
        )
        return flagged_post

    async def list_flagged_posts(
        self, skip: int = 0, limit: int = 100
    ) -> list[FlaggedPost]:
        flagged_repo = FlaggedPostRepository(self.db)
        return await flagged_repo.get_flagged_posts_with_details(skip=skip, limit=limit)

    async def resolve_flag(
        self, flag_id: int, action: str, actor_id: int
    ) -> FlaggedPost:
        if action not in ["resolved", "dismissed"]:
            raise ValueError("Invalid resolution action")

        flagged_repo = FlaggedPostRepository(self.db)
        flag = await flagged_repo.get(flag_id)
        if not flag:
            raise NotFoundError(message="Flagged post record not found")

        flag = await flagged_repo.update(flag, {"status": action})

        # Log audit trail
        await self.repository.create(
            {
                "actor_id": actor_id,
                "action": f"resolve_flag_{action}",
                "target": f"Flag ID: {flag_id}, Post ID: {flag.post_id}",
            }
        )
        return flag

    async def remove_post(
        self, post_id: int, actor_id: int, ip_address: Optional[str] = None
    ) -> None:
        post_repo = PostRepository(self.db)
        post = await post_repo.get(post_id)
        if not post:
            raise NotFoundError(message="Post not found")

        author_id = post.author_id

        # Delete the post
        await post_repo.remove(post_id)

        # Log audit trail
        await self.repository.create(
            {
                "actor_id": actor_id,
                "action": "remove_post",
                "target": f"Post ID: {post_id}, Author ID: {author_id}",
                "ip_address": ip_address,
            }
        )
