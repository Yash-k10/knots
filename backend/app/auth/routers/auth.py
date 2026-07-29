from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies.auth import get_current_user
from app.auth.schemas.auth import (
    RegistrationResponse,
    TokenRefreshRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserRegisterResponse,
)
from app.auth.services.auth import AuthService
from app.core.database import get_db
from app.core.response_models import APIResponse
from app.users.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[RegistrationResponse])
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and generate a verification token."""
    service = AuthService(db)
    registration_data = await service.register_user(payload)
    return APIResponse(
        message="User registered successfully. Verification token generated.",
        data=registration_data,
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return access and refresh tokens."""
    service = AuthService(db)
    tokens = await service.authenticate_user(credentials)
    return APIResponse(message="Login successful", data=tokens)


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh(payload: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh an access token using a refresh token."""
    service = AuthService(db)
    tokens = await service.refresh_tokens(payload.refresh_token)
    return APIResponse(message="Token refresh successful", data=tokens)


@router.get("/verify-email", response_model=APIResponse[UserRegisterResponse])
async def verify_email(
    token: str = Query(..., description="The email verification JWT token"),
    db: AsyncSession = Depends(get_db),
):
    """Verify email address using verification token."""
    service = AuthService(db)
    user = await service.verify_email(token)
    return APIResponse(message="Email verified successfully", data=user)


@router.post("/logout", response_model=APIResponse[None])
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout the current user session."""
    service = AuthService(db)
    await service.logout_user(current_user.id)
    return APIResponse(message="Logout successful")
