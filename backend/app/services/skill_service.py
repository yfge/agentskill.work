from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.skill import Skill


def search_skills(
    db: Session,
    query: str | None,
    topic: str | None = None,
    language: str | None = None,
    owner: str | None = None,
    sort: str = "stars",
    limit: int = 20,
    offset: int = 0,
) -> tuple[int, list[Skill]]:
    stmt = select(Skill)

    full_name_lc = func.lower(Skill.full_name)
    language_lc = func.lower(func.coalesce(Skill.language, ""))
    topics_lc = func.lower(func.coalesce(Skill.topics, ""))

    if query:
        q = f"%{query.lower()}%"
        name_lc = func.lower(Skill.name)
        desc_lc = func.lower(func.coalesce(Skill.description, ""))
        desc_zh_lc = func.lower(func.coalesce(Skill.description_zh, ""))
        stmt = stmt.where(
            name_lc.like(q)
            | full_name_lc.like(q)
            | desc_lc.like(q)
            | desc_zh_lc.like(q)
            | topics_lc.like(q)
        )

    if owner:
        owner_value = owner.strip().lower()
        if owner_value:
            stmt = stmt.where(full_name_lc.like(f"{owner_value}/%"))

    if language:
        language_value = language.strip().lower()
        if language_value:
            stmt = stmt.where(language_lc == language_value)

    if topic:
        topic_value = topic.strip().lower()
        if topic_value:
            # Topics are stored as a comma-separated string without spaces.
            stmt = stmt.where(
                (topics_lc == topic_value)
                | (topics_lc.like(f"{topic_value},%"))
                | (topics_lc.like(f"%,{topic_value}"))
                | (topics_lc.like(f"%,{topic_value},%"))
            )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    order_by = Skill.stars.desc()
    if sort == "newest":
        order_by = func.coalesce(Skill.repo_created_at, Skill.created_at).desc()

    items = (
        db.execute(stmt.order_by(order_by, Skill.id.desc()).offset(offset).limit(limit))
        .scalars()
        .all()
    )

    return total, items


def get_skill_by_full_name(db: Session, full_name: str) -> Skill | None:
    return (
        db.query(Skill).filter(func.lower(Skill.full_name) == full_name.lower()).first()
    )


def get_related_skills(db: Session, skill: Skill, limit: int = 6) -> list[Skill]:
    """Return skills related to *skill* using a weighted scoring algorithm.

    Scoring:
      - Each overlapping topic: +3
      - Same primary language: +2
      - Same owner: +1

    The candidate set is pre-filtered in SQL (same topic OR same language OR
    same owner) to keep the working set small, then scored in Python.
    """
    topics = {t.strip().lower() for t in (skill.topics or "").split(",") if t.strip()}
    language = (skill.language or "").strip().lower()
    owner = skill.full_name.split("/")[0].lower() if "/" in skill.full_name else ""

    # Build SQL pre-filter: must share at least one dimension with the source.
    full_name_lc = func.lower(Skill.full_name)
    language_lc = func.lower(func.coalesce(Skill.language, ""))
    topics_lc = func.lower(func.coalesce(Skill.topics, ""))

    conditions = []
    for topic in topics:
        conditions.append(
            (topics_lc == topic)
            | (topics_lc.like(f"{topic},%"))
            | (topics_lc.like(f"%,{topic}"))
            | (topics_lc.like(f"%,{topic},%"))
        )
    if language:
        conditions.append(language_lc == language)
    if owner:
        conditions.append(full_name_lc.like(f"{owner}/%"))

    if not conditions:
        return []

    from sqlalchemy import or_

    stmt = (
        select(Skill)
        .where(Skill.id != skill.id)
        .where(or_(*conditions))
        .order_by(Skill.stars.desc())
        .limit(100)
    )
    candidates: list[Skill] = list(db.execute(stmt).scalars().all())

    # Score each candidate.
    scored: list[tuple[int, int, Skill]] = []
    for candidate in candidates:
        score = 0
        c_topics = {
            t.strip().lower() for t in (candidate.topics or "").split(",") if t.strip()
        }
        score += len(topics & c_topics) * 3
        if language and (candidate.language or "").strip().lower() == language:
            score += 2
        c_owner = (
            candidate.full_name.split("/")[0].lower()
            if "/" in candidate.full_name
            else ""
        )
        if owner and c_owner == owner:
            score += 1
        if score > 0:
            scored.append((score, candidate.stars, candidate))

    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [item[2] for item in scored[:limit]]
