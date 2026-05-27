from __future__ import annotations

from celery.utils.log import get_task_logger

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services.repository_inspection_service import inspect_stale_skill_repositories

logger = get_task_logger(__name__)


@celery_app.task(name="tasks.repository_inspect")
def repository_inspect() -> int:
    settings = get_settings()
    if not settings.enable_scheduler or not settings.enable_repository_inspection:
        logger.info("repository inspection disabled; skip")
        return 0

    try:
        with SessionLocal() as db:
            count = inspect_stale_skill_repositories(db, settings)
        logger.info("repository inspection completed: %s repos", count)
        return count
    except Exception as exc:  # noqa: BLE001
        logger.exception("repository inspection failed: %s", exc)
        return 0
