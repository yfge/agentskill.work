export const dynamic = "force-dynamic";
import { getApiBase } from "@/lib/apiBase";
import { getSiteOrigin } from "@/lib/site";

const REVALIDATE_SECONDS = 60 * 60;

const FACET_LIMITS = {
  topics: 80,
  languages: 30,
} as const;

const MIN_FACET_COUNTS = {
  topics: 3,
  languages: 2,
} as const;

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

async function fetchFacetItems(
  kind: "topics" | "languages" | "owners",
  limit: number,
): Promise<FacetItem[]> {
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
  return data.items.filter((item) => item.value);
}

function addFacetUrls(
  urls: UrlEntry[],
  items: FacetItem[],
  pathPrefix: string,
  siteOrigin: string,
  today: string,
): void {
  const langs = ["zh", "en"] as const;
  for (const item of items) {
    for (const lang of langs) {
      const basePath = `${siteOrigin}/${lang}/${pathPrefix}/${encodeURIComponent(item.value)}`;
      urls.push({
        loc: basePath,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }
}
function keepHighValueFacets(
  items: FacetItem[],
  kind: keyof typeof MIN_FACET_COUNTS,
): FacetItem[] {
  const minimumCount = MIN_FACET_COUNTS[kind];
  return items.filter((item) => item.count >= minimumCount);
}

export async function GET() {
  const today = toDateStamp(new Date());
  const siteOrigin = getSiteOrigin();

  const [topics, languages] = await Promise.all([
    fetchFacetItems("topics", FACET_LIMITS.topics),
    fetchFacetItems("languages", FACET_LIMITS.languages),
  ]);

  const urls: UrlEntry[] = [];

  addFacetUrls(
    urls,
    keepHighValueFacets(topics, "topics"),
    "topics",
    siteOrigin,
    today,
  );
  addFacetUrls(
    urls,
    keepHighValueFacets(languages, "languages"),
    "languages",
    siteOrigin,
    today,
  );

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
