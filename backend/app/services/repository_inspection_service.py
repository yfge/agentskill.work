from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import httpx
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.skill import Skill

GITHUB_REPOS_API_URL = "https://api.github.com/repos"
README_MAX_CHARS = 1800
MAX_LIST_ITEMS = 12

logger = logging.getLogger(__name__)

CONFIG_KEY_RE = re.compile(r"\b[A-Z][A-Z0-9_]{2,}\b")
INSTALL_LINE_RE = re.compile(
    r"(?im)^\s*(?:[$#]\s*)?(?:git clone|npm install|pnpm add|yarn add|pip install|"
    r"uvx|uv tool install|docker run|openclaw install|claude mcp add|npx)\b[^\n]{0,180}"
)

CAPABILITY_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("browser", ("browser", "web automation", "playwright", "puppeteer")),
    ("code-review", ("code review", "review code", "pull request", "pr review")),
    ("pdf", ("pdf", "document")),
    ("memory", ("memory", "vector", "embedding", "lancedb", "rag")),
    ("search", ("search", "retrieval", "web search")),
    ("image", ("image", "vision", "screenshot")),
    ("video", ("video", "ffmpeg", "transcript")),
    ("terminal", ("terminal", "shell", "cli")),
    ("workflow", ("workflow", "automation", "agent workflow")),
)

PLATFORM_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Claude", ("claude", "claude skill", "anthropic")),
    ("MCP", ("mcp", "model context protocol")),
    ("OpenClaw", ("openclaw",)),
    ("Codex", ("codex",)),
    ("Cursor", ("cursor",)),
    ("OpenAI Agents", ("openai agents", "openai agent")),
)

KEY_FILES = {
    "README.md",
    "README.zh-CN.md",
    "README_EN.md",
    "SKILL.md",
    "skill.json",
    "manifest.json",
    "mcp.json",
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "docker-compose.yml",
}


@dataclass(frozen=True)
class RepositoryInspection:
    skill_type: str
    platforms: list[str]
    capabilities: list[str]
    install_methods: list[str]
    config_keys: list[str]
    source_files: list[str]
    readme_excerpt: str | None
    quality_score: int
    verification_status: str


