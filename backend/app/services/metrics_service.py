import logging

import redis

from app.core.config import Settings

logger = logging.getLogger(__name__)

PV_KEY = "metrics:pv"
UV_KEY = "metrics:uv"
SKILL_PV_KEY = "metrics:skill:{skill_id}:pv"
SKILL_UV_KEY = "metrics:skill:{skill_id}:uv"


def _get_client(settings: Settings) -> redis.Redis | None:
    try:
        return redis.Redis.from_url(settings.redis_url, decode_responses=True)
    except Exception as exc:  # noqa: BLE001
        logger.warning("redis init failed: %s", exc)
        return None


def track_visit(settings: Settings, visitor_id: str | None) -> None:
    client = _get_client(settings)
    if not client:
        return
    try:
        pipe = client.pipeline()
        pipe.incr(PV_KEY, 1)
        pipe.expire(PV_KEY, 86400 * 365)  # Retain PV for 1 year
        if visitor_id:
            pipe.sadd(UV_KEY, visitor_id)
            pipe.expire(UV_KEY, 86400 * 30)  # Retain UV for 30 days
        pipe.execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("track visit failed: %s", exc)


def get_metrics(settings: Settings) -> tuple[int, int]:
    client = _get_client(settings)
    if not client:
        return 0, 0
    try:
        pv = int(client.get(PV_KEY) or 0)
        uv = int(client.scard(UV_KEY))
        return pv, uv
    except Exception as exc:  # noqa: BLE001
        logger.warning("get metrics failed: %s", exc)
        return 0, 0


def track_skill_visit(
    settings: Settings, skill_id: int, visitor_id: str | None
) -> None:
    client = _get_client(settings)
    if not client:
        return
    try:
        pipe = client.pipeline()
        pv_key = SKILL_PV_KEY.format(skill_id=skill_id)
        uv_key = SKILL_UV_KEY.format(skill_id=skill_id)
        pipe.incr(pv_key, 1)
        pipe.expire(pv_key, 86400 * 365)  # Retain skill PV for 1 year
        if visitor_id:
            pipe.sadd(uv_key, visitor_id)
            pipe.expire(uv_key, 86400 * 30)  # Retain skill UV for 30 days
        pipe.execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("track skill visit failed: %s", exc)
