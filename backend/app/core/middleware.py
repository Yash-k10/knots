import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that records endpoint execution time and logs
    all requests for audit and profiling.
    """

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log request receipt
        logger.info(f"Started {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)

            logger.info(
                f"Finished {request.method} {request.url.path} "
                f"Status: {response.status_code} "
                f"Duration: {process_time:.4f}s"
            )
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Failed {request.method} {request.url.path} "
                f"Duration: {process_time:.4f}s - Error: {str(e)}",
                exc_info=True,
            )
            raise


def register_middlewares(app: FastAPI):
    """Register all middlewares on the FastAPI application."""
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Audit & Process time logging middleware
    app.add_middleware(RequestLoggingMiddleware)
