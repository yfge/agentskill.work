from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.core.config import Settings
from app.models.skill import Skill

logger = logging.getLogger(__name__)

_CLAUDE_SKILL_VARIANTS = re.compile("(?i)claude\\s*\\u6280\\u80fd")


def _normalize_terms(value: str) -> str:
    return _CLAUDE_SKILL_VARIANTS.sub("Claude Skill", value).strip()


def _truncate(value: str, max_len: int) -> str:
    if len(value) <= max_len:
        return value
    return value[: max(0, max_len - 3)].rstrip() + "..."


def _extract_json_object(text: str) -> dict[str, Any] | None:
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    snippet = text[start : end + 1]
    try:
        data = json.loads(snippet)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    return data


def _as_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return None


def _as_str_list(value: Any) -> list[str] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None
    items: list[str] = []
    for item in value:
        if isinstance(item, str):
            cleaned = item.strip()
            if cleaned:
                items.append(cleaned)
    return items or None


def _coerce_payload(raw: dict[str, Any]) -> dict[str, Any] | None:
    summary_en = _as_str(raw.get("summary_en"))
    summary_zh = _as_str(raw.get("summary_zh"))
    key_features_en = _as_str_list(raw.get("key_features_en"))
    key_features_zh = _as_str_list(raw.get("key_features_zh"))
    use_cases_en = _as_str_list(raw.get("use_cases_en"))
    use_cases_zh = _as_str_list(raw.get("use_cases_zh"))
    seo_title_en = _as_str(raw.get("seo_title_en"))
    seo_title_zh = _as_str(raw.get("seo_title_zh"))
    seo_description_en = _as_str(raw.get("seo_description_en"))
    seo_description_zh = _as_str(raw.get("seo_description_zh"))

    required = [
        summary_en,
        summary_zh,
        key_features_en,
        key_features_zh,
        use_cases_en,
        use_cases_zh,
        seo_title_en,
        seo_title_zh,
        seo_description_en,
        seo_description_zh,
    ]
    if any(value is None for value in required):
        return None

    # Normalize constraints for stable rendering + SEO.
    payload = {
        "summary_en": _truncate(_normalize_terms(summary_en), 800),
        "summary_zh": _truncate(_normalize_terms(summary_zh), 800),
        "key_features_en": [_truncate(_normalize_terms(v), 140) for v in key_features_en][:6],
        "key_features_zh": [_truncate(_normalize_terms(v), 140) for v in key_features_zh][:6],
        "use_cases_en": [_truncate(_normalize_terms(v), 140) for v in use_cases_en][:6],
        "use_cases_zh": [_truncate(_normalize_terms(v), 140) for v in use_cases_zh][:6],
        "seo_title_en": _truncate(_normalize_terms(seo_title_en), 80),
        "seo_title_zh": _truncate(_normalize_terms(seo_title_zh), 80),
        "seo_description_en": _truncate(_normalize_terms(seo_description_en), 200),
        "seo_description_zh": _truncate(_normalize_terms(seo_description_zh), 200),
    }

    # Keep pages "thick": require at least 3 bullets for each list.
    if (
        len(payload["key_features_en"]) < 3
        or len(payload["key_features_zh"]) < 3
        or len(payload["use_cases_en"]) < 3
        or len(payload["use_cases_zh"]) < 3
    ):
        return None

    return payload


def generate_enrichment(skill: Skill, settings: Settings) -> dict[str, Any] | None:
    if not settings.deepseek_api_key:
        return None

    url = f"{settings.deepseek_api_url.rstrip('/')}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }

    topics = [item for item in (skill.topics or "").split(",") if item]

    input_payload = {
        "full_name": skill.full_name,
        "description": skill.description or "",
        "description_zh": skill.description_zh or "",
        "language": skill.language or "",
        "topics": topics,
        "stars": int(skill.stars or 0),
        "forks": int(skill.forks or 0),
        "html_url": skill.html_url,
        "last_pushed_at": skill.last_pushed_at.isoformat()
        if skill.last_pushed_at
        else None,
    }

    system_prompt = (
        "You generate SEO-friendly, factual content for a GitHub repository page. "
        "You MUST only use the provided metadata; do NOT invent features. "
        'Keep the term "Claude Skill" unchanged (never translate it). '
        "Return ONLY valid JSON with these keys:\n"
        "- summary_en (string)\n"
        "- summary_zh (string, Simplified Chinese)\n"
        "- key_features_en (array of 3-6 short strings)\n"
        "- key_features_zh (array of 3-6 short strings, Simplified Chinese)\n"
        "- use_cases_en (array of 3-6 short strings)\n"
        "- use_cases_zh (array of 3-6 short strings, Simplified Chinese)\n"
        "- seo_title_en (string, <= ~60-70 chars)\n"
        "- seo_title_zh (string, Simplified Chinese, <= ~60-70 chars)\n"
        "- seo_description_en (string, <= ~160 chars)\n"
        "- seo_description_zh (string, Simplified Chinese, <= ~160 chars)\n"
        "If metadata is insufficient, write cautiously and avoid claims."
    )

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(input_payload)},
        ],
        "temperature": 0.2,
    }

    try:
        with httpx.Client(timeout=60) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        logger.warning("enrichment request failed: %s", exc)
        return None

    choices = data.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    content = message.get("content", "")
    if not isinstance(content, str) or not content.strip():
        return None

    raw_obj = _extract_json_object(content.strip())
    if not raw_obj:
        logger.warning("enrichment returned non-json payload for %s", skill.full_name)
        return None

    coerced = _coerce_payload(raw_obj)
    if not coerced:
        logger.warning("enrichment returned invalid payload for %s", skill.full_name)
        return None

    return coerced
