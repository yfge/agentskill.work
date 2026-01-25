from __future__ import annotations

from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.skill import Skill


def _normalize(value: str | None) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    return trimmed or None


def list_top_languages(db: Session, limit: int) -> list[tuple[str, int]]:
    rows = db.execute(select(Skill.language)).scalars().all()
    counter: Counter[str] = Counter()
    for value in rows:
        lang = _normalize(value)
        if not lang:
            continue
        counter[lang] += 1
    return counter.most_common(limit)


def list_top_owners(db: Session, limit: int) -> list[tuple[str, int]]:
    rows = db.execute(select(Skill.full_name)).scalars().all()
    counter: Counter[str] = Counter()
    for full_name in rows:
        name = _normalize(full_name)
        if not name:
            continue
        owner = name.split("/", 1)[0].strip()
        if not owner:
            continue
        counter[owner] += 1
    return counter.most_common(limit)


def list_top_topics(db: Session, limit: int) -> list[tuple[str, int]]:
    rows = db.execute(select(Skill.topics)).scalars().all()
    counter: Counter[str] = Counter()
    for topics in rows:
        value = _normalize(topics)
        if not value:
            continue
        for topic in value.split(","):
            item = topic.strip()
            if not item:
                continue
            counter[item] += 1
    return counter.most_common(limit)

