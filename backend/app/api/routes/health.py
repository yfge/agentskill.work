from fastapi import APIRouter, Response

from app.core.cache import cache_control

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
@cache_control(60)  # Cache for 1 minute
def health(response: Response) -> dict:
    return {"status": "ok"}
