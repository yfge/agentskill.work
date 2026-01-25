import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePageClient } from "@/components/HomePageClient";
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
  const copy = messages[lang];
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());
  const offsetValue = first(resolvedSearch.offset);
  const offsetParsed = parseOffset(offsetValue);
  const offset =
    !hasQuery && offsetParsed !== null && offsetParsed % PAGE_SIZE === 0
      ? offsetParsed
      : 0;

  const canonical = `https://agentskill.work/${lang}${
    offset > 0 ? `?offset=${offset}` : ""
  }`;
  const title =
    offset > 0
      ? lang === "zh"
        ? `${copy.title} - 第 ${Math.floor(offset / PAGE_SIZE) + 1} 页`
        : `${copy.title} - Page ${Math.floor(offset / PAGE_SIZE) + 1}`
      : copy.title;

  return {
    title,
    description: copy.subtitle,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `https://agentskill.work/zh${offset > 0 ? `?offset=${offset}` : ""}`,
        "en-US": `https://agentskill.work/en${offset > 0 ? `?offset=${offset}` : ""}`,
        "x-default": `https://agentskill.work/zh${
          offset > 0 ? `?offset=${offset}` : ""
        }`,
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
      description: copy.subtitle,
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
      description: copy.subtitle,
      images: ["/opengraph-image"],
    },
  };
}

export default async function LanguageHomePage({ params, searchParams }: PageProps) {
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
  const data = await fetchSkillsCached(initialQuery, {
    limit: PAGE_SIZE,
    offset: initialOffset,
  });
  if (!initialQuery && initialOffset > 0 && data.items.length === 0) {
    notFound();
  }
  return (
    <HomePageClient
      lang={lang}
      initialQuery={initialQuery}
      initialSkills={data.items}
      initialTotal={data.total}
      initialOffset={initialOffset}
    />
  );
}
