import { getApiBase } from "@/lib/apiBase";
import { getSiteOrigin } from "@/lib/site";
import type { SkillListResponse } from "@/types/skill";

export const revalidate = 3600; // ISR: 1 hour

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteOrigin = getSiteOrigin();
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;

  let items: SkillListResponse["items"] = [];
  try {
    const res = await fetch(`${trimmedBase}/skills?sort=newest&limit=50`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data: SkillListResponse = await res.json();
      items = data.items;
    }
  } catch {
    // fallback to empty feed
  }

  const rssItems = items
    .map((skill) => {
      const link = `${siteOrigin}/en/skills/${encodeURIComponent(skill.full_name.split("/")[0])}/${encodeURIComponent(skill.full_name.split("/")[1])}`;
      const description = skill.description || skill.description_zh || "";
      const pubDate = skill.repo_created_at
        ? new Date(skill.repo_created_at).toUTCString()
        : "";
      return `    <item>
      <title>${escapeXml(skill.full_name)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(description)}</description>
      <guid isPermaLink="true">${escapeXml(link)}</guid>${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>agentskill.work - Claude Skill Directory</title>
    <link>${siteOrigin}</link>
    <description>Discover trending Claude Skill projects on GitHub, curated and searchable.</description>
    <language>en</language>
    <atom:link href="${siteOrigin}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
