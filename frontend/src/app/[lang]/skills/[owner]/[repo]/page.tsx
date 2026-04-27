import { Suspense } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

import { BackButton } from "@/components/BackButton";
import { InstallCTA } from "@/components/InstallCTA";
import { GitHubLink } from "@/components/GitHubLink";
import { RelatedSkills } from "@/components/RelatedSkills";
import { SkillDetailTracker } from "@/components/SkillDetailTracker";
import { SkillLangSwitch } from "@/components/SkillLangSwitch";
import { getApiBase } from "@/lib/apiBase";
import { messages, type Language } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";
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

function splitParagraphs(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function fetchSkill(owner: string, repo: string): Promise<Skill | null> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/skills/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

type GitHubRepository = {
  full_name?: string;
  html_url?: string;
};

async function resolveGitHubRepositoryRedirect(
  owner: string,
  repo: string,
): Promise<{ owner: string; repo: string } | null> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as GitHubRepository;
  const [resolvedOwner, resolvedRepo] = (data.full_name || "").split("/");
  if (!resolvedOwner || !resolvedRepo) {
    return null;
  }
  if (resolvedOwner === owner && resolvedRepo === repo) {
    return null;
  }
  return { owner: resolvedOwner, repo: resolvedRepo };
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(stars);
}

function getFirstUseCase(skill: Skill, lang: "zh" | "en"): string | null {
  const useCases = lang === "zh" ? skill.use_cases_zh : skill.use_cases_en;
  if (useCases && useCases.length > 0) {
    const first = useCases[0].slice(0, 30);
    return first.length < useCases[0].length ? `${first}...` : first;
  }
  const features = lang === "zh" ? skill.key_features_zh : skill.key_features_en;
  if (features && features.length > 0) {
    const first = features[0].slice(0, 30);
    return first.length < features[0].length ? `${first}...` : first;
  }
  return null;
}

