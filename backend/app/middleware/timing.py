"""Timing middleware for performance monitoring."""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class TimingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track API response times.

    Features:
    - Adds X-Process-Time header with elapsed time in seconds
    - Logs slow requests (>1s) as warnings
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()

        # Process the request
        response = await call_next(request)

        # Calculate elapsed time
        process_time = time.time() - start_time

        # Add timing header
        response.headers["X-Process-Time"] = f"{process_time:.3f}"

        # Log slow requests
        if process_time > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {process_time:.2f}s"
            )

        return response
