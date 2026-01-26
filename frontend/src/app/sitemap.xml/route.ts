import { getApiBase } from "@/lib/apiBase";
import { getSiteOrigin } from "@/lib/site";

// Keep behavior compatible with common crawlers/tools that expect sitemap.xml to
// return 200 (not a redirect).
const REVALIDATE_SECONDS = 60 * 60;
// Keep in sync with backend API max limit (FastAPI validation).
const SKILLS_PER_SITEMAP = 100;

type SkillListResponse = {
  total: number;
  items: unknown[];
};

function toDateStamp(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function fetchTotalSkills(): Promise<number> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/skills?limit=1&offset=0`;

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    return 0;
  }
  const data = (await res.json()) as SkillListResponse;
  return Number.isFinite(data.total) ? data.total : 0;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const today = toDateStamp(new Date());
  const total = await fetchTotalSkills();
  const pages = total > 0 ? Math.ceil(total / SKILLS_PER_SITEMAP) : 0;
  const siteOrigin = getSiteOrigin();

  const urls: string[] = [
    `${siteOrigin}/sitemap-pages.xml`,
    `${siteOrigin}/sitemap-facets.xml`,
  ];
  for (let page = 1; page <= pages; page += 1) {
    urls.push(`${siteOrigin}/sitemap-skills/${page}.xml`);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls
      .map((loc) => `  <sitemap><loc>${loc}</loc><lastmod>${today}</lastmod></sitemap>`)
      .join("\n")}\n` +
    `</sitemapindex>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${REVALIDATE_SECONDS}`,
    },
  });
}
