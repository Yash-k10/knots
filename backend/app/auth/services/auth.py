from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository.auth import AuthRepository
from app.auth.schemas.auth import UserLogin, TokenResponse
from app.core import security
from app.core.exceptions import AuthenticationError


class AuthService:
    def __init__(self, db: AsyncSession):
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
