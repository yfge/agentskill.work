"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { PageBottomSections } from "@/components/PageBottomSections";
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
import { normalizeClaudeSkill, toSnippet } from "@/lib/text";
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

export function HomePageClient({
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

  const loadSkills = async (value: string, nextOffset = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchSkills(value, {
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
  };

  useEffect(() => {
    setQuery(initialQuery);
    setSkills(initialSkills);
    setTotal(initialTotal);
    setOffset(initialOffset);
    setActiveQuery(initialQuery.trim());
  }, [initialQuery, initialSkills, initialTotal, initialOffset]);

  useEffect(() => {
    const id = getVisitorId();
    trackVisit(id).catch(() => null);
  }, []);

  const copy = messages[lang];
  const siteOrigin = getSiteOrigin();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "agentskill.work",
    url: siteOrigin,
    description: copy.subtitle,
    inLanguage: ["zh-CN", "en-US"],
    about: "Claude Skill projects on GitHub",
    publisher: {
      "@type": "Organization",
      name: "agentskill.work",
      url: siteOrigin,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteOrigin}/${lang}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const itemListSchema =
    !loading && !error && skills.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          url:
            activeQuery || initialOffset <= 0
              ? `${siteOrigin}/${lang}`
              : `${siteOrigin}/${lang}?offset=${initialOffset}`,
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
                : `${siteOrigin}/${lang}`;
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
        }
      : null;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <section className="hero">
        <div className="hero-text">
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
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
              router.replace(`/${next}${qs ? `?${qs}` : ""}`);
            }}
          />
        </div>
      </section>

      <nav className="browse-nav" aria-label="Browse">
        <a href={`/${lang}`} aria-current="page">
          {copy.navTrending}
        </a>
        <a href={`/${lang}/latest`}>{copy.navLatest}</a>
      </nav>

      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = query.trim();
          if (trimmed) {
            trackSearch(trimmed);
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
                href={`/${lang}?offset=${offset + PAGE_SIZE}`}
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
      <PageBottomSections lang={lang} />
    </main>
  );
}
