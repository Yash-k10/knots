"""
KNOTS Core Module
=================
Central infrastructure: database sessions, security utilities,
middleware, base repository pattern, and shared exception types.
"""

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    KNOTSException,
    NotFoundError,
    ValidationError,
)
from app.core.logging import get_logger
from app.core.repository import BaseRepository
from app.core.response_models import APIResponse, PaginatedResponse
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_token,
    hash_password,
    verify_password,
)

__all__ = [
    "APIResponse",
    "AuthenticationError",
    "AuthorizationError",
    "BaseRepository",
    "ConflictError",
    "KNOTSException",
    "NotFoundError",
    "PaginatedResponse",
    "ValidationError",
    "create_access_token",
    "create_refresh_token",
    "create_verification_token",
    "decode_token",
    "get_db",
    "get_logger",
    "hash_password",
    "settings",
    "verify_password",
]
