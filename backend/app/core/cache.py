"""Cache control utilities for HTTP responses."""

from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import Response


def cache_control(max_age: int) -> Callable:
    """
    Decorator to add Cache-Control header to FastAPI responses.

    Args:
        max_age: Cache duration in seconds

    Usage:
        @router.get("/endpoint")
        @cache_control(3600)  # Cache for 1 hour
        async def my_endpoint(response: Response):
            return {"data": "value"}
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract response from kwargs
            response: Response | None = kwargs.get("response")
            if response:
                response.headers["Cache-Control"] = f"public, max-age={max_age}"
            result = await func(*args, **kwargs)
            return result

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract response from kwargs
            response: Response | None = kwargs.get("response")
            if response:
                response.headers["Cache-Control"] = f"public, max-age={max_age}"
            result = func(*args, **kwargs)
            return result

        # Return appropriate wrapper based on whether function is async
        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator
