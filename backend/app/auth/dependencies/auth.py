from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository.auth import AuthRepository
from app.core import security
from app.core.cache import user_cache
from app.core.database import get_db
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.users.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def invalidate_user_cache(user_id: int) -> None:
    """Invalidate cached user instance upon updates."""
    user_cache.delete(f"user:{user_id}")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    """FastAPI dependency to retrieve the currently logged in user with sub-millisecond caching."""
    payload = security.decode_token(token, expected_type="access")
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token subject credentials")

    cache_key = f"user:{user_id}"
    cached_user = user_cache.get(cache_key)
    if cached_user is not None:
        return cached_user

    repo = AuthRepository(db)
    user = await repo.get(int(user_id))
    if not user:
        raise AuthenticationError("User not found")
    if not user.is_active:
        raise AuthenticationError("User is inactive")

    user_cache.set(cache_key, user, ttl_seconds=60.0)
    return user


ROLE_ID_MAP = {
    1: "super admin",
    2: "admin",
    3: "student",
    4: "alumni",
    5: "recruiter",
    6: "faculty",
    7: "management",
    8: "controller",
    9: "central admin",
    10: "hod",
    11: "tpo",
    12: "dean",
    13: "principal",
    14: "ceo",
}


class RoleRequired:
    """Dependency checker for Role-Based Access Control."""

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role_id = current_user.role_id
        role_name = ""
        if "role" in current_user.__dict__ and current_user.__dict__["role"]:
            role_name = getattr(current_user.__dict__["role"], "name", "")
        elif role_id in ROLE_ID_MAP:
            role_name = ROLE_ID_MAP[role_id]
        else:
            try:
                role_name = current_user.role.name if current_user.role else ""
            except Exception:
                pass

        if not role_name and role_id is None:
            raise AuthorizationError("User role not initialized")

        role_lower = role_name.lower().strip()
        allowed_lower = [r.lower().strip() for r in self.allowed_roles]

        # Super Admin and Central Admin have master access across all role-protected endpoints
        if role_lower in (
            "super admin",
            "superadmin",
            "central admin",
            "central_admin",
        ):
            return current_user

        # Admin checks
        is_admin_check = "admin" in allowed_lower and (
            role_id == 1 or role_lower in ("admin", "central admin", "central_admin")
        )

        if not is_admin_check and role_lower not in allowed_lower:
            raise AuthorizationError(
                f"Role not authorized. Required one of: {self.allowed_roles}"
            )
        return current_user


class PermissionRequired:
    """Dependency checker for granular Permission-Based Access Control."""

    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role = current_user.__dict__.get("role")
        if not role:
            try:
                role = current_user.role
            except Exception:
                role = None
        role_name = (getattr(role, "name", "") or "").lower().strip()
        role_id = getattr(current_user, "role_id", None)

        # Super Admin or Central Admin bypasses all granular permission checks
        if role_id in (1, 9) or role_name in (
            "super admin",
            "superadmin",
            "central admin",
            "central_admin",
        ):
            return current_user

        if not role:
            raise AuthorizationError("User role permissions not initialized")
        permissions = getattr(role, "permissions", None) or []

        # Wildcard bypass
        if "*" in permissions or "superadmin_access" in permissions:
            return current_user

        if self.required_permission not in permissions:
            raise AuthorizationError(
                f"Permission denied: missing {self.required_permission}"
            )
        return current_user
