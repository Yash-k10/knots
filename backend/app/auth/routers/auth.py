from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas.auth import UserLogin, TokenResponse, TokenRefreshRequest
from app.auth.services.auth import AuthService
from app.core.database import get_db
from app.core.response_models import APIResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate a user and return access and refresh tokens."""
    service = AuthService(db)
    tokens = await service.authenticate_user(credentials)
    return APIResponse(message="Login successful", data=tokens)


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh(
    payload: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh an access token using a refresh token."""
    service = AuthService(db)
    tokens = await service.refresh_tokens(payload.refresh_token)
    return APIResponse(message="Token refresh successful", data=tokens)
