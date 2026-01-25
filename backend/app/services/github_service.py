from datetime import datetime, timezone
import logging

import httpx
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.skill import Skill
from app.services.translation_service import translate_to_zh

GITHUB_API_URL = "https://api.github.com/search/repositories"
MAX_PER_PAGE = 100

logger = logging.getLogger(__name__)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _parse_rate_limit_reset(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except ValueError:
        return None


def _should_stop_for_rate_limit(
    remaining: str | None, reset_at: datetime | None, buffer: int
) -> bool:
    if remaining is None:
        return False
    try:
        remaining_int = int(remaining)
    except ValueError:
        return False
    if remaining_int > buffer:
        return False
    logger.warning(
        "github rate limit near exhaustion (remaining=%s, reset=%s), stop sync",
        remaining_int,
        reset_at.isoformat() if reset_at else "unknown",
    )
    return True


def fetch_github_repos(settings: Settings) -> list[dict]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    per_page = min(settings.github_search_per_page, MAX_PER_PAGE)
    max_pages = max(1, settings.github_max_pages)
    max_results = max(1, settings.github_max_results)
    results: list[dict] = []

    with httpx.Client(timeout=30) as client:
        for page in range(1, max_pages + 1):
            params = {
                "q": settings.github_search_query,
                "sort": "stars",
                "order": "desc",
                "per_page": per_page,
                "page": page,
            }
            response = client.get(GITHUB_API_URL, headers=headers, params=params)

            if response.status_code in {403, 429}:
                remaining = response.headers.get("X-RateLimit-Remaining")
                reset_at = _parse_rate_limit_reset(
                    response.headers.get("X-RateLimit-Reset")
                )
                retry_after = response.headers.get("Retry-After")
                if remaining == "0" or retry_after:
                    logger.warning(
                        "github rate limit hit (status=%s, remaining=%s, reset=%s, retry_after=%s), stop sync",
                        response.status_code,
                        remaining,
                        reset_at.isoformat() if reset_at else "unknown",
                        retry_after or "unknown",
                    )
                    break
            response.raise_for_status()
            data = response.json()
            items = data.get("items", [])
            if not items:
                break
            results.extend(items)

            if len(results) >= max_results:
                results = results[:max_results]
                break

            if len(items) < per_page:
                break

            remaining = response.headers.get("X-RateLimit-Remaining")
            reset_at = _parse_rate_limit_reset(
                response.headers.get("X-RateLimit-Reset")
            )
            if _should_stop_for_rate_limit(
                remaining, reset_at, settings.github_rate_limit_buffer
            ):
                break

    return results


def sync_github_skills(db: Session, settings: Settings) -> int:
    repos = fetch_github_repos(settings)
    count = 0

    for repo in repos:
        repo_id = repo.get("id")
        if repo_id is None:
            continue

        skill = db.query(Skill).filter(Skill.repo_id == repo_id).first()
        if not skill:
            skill = Skill(repo_id=repo_id)
            db.add(skill)

        skill.name = repo.get("name", "")
        skill.full_name = repo.get("full_name", "")
        description = repo.get("description")
        skill.description = description
        skill.html_url = repo.get("html_url", "")
        skill.stars = repo.get("stargazers_count", 0)
        skill.forks = repo.get("forks_count", 0)
        skill.language = repo.get("language")
        skill.topics = ",".join(repo.get("topics", []) or [])
        skill.last_pushed_at = _parse_datetime(repo.get("pushed_at"))

        if description and not skill.description_zh:
            translated = translate_to_zh(description, settings)
            if translated:
                skill.description_zh = translated

        count += 1

    db.commit()
    return count
