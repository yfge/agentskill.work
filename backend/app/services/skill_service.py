from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.skill import Skill


def search_skills(
    db: Session, query: str | None, limit: int = 20, offset: int = 0
) -> tuple[int, list[Skill]]:
    stmt = select(Skill)

    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where(
            func.lower(Skill.name).like(q)
            | func.lower(Skill.full_name).like(q)
            | func.lower(Skill.description).like(q)
            | func.lower(Skill.description_zh).like(q)
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()
    items = (
        db.execute(stmt.order_by(Skill.stars.desc()).offset(offset).limit(limit))
        .scalars()
        .all()
    )

    return total, items
