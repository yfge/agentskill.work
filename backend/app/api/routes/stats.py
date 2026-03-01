from fastapi import APIRouter, Depends, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.cache import cache_control
from app.core.database import get_db
from app.models.skill import Skill

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/coverage")
@cache_control(300)
def coverage(response: Response, db: Session = Depends(get_db)) -> dict:
    total = db.query(func.count(Skill.id)).scalar() or 0
    with_desc_zh = (
        db.query(func.count(Skill.id))
        .filter(Skill.description_zh.isnot(None), Skill.description_zh != "")
        .scalar()
        or 0
    )
    with_summary_zh = (
        db.query(func.count(Skill.id))
        .filter(Skill.summary_zh.isnot(None), Skill.summary_zh != "")
        .scalar()
        or 0
    )
    with_seo_zh = (
        db.query(func.count(Skill.id))
        .filter(Skill.seo_title_zh.isnot(None), Skill.seo_title_zh != "")
        .scalar()
        or 0
    )
    return {
        "total": total,
        "description_zh": with_desc_zh,
        "summary_zh": with_summary_zh,
        "seo_title_zh": with_seo_zh,
        "description_zh_pct": round(with_desc_zh / total * 100, 1) if total else 0,
        "summary_zh_pct": round(with_summary_zh / total * 100, 1) if total else 0,
        "seo_title_zh_pct": round(with_seo_zh / total * 100, 1) if total else 0,
    }
