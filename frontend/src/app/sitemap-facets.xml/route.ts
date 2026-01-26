import { getApiBase } from "@/lib/apiBase";
import { getSiteOrigin } from "@/lib/site";

const REVALIDATE_SECONDS = 60 * 60;

type FacetItem = {
  value: string;
  count: number;
};

type FacetListResponse = {
  items: FacetItem[];
};

type UrlEntry = {
  loc: string;
  lastmod: string;
  changefreq?: string;
  priority?: string;
};

function toDateStamp(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function renderUrl(entry: UrlEntry): string {
  const parts = [
    `<loc>${entry.loc}</loc>`,
    `<lastmod>${entry.lastmod}</lastmod>`,
    entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `<priority>${entry.priority}</priority>` : null,
  ].filter(Boolean);
  return `  <url>${parts.join("")}</url>`;
}

async function fetchFacetValues(
  kind: "topics" | "languages" | "owners",
  limit: number,
): Promise<string[]> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/facets/${kind}?limit=${limit}`;

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as FacetListResponse;
  if (!Array.isArray(data.items)) {
    return [];
  }
  return data.items.map((item) => item.value).filter(Boolean);
}

export const dynamic = "force-dynamic";

export async function GET() {
  const today = toDateStamp(new Date());
  const siteOrigin = getSiteOrigin();

  const [topics, languages, owners] = await Promise.all([
    fetchFacetValues("topics", 100),
    fetchFacetValues("languages", 50),
    fetchFacetValues("owners", 50),
  ]);

  const urls: UrlEntry[] = [];
  const langs = ["zh", "en"] as const;

  for (const value of topics) {
    for (const lang of langs) {
      urls.push({
        loc: `${siteOrigin}/${lang}/topics/${encodeURIComponent(value)}`,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }

  for (const value of languages) {
    for (const lang of langs) {
      urls.push({
        loc: `${siteOrigin}/${lang}/languages/${encodeURIComponent(value)}`,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }

  for (const value of owners) {
    for (const lang of langs) {
      urls.push({
        loc: `${siteOrigin}/${lang}/owners/${encodeURIComponent(value)}`,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
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
