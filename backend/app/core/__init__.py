"""
KNOTS Core Module
=================
Central infrastructure: database sessions, security utilities,
middleware, base repository pattern, and shared exception types.
"""

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_token,
)
from app.core.repository import BaseRepository
from app.core.response_models import APIResponse, PaginatedResponse
from app.core.exceptions import (
    KNOTSException,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    ConflictError,
)
from app.core.logging import get_logger

__all__ = [
    "settings",
    "get_db",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "create_verification_token",
    "decode_token",
    "BaseRepository",
    "APIResponse",
    "PaginatedResponse",
    "KNOTSException",
    "AuthenticationError",
    "AuthorizationError",
    "NotFoundError",
    "ValidationError",
    "ConflictError",
    "get_logger",
]
