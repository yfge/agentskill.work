from datetime import datetime
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
            if remaining == "0":
                logger.warning("github rate limit exhausted; stop pagination")
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
