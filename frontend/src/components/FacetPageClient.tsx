"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { SkillList } from "@/components/SkillList";
import { fetchSkills } from "@/lib/api";
import { trackVisit } from "@/lib/metrics";
import {
  defaultLanguage,
  messages,
  setStoredLanguage,
  type Language,
} from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";
import { toSnippet } from "@/lib/text";
import { getVisitorId } from "@/lib/visitor";
import type { Skill } from "@/types/skill";

const PAGE_SIZE = 24;

type SkillFilters = {
  topic?: string;
  language?: string;
  owner?: string;
};

function withoutLangParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.delete("lang");
  next.delete("hl");
  return next;
}

export function FacetPageClient({
  lang: initialLang = defaultLanguage,
  path,
  heading,
  intro,
  filters,
  initialQuery = "",
  initialSkills = [],
  initialTotal = 0,
  initialOffset = 0,
}: {
  lang?: Language;
  path: string;
  heading: string;
  intro: string;
  filters: SkillFilters;
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
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  useEffect(() => {
    setStoredLanguage(lang);
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  }, [lang]);

  useEffect(() => {
    const id = getVisitorId();
    trackVisit(id).catch(() => null);
  }, []);

  const loadSkills = async (value: string, nextOffset = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchSkills(value, {
        ...filters,
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

  const copy = messages[lang];
  const siteOrigin = getSiteOrigin();
  const canonical = useMemo(
    () => `${siteOrigin}/${lang}${path}`,
    [lang, path, siteOrigin],
  );
  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: copy.homeLabel,
          item: `${siteOrigin}/${lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: heading,
          item: canonical,
        },
      ],
    }),
    [canonical, copy.homeLabel, heading, lang, siteOrigin],
  );

  const itemListSchema =
    !loading && !error && skills.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          url: canonical,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: total || skills.length,
          startIndex: 1,
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
              position: index + 1,
              url: detailUrl,
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
          <h1>{heading}</h1>
          <p>{intro}</p>
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
              router.replace(`/${next}${path}${qs ? `?${qs}` : ""}`);
            }}
          />
        </div>
      </section>

      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          loadSkills(query.trim());
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
          {skills.length < total && (
            <button
              type="button"
              onClick={() => loadSkills(activeQuery, offset + PAGE_SIZE, true)}
              disabled={loadingMore}
            >
              {loadingMore ? copy.loading : copy.loadMore}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
