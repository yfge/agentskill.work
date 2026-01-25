import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePageClient } from "@/components/HomePageClient";
import { messages, type Language } from "@/lib/i18n";

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

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    return {};
  }
  const copy = messages[lang];
  const canonical = `https://agentskill.work/${lang}`;
  const hasQuery = Boolean(first(resolvedSearch.q)?.trim());

  return {
    title: copy.title,
    description: copy.subtitle,
    alternates: {
      canonical,
      languages: {
        "zh-CN": "https://agentskill.work/zh",
        "en-US": "https://agentskill.work/en",
        "x-default": "https://agentskill.work/zh",
      },
    },
    robots: hasQuery
      ? {
          index: false,
          follow: true,
        }
      : undefined,
    openGraph: {
      title: copy.title,
      description: copy.subtitle,
      url: canonical,
      siteName: "AgentSkill Hub",
      locale: lang === "en" ? "en_US" : "zh_CN",
      alternateLocale: [lang === "en" ? "zh_CN" : "en_US"],
      images: [{ url: "/opengraph-image" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
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
  return <HomePageClient lang={lang} initialQuery={initialQuery} />;
}

