from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository.auth import AuthRepository
from app.core import security
from app.core.database import get_db
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.users.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    """FastAPI dependency to retrieve the currently logged in user."""
    payload = security.decode_token(token, expected_type="access")
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token subject credentials")

    repo = AuthRepository(db)
    user = await repo.get(int(user_id))
    if not user:
        raise AuthenticationError("User not found")
    if not user.is_active:
        raise AuthenticationError("User is inactive")

    return user


class RoleRequired:
    """Dependency checker for Role-Based Access Control."""

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role_name = current_user.role.name if current_user.role else ""
        role_id = current_user.role_id

        if not role_name and role_id is None:
            raise AuthorizationError("User role not initialized")

        role_lower = role_name.lower().strip()
        allowed_lower = [r.lower().strip() for r in self.allowed_roles]

        # Super Admin has master access across all role-protected endpoints
        if role_lower in ("super admin", "superadmin"):
            return current_user

        # Admin checks
        is_admin_check = "admin" in allowed_lower and (
            role_id == 1 or role_lower == "admin"
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
        if not current_user.role:
            raise AuthorizationError("User role permissions not initialized")
        permissions = current_user.role.permissions or []
        role_name = (current_user.role.name or "").lower().strip()

        # Super Admin or universal wildcard '*' bypasses all granular permission checks
        if (
            "*" in permissions
            or "superadmin_access" in permissions
            or role_name in ("super admin", "superadmin")
        ):
            return current_user

        if self.required_permission not in permissions:
            raise AuthorizationError(
                f"Permission denied: missing {self.required_permission}"
            )
        return current_user
