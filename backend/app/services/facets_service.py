from __future__ import annotations

import json
import logging
from collections import Counter

import redis
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.skill import Skill

logger = logging.getLogger(__name__)


def _normalize(value: str | None) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    return trimmed or None


def _get_redis_client(settings: Settings) -> redis.Redis | None:
    """Get Redis client instance."""
    try:
        return redis.Redis.from_url(settings.redis_url, decode_responses=True)
    except Exception as exc:  # noqa: BLE001
        logger.warning("redis init failed: %s", exc)
        return None


def list_top_languages(db: Session, limit: int) -> list[tuple[str, int]]:
    """List top languages using SQL GROUP BY for optimal performance."""
    stmt = (
        select(Skill.language, func.count().label("count"))
        .where(Skill.language.isnot(None))
        .where(Skill.language != "")
        .group_by(Skill.language)
        .order_by(func.count().desc())
        .limit(limit)
    )
    result = db.execute(stmt).all()
    return [(row.language, row.count) for row in result]


def list_top_owners(db: Session, limit: int) -> list[tuple[str, int]]:
    """List top owners using SQL SUBSTRING_INDEX for optimal performance."""
    # Use SQL function to extract owner prefix before '/'
    stmt = (
        select(
            func.substring_index(Skill.full_name, "/", 1).label("owner"),
            func.count().label("count"),
        )
        .where(Skill.full_name.isnot(None))
        .where(Skill.full_name != "")
        .group_by("owner")
        .order_by(func.count().desc())
        .limit(limit)
    )
    result = db.execute(stmt).all()
    return [(row.owner, row.count) for row in result]


def list_top_topics(
    db: Session, limit: int, settings: Settings | None = None
) -> list[tuple[str, int]]:
    """
    List top topics using Python processing with Redis caching.

    Note: This requires Python processing because topics are stored as
    comma-separated strings. For better performance, consider normalizing
    to a skill_topics join table in the future.
    """
    # Try to get from cache first
    cache_key = f"facets:topics:{limit}"
    if settings:
        client = _get_redis_client(settings)
        if client:
            try:
                cached = client.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to get topics from cache: %s", exc)

    # Compute from database
    rows = db.execute(select(Skill.topics)).scalars().all()
    counter: Counter[str] = Counter()
    for topics in rows:
        value = _normalize(topics)
        if not value:
            continue
        for topic in value.split(","):
            item = topic.strip()
            if not item:
                continue
            counter[item] += 1
    result = counter.most_common(limit)

    # Cache the result for 1 hour
    if settings and client:
        try:
            client.setex(cache_key, 3600, json.dumps(result))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to cache topics: %s", exc)

    return result
