import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique Request ID (UUID4) to every incoming
    request and attaches it as an ``X-Request-ID`` response header.
    This enables distributed tracing and log correlation across services.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        # Store on request state so other middleware / handlers can access it
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that records endpoint execution time and logs
    all requests for audit and profiling.
    """

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "N/A")

        # Log request receipt
        logger.info(f"[{request_id}] Started {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)

            logger.info(
                f"[{request_id}] Finished {request.method} {request.url.path} "
                f"Status: {response.status_code} "
                f"Duration: {process_time:.4f}s"
            )
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"[{request_id}] Failed {request.method} {request.url.path} "
                f"Duration: {process_time:.4f}s - Error: {e!s}",
                exc_info=True,
            )
            raise


def register_middlewares(app: FastAPI):
    """Register all middlewares on the FastAPI application.

    Middleware execution order is bottom-to-top (last added runs first),
    so CORSMiddleware is added last to run outermost and ensure that all
    responses (including 4xx/5xx error responses) always have proper CORS headers.
    """
    # Audit & Process time logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    # Request ID middleware (assigns request ID before logging)
    app.add_middleware(RequestIDMiddleware)

    # CORS Middleware (outermost, added last to wrap all responses)
    origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
