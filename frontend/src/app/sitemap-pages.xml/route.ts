import { getSiteOrigin } from "@/lib/site";

const REVALIDATE_SECONDS = 60 * 60;

function toDateStamp(value: Date): string {
  return value.toISOString().slice(0, 10);
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

export function GET() {
  const today = toDateStamp(new Date());
  const siteOrigin = getSiteOrigin();
  const urls: UrlEntry[] = [
    {
      loc: `${siteOrigin}/zh`,
      lastmod: today,
      changefreq: "hourly",
      priority: "0.9",
    },
    {
      loc: `${siteOrigin}/en`,
      lastmod: today,
      changefreq: "hourly",
      priority: "0.9",
    },
    {
      loc: `${siteOrigin}/zh/latest`,
      lastmod: today,
      changefreq: "hourly",
      priority: "0.7",
    },
    {
      loc: `${siteOrigin}/en/latest`,
      lastmod: today,
      changefreq: "hourly",
      priority: "0.7",
    },
  ];

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
