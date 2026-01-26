import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacetPageClient } from "@/components/FacetPageClient";
import { fetchSkillsCached } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";

const PAGE_SIZE = 24;

type PageProps = {
  params: Promise<{ lang: string; owner: string }>;
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

  const owner = resolvedParams.owner;
  const siteOrigin = getSiteOrigin();
  const canonical = `${siteOrigin}/${lang}/owners/${encodeURIComponent(owner)}`;
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());

  const description =
    lang === "zh"
      ? `查看 ${owner} 创建的 Claude Skill 项目。`
      : `Browse Claude Skill projects created by ${owner}.`;

  const title = `${
    lang === "zh" ? `拥有者：${owner}` : `Owner: ${owner}`
  } - Claude Skill - agentskill.work`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `${siteOrigin}/zh/owners/${encodeURIComponent(owner)}`,
        "en-US": `${siteOrigin}/en/owners/${encodeURIComponent(owner)}`,
        "x-default": `${siteOrigin}/zh/owners/${encodeURIComponent(owner)}`,
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

export default async function OwnerPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }

  const owner = resolvedParams.owner;
  const initialQuery = (first(resolvedSearch.q) || "").trim();
  const data = await fetchSkillsCached(initialQuery, {
    owner,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const copy = messages[lang];

  const heading = `${copy.detailOwner}: ${owner}`;
  const intro =
    lang === "zh"
      ? `浏览 ${owner} 创建的 Claude Skill 项目。`
      : `Browse Claude Skill projects created by ${owner}.`;
  const path = `/owners/${encodeURIComponent(owner)}`;

  return (
    <FacetPageClient
      lang={lang}
      path={path}
      heading={heading}
      intro={intro}
      filters={{ owner }}
      initialQuery={initialQuery}
      initialSkills={data.items}
      initialTotal={data.total}
    />
  );
}
