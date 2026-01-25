import sys
from datetime import timedelta

from celery import Celery
from celery.signals import beat_init

from app.core.config import get_settings


def _running_under_pytest() -> bool:
    return "pytest" in sys.modules


def _get_broker_url() -> str:
    settings = get_settings()
    if _running_under_pytest():
        return "memory://"
    return settings.celery_broker_url or settings.redis_url


def _get_backend_url() -> str:
    settings = get_settings()
    if _running_under_pytest():
        return "cache+memory://"
    return settings.celery_result_backend or settings.redis_url


celery_app = Celery(
    "agentskill",
    broker=_get_broker_url(),
    backend=_get_backend_url(),
)

settings = get_settings()

beat_schedule: dict[str, object] = {}
if settings.enable_scheduler:
    beat_schedule["github-sync-schedule"] = {
        "task": "tasks.github_sync",
        "schedule": timedelta(minutes=settings.sync_interval_minutes),
    }
    if settings.enable_enrichment:
        beat_schedule["skill-enrich-schedule"] = {
            "task": "tasks.skill_enrich",
            "schedule": timedelta(minutes=settings.enrich_interval_minutes),
        }

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_acks_late=True,
    worker_max_tasks_per_child=100,
    beat_schedule=beat_schedule,
)


@beat_init.connect
def _trigger_sync_on_start(**_kwargs):  # type: ignore[no-untyped-def]
    if not settings.enable_scheduler or not settings.sync_on_start:
        return
    celery_app.send_task("tasks.github_sync", countdown=30)


if _running_under_pytest():
    celery_app.conf.update(
        task_always_eager=True,
        task_store_eager_result=False,
    )


import app.tasks.github_sync  # noqa: E402,F401
import app.tasks.skill_enrich  # noqa: E402,F401
