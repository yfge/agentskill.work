import { getApiBase } from "@/lib/apiBase";
import { SkillListResponse } from "@/types/skill";
import type { NextRequest } from "next/server";

const REVALIDATE_SECONDS = 60 * 60;
const SKILLS_PER_SITEMAP = 5_000;
const LANGS = ["zh", "en"] as const;

function toDateStamp(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toDateStampFromTimestamp(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  if (value.length < 10) {
    return null;
  }
  return value.slice(0, 10);
}

type UrlEntry = {
  loc: string;
  lastmod: string;
  changefreq?: string;
  priority?: string;
};

function renderUrl(entry: UrlEntry): string {
  const parts = [
    `<loc>${entry.loc}</loc>`,
    `<lastmod>${entry.lastmod}</lastmod>`,
    entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `<priority>${entry.priority}</priority>` : null,
  ].filter(Boolean);
  return `  <url>${parts.join("")}</url>`;
}

export const revalidate = 3600;

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const resolvedParams = await ctx.params;
  const rawValue = resolvedParams.page;
  const raw = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (!raw) {
    return new Response("Not found", { status: 404 });
  }
  if (/^\d+$/.test(raw)) {
    return Response.redirect(`https://agentskill.work/sitemap-skills/${raw}.xml`, 308);
  }
  const match = raw.match(/^(\d+)\.xml$/);
  if (!match) {
    return new Response("Not found", { status: 404 });
  }
  const page = Number(match[1]);
  if (!Number.isSafeInteger(page) || page < 1) {
    return new Response("Not found", { status: 404 });
  }

  const offset = (page - 1) * SKILLS_PER_SITEMAP;
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/skills?limit=${SKILLS_PER_SITEMAP}&offset=${offset}`;

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    return new Response("Upstream error", { status: 502 });
  }

  const data = (await res.json()) as SkillListResponse;
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const today = toDateStamp(new Date());
  const urls: UrlEntry[] = [];

  for (const skill of items) {
    const [owner, repo] = skill.full_name.split("/");
    if (!owner || !repo) {
      continue;
    }
    const lastmod =
      toDateStampFromTimestamp(skill.last_pushed_at) ||
      toDateStampFromTimestamp(skill.fetched_at) ||
      today;

    for (const lang of LANGS) {
      urls.push({
        loc: `https://agentskill.work/${lang}/skills/${encodeURIComponent(
          owner,
        )}/${encodeURIComponent(repo)}`,
        lastmod,
        changefreq: "daily",
        priority: "0.8",
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls.map(renderUrl).join("\n")}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${REVALIDATE_SECONDS}`,
    },
  });
}
