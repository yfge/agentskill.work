"use client";

import { useEffect, useState } from "react";

import { LanguageToggle } from "@/components/LanguageToggle";
import { SkillList } from "@/components/SkillList";
import {
  defaultLanguage,
  getStoredLanguage,
  messages,
  normalizeLanguage,
  setStoredLanguage,
  type Language,
} from "@/lib/i18n";
import { fetchSkills } from "@/lib/api";
import { trackVisit } from "@/lib/metrics";
import { getVisitorId } from "@/lib/visitor";
import { Skill } from "@/types/skill";

const PAGE_SIZE = 24;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [activeQuery, setActiveQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang") || params.get("hl");
    if (urlLang) {
      const normalized = normalizeLanguage(urlLang);
      setLang(normalized);
      setStoredLanguage(normalized);
      document.documentElement.lang = normalized === "en" ? "en" : "zh-CN";
      return;
    }

    const stored = getStoredLanguage();
    if (stored) {
      setLang(stored);
      document.documentElement.lang = stored === "en" ? "en" : "zh-CN";
      return;
    }
    const navigatorLang = navigator.language;
    const normalized = normalizeLanguage(navigatorLang);
    setLang(normalized);
    document.documentElement.lang = normalized === "en" ? "en" : "zh-CN";
  }, []);

  const loadSkills = async (
    value: string,
    nextOffset = 0,
    append = false,
  ) => {
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
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q")?.trim() || "";
    if (initialQuery) {
      setQuery(initialQuery);
      loadSkills(initialQuery);
      return;
    }
    loadSkills("");
  }, []);

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
    inLanguage: ["zh-CN", "en"],
    about: "Claude Skill projects on GitHub",
    publisher: {
      "@type": "Organization",
      name: "AgentSkill Hub",
      url: "https://agentskill.work",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://agentskill.work/?q={search_term_string}",
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