def _github_headers(settings: Settings, accept: str) -> dict[str, str]:
    headers = {
        "Accept": accept,
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = value.strip()
        key = cleaned.lower()
        if not cleaned or key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
    return result[:MAX_LIST_ITEMS]


def _owner_repo(skill: Skill) -> tuple[str, str] | None:
    parts = (skill.full_name or "").split("/", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return None
    return parts[0], parts[1]


def _fetch_readme(
    client: httpx.Client, settings: Settings, owner: str, repo: str
) -> str | None:
    url = f"{GITHUB_REPOS_API_URL}/{owner}/{repo}/readme"
    response = client.get(
        url,
        headers=_github_headers(settings, "application/vnd.github.raw"),
    )
    if response.status_code == 404:
        return None
    response.raise_for_status()
    text = response.text.strip()
    return text or None


def _fetch_root_files(
    client: httpx.Client, settings: Settings, owner: str, repo: str
) -> list[str]:
    url = f"{GITHUB_REPOS_API_URL}/{owner}/{repo}/contents"
    response = client.get(
        url,
        headers=_github_headers(settings, "application/vnd.github+json"),
    )
    if response.status_code == 404:
        return []
    response.raise_for_status()
    data: Any = response.json()
    if not isinstance(data, list):
        return []
    names: list[str] = []
    for item in data:
        if isinstance(item, dict) and isinstance(item.get("name"), str):
            names.append(item["name"])
    return names


def _detect_skill_type(text: str, topics: list[str], source_files: list[str]) -> str:
    haystack = " ".join([text, " ".join(topics), " ".join(source_files)]).lower()
    if "mcp" in haystack or "model context protocol" in haystack:
        return "mcp_server"
    if "openclaw" in haystack or "SKILL.md" in source_files:
        return "openclaw_skill"
    if "cursor" in haystack and ("rule" in haystack or "rules" in haystack):
        return "cursor_rule"
    if "codex" in haystack:
        return "codex_skill"
    if "workflow" in haystack or ".github" in source_files:
        return "workflow"
    return "claude_skill"


def _detect_platforms(text: str, topics: list[str]) -> list[str]:
    haystack = " ".join([text, " ".join(topics)]).lower()
    result: list[str] = []
    for platform, needles in PLATFORM_KEYWORDS:
        if any(needle in haystack for needle in needles):
            result.append(platform)
    return _dedupe(result or ["Claude"])


def _detect_capabilities(text: str, topics: list[str]) -> list[str]:
    haystack = " ".join([text, " ".join(topics)]).lower()
    result: list[str] = []
    for capability, needles in CAPABILITY_KEYWORDS:
        if any(needle in haystack for needle in needles):
            result.append(capability)
    for topic in topics:
        if topic.lower() not in {item.lower() for item in result}:
            result.append(topic)
    return _dedupe(result)


def _detect_install_methods(readme: str | None, full_name: str) -> list[str]:
    methods = INSTALL_LINE_RE.findall(readme or "")
    if not methods:
        methods = [f"git clone https://github.com/{full_name}.git"]
    return _dedupe([method.strip() for method in methods])


def _detect_config_keys(readme: str | None, source_files: list[str]) -> list[str]:
    keys = CONFIG_KEY_RE.findall(readme or "")
    filtered = [
        key
        for key in keys
        if key.endswith(("KEY", "TOKEN", "SECRET", "URL", "ID"))
        and key not in {"README", "HTTP", "HTTPS", "JSON"}
    ]
    if "package.json" in source_files:
        filtered.append("PACKAGE_JSON")
    return _dedupe(filtered)


def _quality_score(
    readme: str | None,
    source_files: list[str],
    install_methods: list[str],
    config_keys: list[str],
) -> int:
    score = 20
    readme_len = len(readme or "")
    if readme_len > 400:
        score += 20
    if readme_len > 1500:
        score += 10
    if install_methods:
        score += 15
    if config_keys:
        score += 5
    if any(
        name in source_files for name in ("skill.json", "manifest.json", "mcp.json")
    ):
        score += 15
    if any(name.lower().startswith("readme") for name in source_files):
        score += 5
    if any(name in source_files for name in ("examples", "docs")):
        score += 5
    if any(name in source_files for name in ("tests", "test")):
        score += 5
    return min(score, 100)


def inspect_skill_repository(
    skill: Skill, settings: Settings, client: httpx.Client | None = None
) -> RepositoryInspection | None:
    owner_repo = _owner_repo(skill)
    if not owner_repo:
        return None
    owner, repo = owner_repo

    close_client = client is None
    client = client or httpx.Client(timeout=30)
    try:
        readme = _fetch_readme(client, settings, owner, repo)
        root_files = _fetch_root_files(client, settings, owner, repo)
    finally:
        if close_client:
            client.close()

    source_files = _dedupe(
        [
            name
            for name in root_files
            if name in KEY_FILES or name in {"docs", "examples", "test", "tests"}
        ]
    )
    topics = skill.topics_json or [
        item.strip() for item in (skill.topics or "").split(",") if item.strip()
    ]
    text = " ".join(
        value
        for value in [
            skill.full_name,
            skill.description or "",
            readme or "",
            " ".join(source_files),
        ]
        if value
    )

    install_methods = _detect_install_methods(readme, skill.full_name)
    config_keys = _detect_config_keys(readme, source_files)
    verification_status = "readme_parsed" if readme else "root_files_parsed"

    return RepositoryInspection(
        skill_type=_detect_skill_type(text, topics, source_files),
        platforms=_detect_platforms(text, topics),
        capabilities=_detect_capabilities(text, topics),
        install_methods=install_methods,
        config_keys=config_keys,
        source_files=source_files,
        readme_excerpt=(readme[:README_MAX_CHARS].strip() if readme else None),
        quality_score=_quality_score(
            readme, source_files, install_methods, config_keys
        ),
        verification_status=verification_status,
    )


def inspect_stale_skill_repositories(db: Session, settings: Settings) -> int:
    candidates = (
        db.query(Skill)
        .filter(
            or_(
                Skill.last_verified_at.is_(None),
                and_(
                    Skill.last_pushed_at.isnot(None),
                    Skill.last_verified_at.isnot(None),
                    Skill.last_verified_at < Skill.last_pushed_at,
                ),
            )
        )
        .order_by(Skill.last_verified_at.isnot(None), Skill.stars.desc())
        .limit(settings.inspect_batch_size)
        .all()
    )
    if not candidates:
        return 0

    now = datetime.now(tz=UTC)
    updated = 0
    touched = 0
    with httpx.Client(timeout=30) as client:
        for skill in candidates:
            try:
                payload = inspect_skill_repository(skill, settings, client)
            except httpx.HTTPError as exc:
                logger.warning(
                    "repository inspection failed for %s: %s", skill.full_name, exc
                )
                skill.verification_status = "inspection_error"
                skill.last_verified_at = now
                touched += 1
                continue
            if not payload:
                skill.verification_status = "invalid_full_name"
                skill.last_verified_at = now
                touched += 1
                continue

            skill.skill_type = payload.skill_type
            skill.platforms = payload.platforms
            skill.capabilities = payload.capabilities
            skill.install_methods = payload.install_methods
            skill.config_keys = payload.config_keys
            skill.source_files = payload.source_files
            skill.readme_excerpt = payload.readme_excerpt
            skill.quality_score = payload.quality_score
            skill.verification_status = payload.verification_status
            skill.last_verified_at = now
            updated += 1
            touched += 1

    if touched:
        db.commit()
    return updated