function generateTitle(skill: Skill, lang: "zh" | "en"): string {
  const seoTitle = lang === "zh" ? skill.seo_title_zh : skill.seo_title_en;
  if (seoTitle) {
    return seoTitle;
  }
  const stars = formatStars(skill.stars);
  const useCase = getFirstUseCase(skill, lang);
  if (useCase) {
    return `${skill.full_name} — Claude Skill | ⭐${stars} | ${useCase}`;
  }
  return `${skill.full_name} — Claude Skill | ⭐${stars}`;
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
      title: "Skill not found - agentskill.work",
    };
  }

  const title = generateTitle(skill, lang);
  const description =
    lang === "zh"
      ? normalizeClaudeSkill(
          skill.seo_description_zh ||
            skill.summary_zh ||
            skill.description_zh ||
            skill.description,
        ) || "Claude Skill 项目详情"
      : skill.seo_description_en ||
        skill.summary_en ||
        skill.description ||
        skill.description_zh ||
        "Claude Skill detail";

  const siteOrigin = getSiteOrigin();
  const canonical = `${siteOrigin}/${lang}/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}`;
  const ogImagePath = `/${lang}/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": `${siteOrigin}/zh/skills/${encodeURIComponent(
          resolvedParams.owner,
        )}/${encodeURIComponent(resolvedParams.repo)}`,
        "en-US": `${siteOrigin}/en/skills/${encodeURIComponent(
          resolvedParams.owner,
        )}/${encodeURIComponent(resolvedParams.repo)}`,
        "x-default": `${siteOrigin}/zh/skills/${encodeURIComponent(
          resolvedParams.owner,
        )}/${encodeURIComponent(resolvedParams.repo)}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "agentskill.work",
      locale: lang === "en" ? "en_US" : "zh_CN",
      alternateLocale: [lang === "en" ? "zh_CN" : "en_US"],
      images: [{ url: ogImagePath }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
    const renamedRepo = await resolveGitHubRepositoryRedirect(
      resolvedParams.owner,
      resolvedParams.repo,
    );
    if (renamedRepo) {
      permanentRedirect(
        `/${lang}/skills/${encodeURIComponent(renamedRepo.owner)}/${encodeURIComponent(
          renamedRepo.repo,
        )}`,
      );
    }

    const query = `${resolvedParams.owner}/${resolvedParams.repo}`;
    permanentRedirect(`/${lang}?q=${encodeURIComponent(query)}`);
  }

  const copy = messages[lang];
  const summary =
    lang === "zh"
      ? normalizeClaudeSkill(
          skill.summary_zh || skill.description_zh || skill.description,
        )
      : skill.summary_en || skill.description || skill.description_zh;
  const heroDescription =
    lang === "zh"
      ? normalizeClaudeSkill(skill.seo_description_zh || summary)
      : skill.seo_description_en || summary;
  const secondaryDescription = lang === "zh" ? skill.description : skill.description_zh;
  const keyFeatures = lang === "zh" ? skill.key_features_zh : skill.key_features_en;
  const useCases = lang === "zh" ? skill.use_cases_zh : skill.use_cases_en;

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

  const siteOrigin = getSiteOrigin();
  const canonical = `${siteOrigin}/${lang}/skills/${encodeURIComponent(
    resolvedParams.owner,
  )}/${encodeURIComponent(resolvedParams.repo)}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: skill.full_name,
    description: summary || undefined,
    url: canonical,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    codeRepository: skill.html_url,
    programmingLanguage: skill.language || undefined,
    dateModified: skill.last_pushed_at || undefined,
    dateCreated: skill.repo_created_at || undefined,
    datePublished: skill.repo_created_at || undefined,
    author: {
      "@type": "Person",
      name: resolvedParams.owner,
      url: `https://github.com/${encodeURIComponent(resolvedParams.owner)}`,
    },
    keywords: skill.topics || undefined,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: skill.stars,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "CreateAction" },
        userInteractionCount: skill.forks,
      },
    ],
  };

  // FAQ schema — generated from key_features, use_cases, summary, language
  const faqEntries: { question: string; answer: string }[] = [];
  if (keyFeatures && keyFeatures.length > 0) {
    faqEntries.push({
      question:
        lang === "zh"
          ? `${skill.full_name} 有哪些主要特性？`
          : `What are the key features of ${skill.full_name}?`,
      answer: keyFeatures.join("; "),
    });
  }
  if (useCases && useCases.length > 0) {
    faqEntries.push({
      question:
        lang === "zh"
          ? `${skill.full_name} 有哪些使用场景？`
          : `What are the use cases of ${skill.full_name}?`,
      answer: useCases.join("; "),
    });
  }
  if (summary) {
    faqEntries.push({
      question:
        lang === "zh" ? `${skill.full_name} 是什么？` : `What is ${skill.full_name}?`,
      answer: summary,
    });
  }
  if (skill.language) {
    faqEntries.push({
      question:
        lang === "zh"
          ? `${skill.full_name} 使用什么编程语言？`
          : `What programming language does ${skill.full_name} use?`,
      answer:
        lang === "zh"
          ? `${skill.full_name} 主要使用 ${skill.language} 编写。`
          : `${skill.full_name} is primarily written in ${skill.language}.`,
    });
  }
  faqEntries.push({
    question:
      lang === "zh"
        ? `如何安装 ${skill.full_name}？`
        : `How to install ${skill.full_name}?`,
    answer:
      lang === "zh"
        ? `运行命令：openclaw install ${skill.full_name}`
        : `Run: openclaw install ${skill.full_name}`,
  });
  const faqSchema =
    faqEntries.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: entry.answer,
            },
          })),
        }
      : null;

  const breadcrumbSchema = {
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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${lang}`}>{copy.homeLabel}</Link>
        <span>/</span>
        <span>{skill.full_name}</span>
      </nav>

      <article itemScope itemType="https://schema.org/SoftwareSourceCode">
        <div className="detail-header">
          <div className="detail-title">
            <p className="detail-eyebrow">Claude Skill</p>
            <h1 itemProp="name">{skill.full_name}</h1>
            <p className="detail-description" itemProp="description">
              {heroDescription || copy.detailNoDescription}
            </p>
          </div>
          <SkillLangSwitch
            owner={resolvedParams.owner}
            repo={resolvedParams.repo}
            initialLang={lang}
          />
        </div>
        {skill.language && (
          <meta itemProp="programmingLanguage" content={skill.language} />
        )}

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
              <BackButton className="button" fallbackHref={`/${lang}`}>
                {copy.backToList}
              </BackButton>
              <GitHubLink
                className="button primary"
                href={skill.html_url}
                repoFullName={skill.full_name}
              >
                {copy.viewOnGitHub}
              </GitHubLink>
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

        <InstallCTA fullName={skill.full_name} htmlUrl={skill.html_url} lang={lang} />

        <section className="detail-card">
          <h2>{copy.detailSummary}</h2>
          {splitParagraphs(summary).length > 0 ? (
            splitParagraphs(summary).map((paragraph) => (
              <p key={paragraph} className="detail-description">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="detail-description">{copy.detailNoDescription}</p>
          )}
          {secondaryDescription && secondaryDescription !== summary && (
            <div className="detail-alt">
              <span className="detail-alt-label">
                {lang === "zh" ? copy.detailOriginal : copy.detailTranslated}
              </span>
              <p>{secondaryDescription}</p>
            </div>
          )}
        </section>

        {(keyFeatures?.length || 0) > 0 && (
          <section className="detail-card">
            <h2>{copy.detailKeyFeatures}</h2>
            <ul className="detail-bullets">
              {(keyFeatures || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {(useCases?.length || 0) > 0 && (
          <section className="detail-card">
            <h2>{copy.detailUseCases}</h2>
            <ul className="detail-bullets">
              {(useCases || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="detail-card">
          <h2>{copy.detailTopics}</h2>
          {topics.length > 0 ? (
            <div className="detail-topics">
              {topics.map((topic) => (
                <Link
                  key={topic}
                  className="detail-topic"
                  href={`/${lang}/topics/${encodeURIComponent(topic)}`}
                >
                  {topic}
                </Link>
              ))}
            </div>
          ) : (
            <p className="status">{copy.detailNoTopics}</p>
          )}
        </section>
      </article>

      <section className="detail-card">
        <h2>{copy.detailExplore}</h2>
        <div className="detail-topics">
          <Link
            className="detail-topic"
            href={`/${lang}/owners/${encodeURIComponent(resolvedParams.owner)}`}
          >
            {copy.detailOwner}: {resolvedParams.owner}
          </Link>
          {skill.language && (
            <Link
              className="detail-topic"
              href={`/${lang}/languages/${encodeURIComponent(skill.language)}`}
            >
              {copy.detailLanguage}: {skill.language}
            </Link>
          )}
        </div>
      </section>

      <Suspense>
        <RelatedSkills
          owner={resolvedParams.owner}
          repo={resolvedParams.repo}
          lang={lang}
        />
      </Suspense>

      <p className="detail-source">
        {copy.detailSource}
        {fetchedAt || copy.detailUnknown}
      </p>
    </main>
  );
}
