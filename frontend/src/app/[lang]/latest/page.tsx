import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LatestPageClient } from "@/components/LatestPageClient";
import { fetchSkillsCached } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";

const PAGE_SIZE = 24;

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
  if (!/^[0-9]+$/.test(value)) {
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
  const copy = messages[lang];
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const offset = offsetParsed !== null && offsetParsed % PAGE_SIZE === 0 ? offsetParsed : 0;

  const canonical = `https://agentskill.work/${lang}/latest${
    offset > 0 ? `?offset=${offset}` : ""
  }`;
  const title =
    offset > 0
      ? lang === "zh"
        ? `${copy.latestTitle} - 第 ${Math.floor(offset / PAGE_SIZE) + 1} 页`
        : `${copy.latestTitle} - Page ${Math.floor(offset / PAGE_SIZE) + 1}`
      : copy.latestTitle;

  return {
    title,
    description: copy.latestSubtitle,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `https://agentskill.work/zh/latest${
          offset > 0 ? `?offset=${offset}` : ""
        }`,
        "en-US": `https://agentskill.work/en/latest${
          offset > 0 ? `?offset=${offset}` : ""
        }`,
        "x-default": `https://agentskill.work/zh/latest${
          offset > 0 ? `?offset=${offset}` : ""
        }`,
      },
    },
    openGraph: {
      title,
      description: copy.latestSubtitle,
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
      description: copy.latestSubtitle,
      images: ["/opengraph-image"],
    },
  };
}

export default async function LatestPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }

  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const offset = offsetParsed !== null && offsetParsed % PAGE_SIZE === 0 ? offsetParsed : null;
  if (offset === null) {
    notFound();
  }

  const data = await fetchSkillsCached("", {
    limit: PAGE_SIZE,
    offset,
    sort: "newest",
  });
  if (offset > 0 && data.items.length === 0) {
    notFound();
  }

  return (
    <LatestPageClient
      lang={lang}
      initialSkills={data.items}
      initialTotal={data.total}
      initialOffset={offset}
    />
  );
}

