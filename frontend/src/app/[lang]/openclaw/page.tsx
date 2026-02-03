import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OpenClawPageClient } from "@/components/OpenClawPageClient";
import { fetchSkillsCached } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";

const PAGE_SIZE = 24;
const BASE_QUERY = "openclaw";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveLanguage(value: string): Language | null {
  if (value === "en") {
    return "en";
  }
  if (value === "zh") {
    return "zh";
  }
  return null;
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseOffset(value: string | undefined): number | null {
  if (!value) {
    return 0;
  }
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function combineQuery(baseQuery: string, userQuery: string): string {
  const trimmed = userQuery.trim();
  if (!trimmed) {
    return baseQuery;
  }
  return `${baseQuery} ${trimmed}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    return {};
  }
  const copy = messages[lang];
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const offset =
    !hasQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const siteOrigin = getSiteOrigin();
  const canonicalUrl = `${siteOrigin}/${lang}/openclaw${offset > 0 ? `?offset=${offset}` : ""}`;
  const title =
    offset > 0
      ? lang === "zh"
        ? `${copy.openclawTitle} - 第 ${Math.floor(offset / PAGE_SIZE) + 1} 页`
        : `${copy.openclawTitle} - Page ${Math.floor(offset / PAGE_SIZE) + 1}`
      : copy.openclawTitle;

  return {
    title,
    description: copy.openclawSubtitle,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "zh-CN": `${siteOrigin}/zh/openclaw${offset > 0 ? `?offset=${offset}` : ""}`,
        "en-US": `${siteOrigin}/en/openclaw${offset > 0 ? `?offset=${offset}` : ""}`,
        "x-default": `${siteOrigin}/zh/openclaw${offset > 0 ? `?offset=${offset}` : ""}`,
      },
    },
    robots: hasQuery
      ? {
          index: false,
          follow: true,
        }
      : undefined,
    openGraph: {
      title,
      description: copy.openclawSubtitle,
      url: canonicalUrl,
      siteName: "agentskill.work",
      locale: lang === "en" ? "en_US" : "zh_CN",
      alternateLocale: [lang === "en" ? "zh_CN" : "en_US"],
      images: [{ url: "/opengraph-image" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: copy.openclawSubtitle,
      images: ["/opengraph-image"],
    },
  };
}

export default async function OpenClawPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }
  const initialQuery = (first(resolvedSearch.q) || "").trim();
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const initialOffset =
    !initialQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const combinedQuery = combineQuery(BASE_QUERY, initialQuery);
  const data = await fetchSkillsCached(combinedQuery, {
    limit: PAGE_SIZE,
    offset: initialOffset,
  });

  if (!initialQuery && initialOffset > 0 && data.items.length === 0) {
    notFound();
  }

  return (
    <OpenClawPageClient
      lang={lang}
      initialQuery={initialQuery}
      initialSkills={data.items}
      initialTotal={data.total}
      initialOffset={initialOffset}
    />
  );
}
