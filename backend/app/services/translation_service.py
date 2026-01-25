from __future__ import annotations

import logging

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)


def translate_to_zh(text: str, settings: Settings) -> str | None:
    if not settings.enable_translation:
        return None
    if not settings.deepseek_api_key:
        return None
    if not text.strip():
        return None

    url = f"{settings.deepseek_api_url.rstrip('/')}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a translation engine. Translate the user text to "
                    "Simplified Chinese. "
                    'Do not translate the term "Claude Skill"; keep it as '
                    '"Claude Skill". '
                    "Only return the translated text."
                ),
            },
            {"role": "user", "content": text},
        ],
        "temperature": 0.2,
    }

    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        logger.warning("translation failed: %s", exc)
        return None

    choices = data.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    content = message.get("content", "")
    return content.strip() or None
