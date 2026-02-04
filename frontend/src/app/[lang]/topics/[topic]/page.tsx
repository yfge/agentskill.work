import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacetPageClient } from "@/components/FacetPageClient";
import { fetchSkillsCached, REVALIDATION_TIMES } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";

const PAGE_SIZE = 24;

// Enable ISR (Incremental Static Regeneration) with 1 hour revalidation
export const revalidate = REVALIDATION_TIMES.facets;

type PageProps = {
  params: Promise<{ lang: string; topic: string }>;
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

  const topic = resolvedParams.topic;
  const siteOrigin = getSiteOrigin();
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const offset =
    !hasQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const basePath = `/${lang}/topics/${encodeURIComponent(topic)}`;
  const canonical = `${siteOrigin}${basePath}${offset > 0 ? `?offset=${offset}` : ""}`;

  const description =
    lang === "zh"
      ? `查看与话题 "${topic}" 相关的 Claude Skill 项目。`
      : `Browse Claude Skill projects tagged with "${topic}".`;

  const pageNum = Math.floor(offset / PAGE_SIZE) + 1;
  const baseTitle = lang === "zh" ? `话题：${topic}` : `Topic: ${topic}`;
  const title =
    offset > 0
      ? lang === "zh"
        ? `${baseTitle} - 第 ${pageNum} 页 - Claude Skill`
        : `${baseTitle} - Page ${pageNum} - Claude Skill`
      : `${baseTitle} - Claude Skill - agentskill.work`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `${siteOrigin}/zh/topics/${encodeURIComponent(topic)}${offset > 0 ? `?offset=${offset}` : ""}`,
        "en-US": `${siteOrigin}/en/topics/${encodeURIComponent(topic)}${offset > 0 ? `?offset=${offset}` : ""}`,
        "x-default": `${siteOrigin}/zh/topics/${encodeURIComponent(topic)}${offset > 0 ? `?offset=${offset}` : ""}`,
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
      description,
      url: canonical,
      siteName: "agentskill.work",
      locale: lang === "en" ? "en_US" : "zh_CN",
      alternateLocale: [lang === "en" ? "zh_CN" : "en_US"],
      images: [{ url: "/opengraph-image" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }

  const topic = resolvedParams.topic;
  const initialQuery = (first(resolvedSearch.q) || "").trim();
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const initialOffset =
    !initialQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const data = await fetchSkillsCached(initialQuery, {
    topic,
    limit: PAGE_SIZE,
    offset: initialOffset,
  });

  if (!initialQuery && initialOffset > 0 && data.items.length === 0) {
    notFound();
  }

  const copy = messages[lang];

  const heading = `${copy.detailTopics}: ${topic}`;
  const intro =
    lang === "zh"
      ? `浏览话题 "${topic}" 下的 Claude Skill 项目。`
      : `Browse Claude Skill projects under the "${topic}" topic.`;
  const path = `/topics/${encodeURIComponent(topic)}`;

  return (
    <FacetPageClient
      lang={lang}
      path={path}
      heading={heading}
      intro={intro}
      filters={{ topic }}
      initialQuery={initialQuery}
      initialSkills={data.items}
      initialTotal={data.total}
      initialOffset={initialOffset}
    />
  );
}
