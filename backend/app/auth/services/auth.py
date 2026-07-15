from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository.auth import AuthRepository
from app.auth.schemas.auth import (
    UserLogin,
    TokenResponse,
    UserRegister,
    RegistrationResponse,
)
from app.core import security
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    ValidationError,
    NotFoundError,
)
from app.users.models.user import User
from app.users.models.role import Role


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AuthRepository(db)

    async def authenticate_user(self, credentials: UserLogin) -> TokenResponse:
        """Authenticate user and generate access & refresh tokens."""
        user = await self.repository.get_by_email(credentials.email)
        if not user or not security.verify_password(
            credentials.password, user.hashed_password
        ):
            raise AuthenticationError(message="Invalid email or password")

        if not user.is_active:
            raise AuthenticationError(message="Inactive account")

        access_token = security.create_access_token(subject=user.id)
        refresh_token = security.create_refresh_token(subject=user.id)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Verify refresh token and issue new access & refresh tokens."""
        payload = security.decode_token(refresh_token, expected_type="refresh")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token claim")

        user = await self.repository.get(int(user_id))
        if not user or not user.is_active:
            raise AuthenticationError("Inactive or invalid user")

        new_access = security.create_access_token(subject=user.id)
        new_refresh = security.create_refresh_token(subject=user.id)

        return TokenResponse(access_token=new_access, refresh_token=new_refresh)

    async def register_user(self, user_in: UserRegister) -> RegistrationResponse:
        """Register a new user in the system with is_verified=False."""
        existing_user = await self.repository.get_by_email(user_in.email)
        if existing_user:
            raise ConflictError(message="Email already registered")

        # Verify role exists
        role_stmt = select(Role).filter(Role.id == user_in.role_id)
        role_result = await self.db.execute(role_stmt)
        role = role_result.scalars().first()
        if not role:
            raise ValidationError(message="Role not found")

        # Hash password and create user
        hashed_password = security.hash_password(user_in.password)
        user_data = {
            "email": user_in.email,
            "hashed_password": hashed_password,
            "role_id": user_in.role_id,
            "is_active": True,
            "is_verified": False,
        }
        user = await self.repository.create(user_data)

        # Generate email verification token
        verification_token = security.create_verification_token(subject=user.id)

        return RegistrationResponse(user=user, verification_token=verification_token)

    async def verify_email(self, token: str) -> User:
        """Verify user's email using a verification token."""
        payload = security.decode_token(token, expected_type="verification")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError(message="Invalid token claim")

        user = await self.repository.get(int(user_id))
        if not user:
            raise NotFoundError(message="User not found")

        if user.is_verified:
            return user

        user.is_verified = True
        self.db.add(user)
        await self.db.flush()
        return user

    async def logout_user(self, user_id: int) -> None:
        """Stateless logout (placeholder for token blacklisting)."""
        pass
