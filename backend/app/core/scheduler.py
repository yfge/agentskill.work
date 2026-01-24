import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import Settings
from app.core.database import SessionLocal
from app.services.github_service import sync_github_skills


logger = logging.getLogger(__name__)


def _run_sync(settings: Settings) -> None:
    try:
        with SessionLocal() as db:
            sync_github_skills(db, settings)
    except Exception as exc:  # noqa: BLE001
        logger.exception("github sync failed: %s", exc)


def start_scheduler(settings: Settings) -> BackgroundScheduler | None:
    if not settings.enable_scheduler:
        return None

    scheduler = BackgroundScheduler()
    next_run_time = None
    if settings.sync_on_start:
        next_run_time = datetime.now(timezone.utc)

    scheduler.add_job(
        _run_sync,
        "interval",
        minutes=settings.sync_interval_minutes,
        args=[settings],
        id="github_sync",
        replace_existing=True,
        next_run_time=next_run_time,
    )

    scheduler.start()
    return scheduler


def shutdown_scheduler(scheduler: BackgroundScheduler | None) -> None:
    if scheduler:
        scheduler.shutdown(wait=False)
