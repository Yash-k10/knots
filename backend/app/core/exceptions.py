from typing import Any, Optional
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class KNOTSException(Exception):
    """Base exception for all system-related failures in KNOTS."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class AuthenticationError(KNOTSException):
    def __init__(
        self, message: str = "Authentication failed", details: Optional[Any] = None
    ):
        super().__init__(message, "UNAUTHORIZED", 401, details)


class AuthorizationError(KNOTSException):
    def __init__(
        self, message: str = "Permission denied", details: Optional[Any] = None
    ):
        super().__init__(message, "FORBIDDEN", 403, details)


class NotFoundError(KNOTSException):
    def __init__(
        self, message: str = "Resource not found", details: Optional[Any] = None
    ):
        super().__init__(message, "NOT_FOUND", 404, details)


class ValidationError(KNOTSException):
    def __init__(
        self, message: str = "Validation failed", details: Optional[Any] = None
    ):
        super().__init__(message, "VALIDATION_ERROR", 422, details)


def register_exception_handlers(app: FastAPI):
    """
    Register all exception handlers for the FastAPI app.
    Standardizes error responses to match:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable error message",
            "details": {}
        }
    }
    """

    @app.exception_handler(KNOTSException)
    async def knots_exception_handler(request: Request, exc: KNOTSException):
        logger.error(
            f"KNOTSException occurred: {exc.code} - {exc.message}", exc_info=True
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTPException: {exc.status_code} - {exc.detail}")
        # Standardize standard HTTP Exceptions (like default FastAPI 404s, etc.)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {"code": "HTTP_ERROR", "message": exc.detail, "details": None},
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        logger.warning(f"Validation error: {exc.errors()}")
        errors_list = []
        for error in exc.errors():
            errors_list.append(
                {
                    "field": (
                        ".".join([str(loc) for loc in error["loc"][1:]])
                        if len(error["loc"]) > 1
                        else str(error["loc"][0])
                    ),
                    "message": error["msg"],
                    "type": error["type"],
                }
            )

        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed.",
                    "details": errors_list,
                },
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please contact system support.",
                    "details": (
                        str(exc) if settings.ENVIRONMENT == "development" else None
                    ),
                },
            },
        )
