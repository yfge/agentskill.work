import logging
from datetime import UTC, datetime, timedelta

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
        return datetime.fromtimestamp(int(value), tz=UTC)
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


def _fetch_github_search(
    settings: Settings,
    *,
    query: str,
    sort: str,
    order: str,
    max_pages: int,
    max_results: int,
) -> list[dict]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    per_page = min(settings.github_search_per_page, MAX_PER_PAGE)
    max_pages = max(1, max_pages)
    max_results = max(1, max_results)
    results: list[dict] = []

    with httpx.Client(timeout=30) as client:
        for page in range(1, max_pages + 1):
            params = {
                "q": query,
                "sort": sort,
                "order": order,
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
                        (
                            "github rate limit hit (status=%s, remaining=%s, "
                            "reset=%s, retry_after=%s), stop sync"
                        ),
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


def fetch_github_repos(settings: Settings) -> list[dict]:
    return _fetch_github_search(
        settings,
        query=settings.github_search_query,
        sort="stars",
        order="desc",
        max_pages=settings.github_max_pages,
        max_results=settings.github_max_results,
    )


def fetch_github_newest_repos(settings: Settings) -> list[dict]:
    window_days = max(1, settings.github_newest_window_days)
    since = (datetime.now(UTC) - timedelta(days=window_days)).date().isoformat()
    query = f"({settings.github_search_query}) created:>={since}"
    return _fetch_github_search(
        settings,
        query=query,
        sort="updated",
        order="desc",
        max_pages=settings.github_newest_max_pages,
        max_results=settings.github_newest_max_results,
    )


def sync_github_skills(db: Session, settings: Settings) -> int:
    repos: list[dict] = []
    repos_by_stars = fetch_github_repos(settings)
    repos.extend(repos_by_stars)

    repos_by_newest: list[dict] = []
    if settings.github_newest_max_results > 0 and settings.github_newest_max_pages > 0:
        repos_by_newest = fetch_github_newest_repos(settings)
        repos.extend(repos_by_newest)

    logger.info(
        "github sync fetched repos: by_stars=%s, by_newest=%s, combined=%s",
        len(repos_by_stars),
        len(repos_by_newest),
        len(repos),
    )

    count = 0
    deduped: dict[int, dict] = {}

    for repo in repos:
        repo_id = repo.get("id")
        if repo_id is None:
            continue
        # Keep the latest seen payload for the repo; fields overlap and are safe.
        deduped[int(repo_id)] = repo

    for repo in deduped.values():
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
        skill.repo_created_at = _parse_datetime(repo.get("created_at"))
        skill.repo_updated_at = _parse_datetime(repo.get("updated_at"))
        skill.last_pushed_at = _parse_datetime(repo.get("pushed_at"))

        if description and not skill.description_zh:
            translated = translate_to_zh(description, settings)
            if translated:
                skill.description_zh = translated

        count += 1

    db.commit()
    return count
