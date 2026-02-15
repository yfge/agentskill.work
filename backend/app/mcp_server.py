"""
MCP (Model Context Protocol) server for agentskill.work.

Exposes skill search and discovery as MCP tools so AI agents
can query the database directly from Claude Desktop, Cursor, etc.

Run standalone:  python -m app.mcp_server
Or via:          uvx mcp run app/mcp_server.py
"""

from __future__ import annotations

import json
import logging

from mcp.server.fastmcp import FastMCP

from app.core.database import SessionLocal
from app.services.facets_service import (
    list_top_languages,
    list_top_owners,
    list_top_topics,
)
from app.services.skill_service import get_skill_by_full_name, search_skills

logger = logging.getLogger(__name__)

mcp = FastMCP("agentskill.work")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def search_claude_skills(
    query: str | None = None,
    topic: str | None = None,
    language: str | None = None,
    owner: str | None = None,
    sort: str = "stars",
    limit: int = 20,
    offset: int = 0,
) -> str:
    """Search Claude Skill repositories.

    Args:
        query: Free-text search (matches name, description, topics).
        topic: Filter by GitHub topic (e.g. "mcp", "claude-skill").
        language: Filter by programming language (e.g. "Python", "TypeScript").
        owner: Filter by GitHub owner/org.
        sort: Sort order — "stars" (default) or "newest".
        limit: Max results to return (1-50, default 20).
        offset: Pagination offset.

    Returns:
        JSON with total count and skill items.
    """
    limit = max(1, min(limit, 50))
    db = SessionLocal()
    try:
        total, items = search_skills(
            db,
            query=query,
            topic=topic,
            language=language,
            owner=owner,
            sort=sort,
            limit=limit,
            offset=offset,
        )
        return json.dumps(
            {
                "total": total,
                "items": [
                    {
                        "full_name": s.full_name,
                        "description": s.description,
                        "description_zh": s.description_zh,
                        "stars": s.stars,
                        "forks": s.forks,
                        "language": s.language,
                        "topics": s.topics,
                        "html_url": s.html_url,
                        "summary_en": s.summary_en,
                        "summary_zh": s.summary_zh,
                    }
                    for s in items
                ],
            },
            ensure_ascii=False,
            default=str,
        )
    finally:
        db.close()


@mcp.tool()
def get_skill_detail(owner: str, repo: str) -> str:
    """Get detailed information about a specific Claude Skill repository.

    Args:
        owner: GitHub owner/org (e.g. "anthropics").
        repo: Repository name (e.g. "claude-code").

    Returns:
        JSON with full skill details, or an error message if not found.
    """
    full_name = f"{owner}/{repo}"
    db = SessionLocal()
    try:
        skill = get_skill_by_full_name(db, full_name)
        if not skill:
            return json.dumps({"error": f"Skill '{full_name}' not found"})
        return json.dumps(
            {
                "full_name": skill.full_name,
                "description": skill.description,
                "description_zh": skill.description_zh,
                "summary_en": skill.summary_en,
                "summary_zh": skill.summary_zh,
                "key_features_en": skill.key_features_en,
                "key_features_zh": skill.key_features_zh,
                "use_cases_en": skill.use_cases_en,
                "use_cases_zh": skill.use_cases_zh,
                "stars": skill.stars,
                "forks": skill.forks,
                "language": skill.language,
                "topics": skill.topics,
                "html_url": skill.html_url,
                "last_pushed_at": skill.last_pushed_at,
                "repo_created_at": skill.repo_created_at,
            },
            ensure_ascii=False,
            default=str,
        )
    finally:
        db.close()


@mcp.tool()
def list_topics(limit: int = 30) -> str:
    """List the most popular topics/tags across all indexed skills.

    Args:
        limit: Max topics to return (default 30).

    Returns:
        JSON array of [topic, count] pairs, sorted by frequency.
    """
    db = SessionLocal()
    try:
        result = list_top_topics(db, limit=limit)
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


@mcp.tool()
def list_languages(limit: int = 20) -> str:
    """List the most common programming languages across all indexed skills.

    Args:
        limit: Max languages to return (default 20).

    Returns:
        JSON array of [language, count] pairs, sorted by frequency.
    """
    db = SessionLocal()
    try:
        result = list_top_languages(db, limit=limit)
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


@mcp.tool()
def list_owners(limit: int = 20) -> str:
    """List the most prolific skill authors/organizations.

    Args:
        limit: Max owners to return (default 20).

    Returns:
        JSON array of [owner, count] pairs, sorted by skill count.
    """
    db = SessionLocal()
    try:
        result = list_top_owners(db, limit=limit)
        return json.dumps(result, ensure_ascii=False)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------


@mcp.resource("skills://stats")
def get_stats() -> str:
    """Get overall index statistics (total skills, top languages, top topics)."""
    db = SessionLocal()
    try:
        from sqlalchemy import func, select

        from app.models.skill import Skill

        total = db.execute(select(func.count()).select_from(Skill)).scalar_one()
        langs = list_top_languages(db, limit=5)
        topics = list_top_topics(db, limit=10)
        return json.dumps(
            {
                "total_skills": total,
                "top_languages": langs,
                "top_topics": topics,
            },
            ensure_ascii=False,
        )
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
