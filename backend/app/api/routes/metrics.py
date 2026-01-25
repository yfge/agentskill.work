from fastapi import APIRouter, Header

from app.core.config import get_settings
from app.schemas.metrics import MetricsOut
from app.services.metrics_service import get_metrics, track_skill_visit, track_visit

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.post("/track")
def track_metrics(x_visitor_id: str | None = Header(default=None)) -> dict:
    settings = get_settings()
    track_visit(settings, x_visitor_id)
    return {"ok": True}


@router.post("/skills/{skill_id}/track")
def track_skill_metrics(
    skill_id: int, x_visitor_id: str | None = Header(default=None)
) -> dict:
    settings = get_settings()
    track_skill_visit(settings, skill_id, x_visitor_id)
    return {"ok": True}


@router.get("", response_model=MetricsOut)
def read_metrics() -> MetricsOut:
    settings = get_settings()
    pv, uv = get_metrics(settings)
    return MetricsOut(pv=pv, uv=uv)
