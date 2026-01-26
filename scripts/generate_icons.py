#!/usr/bin/env python3
"""
Generate simple brand-consistent icon assets for agentskill.work.

Outputs (under `frontend/public/`):
- favicon.ico (16/32/48)
- favicon-32x32.png
- apple-touch-icon.png (180)
- icon-512.png
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "frontend" / "public"


def _hex_to_rgba(value: str) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), 255)


def _star_points(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for i in range(10):
        angle = (i * math.pi / 5) - (math.pi / 2)
        rr = r if i % 2 == 0 else r * 0.45
        points.append((cx + rr * math.cos(angle), cy + rr * math.sin(angle)))
    return points


def draw_icon(size: int) -> Image.Image:
    bg = _hex_to_rgba("#f6f4ef")
    border = _hex_to_rgba("#e7dcc8")
    accent = _hex_to_rgba("#b65f3b")
    subtle = _hex_to_rgba("#c8beaf")
    muted = _hex_to_rgba("#6f655a")

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(size * 0.22)
    border_w = max(2, int(size * 0.03))

    # Background with border.
    draw.rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=radius,
        fill=bg,
        outline=border,
        width=border_w,
    )

    # "Card" mark (directory/list motif).
    card_pad_x = int(size * 0.18)
    card_top = int(size * 0.23)
    card_bottom = int(size * 0.83)
    card = [card_pad_x, card_top, size - card_pad_x, card_bottom]
    draw.rounded_rectangle(
        card,
        radius=int(size * 0.12),
        fill=(255, 255, 255, 255),
        outline=border,
        width=border_w,
    )

    line_left = card[0] + int(size * 0.10)
    line_right = card[2] - int(size * 0.10)
    y1 = card[1] + int(size * 0.18)

    dot_r = max(2, int(size * 0.035))
    draw.ellipse(
        [line_left - dot_r, y1 - dot_r, line_left + dot_r, y1 + dot_r], fill=accent
    )
    draw.rounded_rectangle(
        [
            line_left + dot_r * 2,
            y1 - int(dot_r * 0.55),
            line_right,
            y1 + int(dot_r * 0.55),
        ],
        radius=int(dot_r * 0.55),
        fill=muted,
    )

    line_h = max(2, int(size * 0.03))
    y2 = y1 + int(size * 0.12)
    draw.rounded_rectangle(
        [line_left, y2, line_right - int(size * 0.08), y2 + line_h],
        radius=line_h,
        fill=subtle,
    )
    y3 = y2 + int(size * 0.10)
    draw.rounded_rectangle(
        [line_left, y3, line_right - int(size * 0.20), y3 + line_h],
        radius=line_h,
        fill=subtle,
    )

    # Small "trending" star.
    star_cx = int(size * 0.77)
    star_cy = int(size * 0.23)
    star_r = int(size * 0.12)
    draw.polygon(_star_points(star_cx, star_cy, star_r), fill=accent)

    return img


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    base = draw_icon(512)

    # Save PNGs.
    base.save(PUBLIC_DIR / "icon-512.png", format="PNG", optimize=True)
    base.resize((180, 180), Image.Resampling.LANCZOS).save(
        PUBLIC_DIR / "apple-touch-icon.png", format="PNG", optimize=True
    )
    base.resize((32, 32), Image.Resampling.LANCZOS).save(
        PUBLIC_DIR / "favicon-32x32.png", format="PNG", optimize=True
    )

    # Save ICO with multiple sizes.
    ico_path = PUBLIC_DIR / "favicon.ico"
    base_for_ico = draw_icon(256)
    base_for_ico.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    print(f"Wrote icon assets to {PUBLIC_DIR}")


if __name__ == "__main__":
    main()
