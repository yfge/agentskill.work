"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { PageBottomSections } from "@/components/PageBottomSections";
import { SkillList } from "@/components/SkillList";
import { fetchSkills } from "@/lib/api";
import { trackVisit } from "@/lib/metrics";
import {
  defaultLanguage,
  messages,
  setStoredLanguage,
  type Language,
} from "@/lib/i18n";
import { normalizeClaudeSkill } from "@/lib/text";
import { getVisitorId } from "@/lib/visitor";
import { getSiteOrigin } from "@/lib/site";
import { Skill } from "@/types/skill";

const PAGE_SIZE = 24;

function withoutLangParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.delete("lang");
  next.delete("hl");
  return next;
}

export function LatestPageClient({
  lang: initialLang = defaultLanguage,
  initialSkills = [],
  initialTotal = 0,
  initialOffset = 0,
}: {
  lang?: Language;
  initialSkills?: Skill[];
  initialTotal?: number;
  initialOffset?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(initialLang);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(initialOffset);

  useEffect(() => {
    setStoredLanguage(lang);
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  }, [lang]);

  useEffect(() => {
    setSkills(initialSkills);
    setTotal(initialTotal);
    setOffset(initialOffset);
  }, [initialSkills, initialTotal, initialOffset]);

  useEffect(() => {
    const id = getVisitorId();
    trackVisit(id).catch(() => null);
  }, []);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      setError(null);
      const nextOffset = offset + PAGE_SIZE;
      const data = await fetchSkills("", {
        limit: PAGE_SIZE,
        offset: nextOffset,
        sort: "newest",
      });
      setTotal(data.total);
      setOffset(nextOffset);
      setSkills((prev) => [...prev, ...data.items]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const copy = messages[lang];
  const siteOrigin = getSiteOrigin();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy.navTrending,
        item: `${siteOrigin}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy.navLatest,
        item:
          initialOffset > 0
            ? `${siteOrigin}/${lang}/latest?offset=${initialOffset}`
            : `${siteOrigin}/${lang}/latest`,
      },
    ],
  };

  const itemListSchema =
    !loading && !error && skills.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          url:
            initialOffset > 0
              ? `${siteOrigin}/${lang}/latest?offset=${initialOffset}`
              : `${siteOrigin}/${lang}/latest`,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: total || skills.length,
          startIndex: initialOffset + 1,
          itemListElement: skills.map((skill, index) => {
            const [owner, repo] = skill.full_name.split("/");
            const detailUrl =
              owner && repo
                ? `${siteOrigin}/${lang}/skills/${encodeURIComponent(
                    owner,
                  )}/${encodeURIComponent(repo)}`
                : `${siteOrigin}/${lang}/latest`;
            const description =
              lang === "zh"
                ? normalizeClaudeSkill(skill.description_zh || skill.description)
                : skill.description || skill.description_zh;
            return {
              "@type": "ListItem",
              position: initialOffset + index + 1,
              item: {
                "@type": "SoftwareSourceCode",
                name: skill.full_name,
                url: detailUrl,
                codeRepository: skill.html_url,
                description: description || undefined,
                programmingLanguage: skill.language || undefined,
                keywords: skill.topics || undefined,
              },
            };
          }),
        }
      : null;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      <section className="hero">
        <div className="hero-text">
          <h1>{copy.latestTitle}</h1>
          <p>{copy.latestSubtitle}</p>
        </div>
        <div className="hero-actions">
          <LanguageToggle
            lang={lang}
            onChange={(next) => {
              setLang(next);
              setStoredLanguage(next);
              document.documentElement.lang = next === "en" ? "en" : "zh-CN";
              const params = withoutLangParams(
                new URLSearchParams(searchParams.toString()),
              );
              const qs = params.toString();
              router.replace(`/${next}/latest${qs ? `?${qs}` : ""}`);
            }}
          />
        </div>
      </section>

      <nav className="browse-nav" aria-label="Browse">
        <a href={`/${lang}`}>{copy.navTrending}</a>
        <a href={`/${lang}/latest`} aria-current="page">
          {copy.navLatest}
        </a>
      </nav>

      {loading && <p className="status">{copy.loading}</p>}
      {error && <p className="status">{copy.error}</p>}

      {!loading && !error && (
        <SkillList skills={skills} lang={lang} emptyLabel={copy.empty} />
      )}

      {!loading && !error && skills.length > 0 && (
        <div className="pagination">
          <span>
            {copy.countLabel} {skills.length}/{total}
          </span>
          {skills.length < total ? (
            <a
              className="pagination-link"
              href={`/${lang}/latest?offset=${offset + PAGE_SIZE}`}
              onClick={(event) => {
                event.preventDefault();
                loadMore();
              }}
              aria-disabled={loadingMore ? "true" : undefined}
            >
              {loadingMore ? copy.loading : copy.loadMore}
            </a>
          ) : null}
        </div>
      )}

      <PageBottomSections lang={lang} />
    </main>
  );
}
