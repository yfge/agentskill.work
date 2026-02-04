"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { SkillList } from "@/components/SkillList";
import { fetchSkills } from "@/lib/api";
import { trackVisit } from "@/lib/metrics";
import { trackSearch } from "@/lib/umami";
import {
  defaultLanguage,
  messages,
  setStoredLanguage,
  type Language,
} from "@/lib/i18n";
import { toSnippet } from "@/lib/text";
import { getVisitorId } from "@/lib/visitor";
import { getSiteOrigin } from "@/lib/site";
import { Skill } from "@/types/skill";

const PAGE_SIZE = 24;
const BASE_QUERY = "openclaw";

function withoutLangParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.delete("lang");
  next.delete("hl");
  return next;
}

function combineQuery(baseQuery: string, userQuery: string): string {
  const trimmed = userQuery.trim();
  if (!trimmed) {
    return baseQuery;
  }
  return `${baseQuery} ${trimmed}`;
}

export function OpenClawPageClient({
  lang: initialLang = defaultLanguage,
  initialQuery = "",
  initialSkills = [],
  initialTotal = 0,
  initialOffset = 0,
}: {
  lang?: Language;
  initialQuery?: string;
  initialSkills?: Skill[];
  initialTotal?: number;
  initialOffset?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(initialLang);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(initialOffset);
  const [activeQuery, setActiveQuery] = useState(initialQuery.trim());

  useEffect(() => {
    setStoredLanguage(lang);
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  }, [lang]);

  useEffect(() => {
    const id = getVisitorId();
    trackVisit(id).catch(() => null);
  }, []);

  const loadSkills = useCallback(
    async (value: string, nextOffset = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const combinedQuery = combineQuery(BASE_QUERY, value);
        const data = await fetchSkills(combinedQuery, {
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setTotal(data.total);
        setOffset(nextOffset);
        if (append) {
          setSkills((prev) => [...prev, ...data.items]);
        } else {
          setSkills(data.items);
          setActiveQuery(value);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setQuery(initialQuery);
    setSkills(initialSkills);
    setTotal(initialTotal);
    setOffset(initialOffset);
    setActiveQuery(initialQuery.trim());
  }, [initialQuery, initialSkills, initialTotal, initialOffset]);

  const copy = messages[lang];
  const siteOrigin = getSiteOrigin();

  const breadcrumbSchema = useMemo(
    () => ({
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
          name: copy.navOpenClaw,
          item:
            initialOffset > 0
              ? `${siteOrigin}/${lang}/openclaw?offset=${initialOffset}`
              : `${siteOrigin}/${lang}/openclaw`,
        },
      ],
    }),
    [copy.navTrending, copy.navOpenClaw, siteOrigin, lang, initialOffset],
  );

  const itemListSchema = useMemo(() => {
    if (!loading && !error && skills.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        url:
          activeQuery || initialOffset <= 0
            ? `${siteOrigin}/${lang}/openclaw`
            : `${siteOrigin}/${lang}/openclaw?offset=${initialOffset}`,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: total || skills.length,
        startIndex: activeQuery ? 1 : initialOffset + 1,
        itemListElement: skills.map((skill, index) => {
          const [owner, repo] = skill.full_name.split("/");
          const detailUrl =
            owner && repo
              ? `${siteOrigin}/${lang}/skills/${encodeURIComponent(
                  owner,
                )}/${encodeURIComponent(repo)}`
              : `${siteOrigin}/${lang}/openclaw`;
          const description = toSnippet(
            lang === "zh"
              ? skill.description_zh || skill.description
              : skill.description || skill.description_zh,
            200,
          );
          return {
            "@type": "ListItem",
            position: (activeQuery ? 0 : initialOffset) + index + 1,
            item: {
              "@type": "SoftwareSourceCode",
              name: skill.full_name,
              url: detailUrl,
              codeRepository: skill.html_url,
              description,
              programmingLanguage: skill.language || undefined,
              keywords: skill.topics || undefined,
            },
          };
        }),
      };
    }
    return null;
  }, [loading, error, skills, activeQuery, initialOffset, siteOrigin, lang, total]);

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
          <h1>{copy.openclawTitle}</h1>
          <p>{copy.openclawSubtitle}</p>
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
              router.replace(`/${next}/openclaw${qs ? `?${qs}` : ""}`);
            }}
          />
        </div>
      </section>

      <nav className="browse-nav" aria-label="Browse">
        <a href={`/${lang}`}>{copy.navTrending}</a>
        <a href={`/${lang}/latest`}>{copy.navLatest}</a>
        <a href={`/${lang}/openclaw`} aria-current="page">
          {copy.navOpenClaw}
        </a>
      </nav>

      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = query.trim();
          if (trimmed) {
            trackSearch(`openclaw:${trimmed}`);
          }
          loadSkills(trimmed);
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
        />
        <button type="submit">{copy.search}</button>
      </form>

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
            activeQuery ? (
              <button
                type="button"
                onClick={() => loadSkills(activeQuery, offset + PAGE_SIZE, true)}
                disabled={loadingMore}
              >
                {loadingMore ? copy.loading : copy.loadMore}
              </button>
            ) : (
              <a
                className="pagination-link"
                href={`/${lang}/openclaw?offset=${offset + PAGE_SIZE}`}
                onClick={(event) => {
                  event.preventDefault();
                  loadSkills(activeQuery, offset + PAGE_SIZE, true);
                }}
                aria-disabled={loadingMore ? "true" : undefined}
              >
                {loadingMore ? copy.loading : copy.loadMore}
              </a>
            )
          ) : null}
        </div>
      )}
    </main>
  );
}
