import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacetPageClient } from "@/components/FacetPageClient";
import { fetchSkills } from "@/lib/api";
import { messages, type Language } from "@/lib/i18n";

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
  const canonical = `https://agentskill.work/${lang}/languages/${encodeURIComponent(language)}`;
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());

  const description =
    lang === "zh"
      ? `查看主要语言为 ${language} 的 Claude Skill 项目。`
      : `Browse Claude Skill projects whose primary language is ${language}.`;

  const title = `${
    lang === "zh" ? `语言：${language}` : `Language: ${language}`
  } - Claude Skill - AgentSkill Hub`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `https://agentskill.work/zh/languages/${encodeURIComponent(language)}`,
        "en-US": `https://agentskill.work/en/languages/${encodeURIComponent(language)}`,
        "x-default": `https://agentskill.work/zh/languages/${encodeURIComponent(language)}`,
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
      siteName: "AgentSkill Hub",
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
  const data = await fetchSkills(initialQuery, {
    language,
    limit: PAGE_SIZE,
    offset: 0,
  });
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
    />
  );
}
