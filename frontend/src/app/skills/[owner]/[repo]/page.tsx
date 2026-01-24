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
  params: Promise<{ owner: string; repo: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

function resolveLanguage(value?: string): Language {
  return value?.toLowerCase() === "en" ? "en" : "zh";
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

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const lang = resolveLanguage(resolvedSearch?.lang);
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

  const canonical = `https://agentskill.work/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}`;

  return {
    title: `${skill.full_name} - AgentSkill Hub`,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `${canonical}?lang=zh`,
        "en-US": `${canonical}?lang=en`,
      },
    },
    openGraph: {
      title: `${skill.full_name} - AgentSkill Hub`,
      description,
      url: canonical,
      siteName: "AgentSkill Hub",
      locale: lang === "en" ? "en_US" : "zh_CN",
      alternateLocale: [lang === "en" ? "zh_CN" : "en_US"],
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${skill.full_name} - AgentSkill Hub`,
      description,
    },
  };
}

export default async function SkillDetailPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const lang = resolveLanguage(resolvedSearch?.lang);
  const skill = await fetchSkill(resolvedParams.owner, resolvedParams.repo);
  if (!skill) {
    notFound();
  }

  const description =
    lang === "zh"
      ? normalizeClaudeSkill(skill.description_zh || skill.description)
      : skill.description || skill.description_zh;
  const copy = messages[lang];

  const topics = (skill.topics || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const lastPushedAt = skill.last_pushed_at
    ? new Date(skill.last_pushed_at).toISOString().slice(0, 10)
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: skill.full_name,
    description: description || undefined,
    codeRepository: skill.html_url,
    programmingLanguage: skill.language || undefined,
    dateModified: skill.last_pushed_at || undefined,
    keywords: skill.topics || undefined,
  };

  return (
    <main className="container detail">
      <SkillDetailTracker skillId={skill.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="detail-header">
        <div className="detail-title">
          <p className="detail-eyebrow">Claude Skill</p>
          <h1>{skill.full_name}</h1>
          <p className="detail-description">
            {description || "No description yet."}
          </p>
        </div>
        <SkillLangSwitch
          owner={resolvedParams.owner}
          repo={resolvedParams.repo}
          initialLang={lang}
        />
      </div>

      <div className="detail-meta">
        <span>⭐ {skill.stars}</span>
        <span>🍴 {skill.forks}</span>
        <span>{skill.language || "Unknown"}</span>
        {lastPushedAt && <span>Updated {lastPushedAt}</span>}
      </div>

      {topics.length > 0 && (
        <div className="detail-topics">
          {topics.map((topic) => (
            <span key={topic} className="detail-topic">
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="detail-actions">
        <Link className="button" href="/">
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
    </main>
  );
}
