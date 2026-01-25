"use client";

import { useEffect, useState } from "react";
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
import { normalizeClaudeSkill } from "@/lib/text";
import { getVisitorId } from "@/lib/visitor";
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
}: {
  lang?: Language;
  initialQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(initialLang);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [activeQuery, setActiveQuery] = useState("");

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
    loadSkills(initialQuery.trim());
  }, [initialQuery]);

  useEffect(() => {
    const id = getVisitorId();
    trackVisit(id).catch(() => null);
  }, []);

  const copy = messages[lang];
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AgentSkill Hub",
    url: "https://agentskill.work",
    description: copy.subtitle,
    inLanguage: ["zh-CN", "en-US"],
    about: "Claude Skill projects on GitHub",
    publisher: {
      "@type": "Organization",
      name: "AgentSkill Hub",
      url: "https://agentskill.work",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `https://agentskill.work/${lang}?q={search_term_string}`,
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
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: skills.length,
          itemListElement: skills.map((skill, index) => {
            const [owner, repo] = skill.full_name.split("/");
            const detailUrl =
              owner && repo
                ? `https://agentskill.work/${lang}/skills/${encodeURIComponent(
                    owner,
                  )}/${encodeURIComponent(repo)}`
                : `https://agentskill.work/${lang}`;
            const description =
              lang === "zh"
                ? normalizeClaudeSkill(skill.description_zh || skill.description)
                : skill.description || skill.description_zh;
            return {
              "@type": "ListItem",
              position: index + 1,
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

      <section className="info">
        <div className="info-header">
          <h2>{copy.infoTitle}</h2>
          <p>{copy.infoSubtitle}</p>
        </div>
        <div className="info-grid">
          {copy.infoCards.map((card) => (
            <article key={card.title} className="info-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq">
        <div className="info-header">
          <h2>{copy.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {copy.faqItems.map((item) => (
            <article key={item.question} className="faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
