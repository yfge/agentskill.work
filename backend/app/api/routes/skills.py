from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.skill import SkillList, SkillOut
from app.services.github_service import sync_github_skills
from app.services.skill_service import get_skill_by_full_name, search_skills

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=SkillList)
def list_skills(
    q: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),  # noqa: B008
):
    total, items = search_skills(db, q, limit, offset)
    return SkillList(total=total, items=items)


@router.get("/{owner}/{repo}", response_model=SkillOut)
def read_skill(
    owner: str,
    repo: str,
    db: Session = Depends(get_db),  # noqa: B008
) -> SkillOut:
    full_name = f"{owner}/{repo}"
    skill = get_skill_by_full_name(db, full_name)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.post("/sync")
def sync_skills(
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
) -> dict:
    settings = get_settings()
    if not settings.sync_api_enabled:
        raise HTTPException(status_code=404, detail="Not found")
    if settings.sync_api_token:
        token = request.headers.get("X-Sync-Token")
        if token != settings.sync_api_token:
            raise HTTPException(status_code=403, detail="Forbidden")
    count = sync_github_skills(db, settings)
    return {"synced": count}
