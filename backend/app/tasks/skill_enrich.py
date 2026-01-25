from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

import redis
from celery.utils.log import get_task_logger
from sqlalchemy import and_, or_

from app.core.celery_app import celery_app
from app.core.config import Settings, get_settings
from app.core.database import SessionLocal
from app.models.skill import Skill
from app.services.enrichment_service import generate_enrichment

logger = get_task_logger(__name__)
py_logger = logging.getLogger(__name__)

LOCK_KEY = "locks:skill_enrich"


def _get_redis(settings: Settings) -> redis.Redis | None:
    try:
        return redis.Redis.from_url(settings.redis_url, decode_responses=True)
    except Exception as exc:  # noqa: BLE001
        py_logger.warning("redis init failed: %s", exc)
        return None


def _acquire_lock(
    settings: Settings, ttl_seconds: int
) -> tuple[redis.Redis, str] | None:
    client = _get_redis(settings)
    if not client:
        return None
    token = uuid.uuid4().hex
    ok = client.set(LOCK_KEY, token, nx=True, ex=ttl_seconds)
    if not ok:
        return None
    return client, token


def _release_lock(client: redis.Redis, token: str) -> None:
    try:
        current = client.get(LOCK_KEY)
        if current == token:
            client.delete(LOCK_KEY)
    except Exception as exc:  # noqa: BLE001
        py_logger.warning("redis lock release failed: %s", exc)


@celery_app.task(name="tasks.skill_enrich")
def skill_enrich() -> int:
    settings = get_settings()
    if not settings.enable_scheduler or not settings.enable_enrichment:
        logger.info("enrichment disabled; skip")
        return 0
    if not settings.deepseek_api_key:
        logger.info("DEEPSEEK_API_KEY missing; skip enrichment")
        return 0

    lock = _acquire_lock(settings, ttl_seconds=30 * 60)
    if not lock:
        logger.info("enrichment lock busy; skip")
        return 0

    client, token = lock
    try:
        with SessionLocal() as db:
            candidates = (
                db.query(Skill)
                .filter(
                    or_(
                        Skill.content_updated_at.is_(None),
                        and_(
                            Skill.last_pushed_at.isnot(None),
                            Skill.content_updated_at.isnot(None),
                            Skill.content_updated_at < Skill.last_pushed_at,
                        ),
                    )
                )
                .order_by(Skill.content_updated_at.isnot(None), Skill.stars.desc())
                .limit(settings.enrich_batch_size)
                .all()
            )

            if not candidates:
                logger.info("no skills to enrich")
                return 0

            now = datetime.now(tz=UTC)
            updated = 0
            for skill in candidates:
                payload = generate_enrichment(skill, settings)
                if not payload:
                    continue

                skill.summary_en = payload["summary_en"]
                skill.summary_zh = payload["summary_zh"]
                skill.key_features_en = payload["key_features_en"]
                skill.key_features_zh = payload["key_features_zh"]
                skill.use_cases_en = payload["use_cases_en"]
                skill.use_cases_zh = payload["use_cases_zh"]
                skill.seo_title_en = payload["seo_title_en"]
                skill.seo_title_zh = payload["seo_title_zh"]
                skill.seo_description_en = payload["seo_description_en"]
                skill.seo_description_zh = payload["seo_description_zh"]
                skill.content_updated_at = now
                updated += 1

            if updated:
                db.commit()
            logger.info(
                "skill enrich completed: %s/%s updated", updated, len(candidates)
            )
            return updated
    except Exception as exc:  # noqa: BLE001
        logger.exception("skill enrich failed: %s", exc)
        return 0
    finally:
        _release_lock(client, token)
