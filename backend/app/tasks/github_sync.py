from celery.utils.log import get_task_logger

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services.github_service import sync_github_skills

logger = get_task_logger(__name__)


@celery_app.task(name="tasks.github_sync")
def github_sync() -> int:
    settings = get_settings()
    if not settings.enable_scheduler:
        logger.info("scheduler disabled; skip github sync")
        return 0

    try:
        with SessionLocal() as db:
            count = sync_github_skills(db, settings)
        logger.info("github sync completed: %s repos", count)
        return count
    except Exception as exc:  # noqa: BLE001
        logger.exception("github sync failed: %s", exc)
        return 0
