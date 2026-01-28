import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacetPageClient } from "@/components/FacetPageClient";
import { fetchSkillsCached } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";

const PAGE_SIZE = 24;

type PageProps = {
  params: Promise<{ lang: string; language: string }>;
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

  const language = resolvedParams.language;
  const siteOrigin = getSiteOrigin();
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const offset =
    !hasQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const basePath = `/${lang}/languages/${encodeURIComponent(language)}`;
  const canonical = `${siteOrigin}${basePath}${offset > 0 ? `?offset=${offset}` : ""}`;

  const description =
    lang === "zh"
      ? `查看主要语言为 ${language} 的 Claude Skill 项目。`
      : `Browse Claude Skill projects whose primary language is ${language}.`;

  const pageNum = Math.floor(offset / PAGE_SIZE) + 1;
  const baseTitle = lang === "zh" ? `语言：${language}` : `Language: ${language}`;
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
        "zh-CN": `${siteOrigin}/zh/languages/${encodeURIComponent(language)}${offset > 0 ? `?offset=${offset}` : ""}`,
        "en-US": `${siteOrigin}/en/languages/${encodeURIComponent(language)}${offset > 0 ? `?offset=${offset}` : ""}`,
        "x-default": `${siteOrigin}/zh/languages/${encodeURIComponent(language)}${offset > 0 ? `?offset=${offset}` : ""}`,
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

export default async function LanguageFacetPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }

  const language = resolvedParams.language;
  const initialQuery = (first(resolvedSearch.q) || "").trim();
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const initialOffset =
    !initialQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const data = await fetchSkillsCached(initialQuery, {
    language,
    limit: PAGE_SIZE,
    offset: initialOffset,
  });

  if (!initialQuery && initialOffset > 0 && data.items.length === 0) {
    notFound();
  }

  const copy = messages[lang];

  const heading = `${copy.detailLanguage}: ${language}`;
  const intro =
    lang === "zh"
      ? `浏览主要语言为 ${language} 的 Claude Skill 项目。`
      : `Browse Claude Skill projects whose primary language is ${language}.`;
  const path = `/languages/${encodeURIComponent(language)}`;

  return (
    <FacetPageClient
      lang={lang}
      path={path}
      heading={heading}
      intro={intro}
      filters={{ language }}
      initialQuery={initialQuery}
      initialSkills={data.items}
      initialTotal={data.total}
      initialOffset={initialOffset}
    />
  );
}
