import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacetPageClient } from "@/components/FacetPageClient";
import { fetchSkillsCached } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";

const PAGE_SIZE = 24;

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
  const canonical = `https://agentskill.work/${lang}/topics/${encodeURIComponent(topic)}`;
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());

  const description =
    lang === "zh"
      ? `查看与话题 “${topic}” 相关的 Claude Skill 项目。`
      : `Browse Claude Skill projects tagged with "${topic}".`;

  const title = `${
    lang === "zh" ? `话题：${topic}` : `Topic: ${topic}`
  } - Claude Skill - agentskill.work`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `https://agentskill.work/zh/topics/${encodeURIComponent(topic)}`,
        "en-US": `https://agentskill.work/en/topics/${encodeURIComponent(topic)}`,
        "x-default": `https://agentskill.work/zh/topics/${encodeURIComponent(topic)}`,
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
  const data = await fetchSkillsCached(initialQuery, {
    topic,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const copy = messages[lang];

  const heading = `${copy.detailTopics}: ${topic}`;
  const intro =
    lang === "zh"
      ? `浏览话题 “${topic}” 下的 Claude Skill 项目。`
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
    />
  );
}
