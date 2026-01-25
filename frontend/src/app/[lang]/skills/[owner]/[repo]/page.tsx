import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SkillDetailTracker } from "@/components/SkillDetailTracker";
import { SkillLangSwitch } from "@/components/SkillLangSwitch";
import { getApiBase } from "@/lib/apiBase";
import { messages, type Language } from "@/lib/i18n";
import { normalizeClaudeSkill } from "@/lib/text";
import { Skill } from "@/types/skill";

type PageProps = {
  params: Promise<{ lang: string; owner: string; repo: string }>;
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

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

async function fetchSkill(owner: string, repo: string): Promise<Skill | null> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/skills/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    return {};
  }

  const skill = await fetchSkill(resolvedParams.owner, resolvedParams.repo);
  if (!skill) {
    return {
      title: "Skill not found - AgentSkill Hub",
    };
  }

  const description =
    lang === "zh"
      ? normalizeClaudeSkill(skill.description_zh || skill.description) ||
        "Claude Skill 项目详情"
      : skill.description || skill.description_zh || "Claude Skill detail";

  const canonical = `https://agentskill.work/${lang}/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}`;
  const ogImagePath = `/${lang}/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}/opengraph-image`;

  return {
    title: `${skill.full_name} - AgentSkill Hub`,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `https://agentskill.work/zh/skills/${encodeURIComponent(
          resolvedParams.owner,
        )}/${encodeURIComponent(resolvedParams.repo)}`,
        "en-US": `https://agentskill.work/en/skills/${encodeURIComponent(
          resolvedParams.owner,
        )}/${encodeURIComponent(resolvedParams.repo)}`,
        "x-default": `https://agentskill.work/zh/skills/${encodeURIComponent(
          resolvedParams.owner,
        )}/${encodeURIComponent(resolvedParams.repo)}`,
      },
    },
    openGraph: {
      title: `${skill.full_name} - AgentSkill Hub`,
      description,
      url: canonical,
      siteName: "AgentSkill Hub",
      locale: lang === "en" ? "en_US" : "zh_CN",
      alternateLocale: [lang === "en" ? "zh_CN" : "en_US"],
      images: [{ url: ogImagePath }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${skill.full_name} - AgentSkill Hub`,
      description,
      images: [ogImagePath],
    },
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }

  const skill = await fetchSkill(resolvedParams.owner, resolvedParams.repo);
  if (!skill) {
    notFound();
  }

  const copy = messages[lang];
  const primaryDescription =
    lang === "zh"
      ? normalizeClaudeSkill(skill.description_zh || skill.description)
      : skill.description || skill.description_zh;
  const secondaryDescription = lang === "zh" ? skill.description : skill.description_zh;

  const topics = (skill.topics || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const lastPushedAt = formatDate(skill.last_pushed_at);
  const fetchedAt = formatDate(skill.fetched_at);

  const stats = [
    { label: copy.detailStars, value: skill.stars.toLocaleString() },
    { label: copy.detailForks, value: skill.forks.toLocaleString() },
    { label: copy.detailLanguage, value: skill.language || copy.detailUnknown },
    {
      label: copy.detailLastPushed,
      value: lastPushedAt || copy.detailUnknown,
    },
    {
      label: copy.detailLastSynced,
      value: fetchedAt || copy.detailUnknown,
    },
  ];

  const repoFacts = [
    { label: copy.detailOwner, value: resolvedParams.owner },
    { label: copy.detailRepo, value: resolvedParams.repo },
    { label: copy.detailFullName, value: skill.full_name },
    { label: copy.detailRepoId, value: skill.repo_id.toLocaleString() },
    { label: copy.detailGitHub, value: skill.html_url, href: skill.html_url },
  ];

  const canonical = `https://agentskill.work/${lang}/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: skill.full_name,
    description: primaryDescription || undefined,
    codeRepository: skill.html_url,
    programmingLanguage: skill.language || undefined,
    dateModified: skill.last_pushed_at || undefined,
    keywords: skill.topics || undefined,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy.homeLabel,
        item: `https://agentskill.work/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: skill.full_name,
        item: canonical,
      },
    ],
  };

  return (
    <main className="container detail">
      <SkillDetailTracker skillId={skill.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${lang}`}>{copy.homeLabel}</Link>
        <span>/</span>
        <span>{skill.full_name}</span>
      </nav>
      <div className="detail-header">
        <div className="detail-title">
          <p className="detail-eyebrow">Claude Skill</p>
          <h1>{skill.full_name}</h1>
          <p className="detail-description">
            {primaryDescription || copy.detailNoDescription}
          </p>
        </div>
        <SkillLangSwitch
          owner={resolvedParams.owner}
          repo={resolvedParams.repo}
          initialLang={lang}
        />
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <h2>{copy.detailOverview}</h2>
          <div className="stat-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat">
                <span className="stat-label">{stat.label}</span>
                <strong className="stat-value">{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <Link className="button" href={`/${lang}`}>
              {copy.backToList}
            </Link>
            <a
              className="button primary"
              href={skill.html_url}
              target="_blank"
              rel="noreferrer"
            >
              {copy.viewOnGitHub}
            </a>
          </div>
        </section>

        <section className="detail-card">
          <h2>{copy.detailRepoInfo}</h2>
          <div className="detail-list">
            {repoFacts.map((fact) => (
              <div key={fact.label} className="detail-list-row">
                <span className="detail-list-label">{fact.label}</span>
                <span className="detail-list-value">
                  {fact.href ? (
                    <a href={fact.href} target="_blank" rel="noreferrer">
                      {fact.value}
                    </a>
                  ) : (
                    fact.value
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="detail-card">
        <h2>{copy.detailSummary}</h2>
        <p className="detail-description">
          {primaryDescription || copy.detailNoDescription}
        </p>
        {secondaryDescription && secondaryDescription !== primaryDescription && (
          <div className="detail-alt">
            <span className="detail-alt-label">
              {lang === "zh" ? copy.detailOriginal : copy.detailTranslated}
            </span>
            <p>{secondaryDescription}</p>
          </div>
        )}
      </section>

      <section className="detail-card">
        <h2>{copy.detailTopics}</h2>
        {topics.length > 0 ? (
          <div className="detail-topics">
            {topics.map((topic) => (
              <span key={topic} className="detail-topic">
                {topic}
              </span>
            ))}
          </div>
        ) : (
          <p className="status">{copy.detailNoTopics}</p>
        )}
      </section>

      <p className="detail-source">
        {copy.detailSource}
        {fetchedAt || copy.detailUnknown}
      </p>
    </main>
  );
}
