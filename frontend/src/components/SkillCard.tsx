"use client";
import { memo } from "react";
import Link from "next/link";

import { messages, type Language } from "@/lib/i18n";
import { getSkillDetailPath } from "@/lib/skills";
import { toSnippet } from "@/lib/text";
import { Skill } from "@/types/skill";

export const SkillCard = memo(function SkillCard({
  skill,
  descriptionOverride,
  lang,
}: {
  skill: Skill;
  descriptionOverride?: string | null;
  lang?: Language;
}) {
  const description = toSnippet(descriptionOverride ?? skill.description, 220);
  const detailPath = getSkillDetailPath(skill);
  const detailHref = lang ? `/${lang}${detailPath}` : detailPath;
  const noDescription =
    lang && messages[lang]?.detailNoDescription
      ? messages[lang].detailNoDescription
      : "No description yet.";
  const topics = (skill.topics || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
  return (
    <div className="card">
      <Link className="card-link" href={detailHref}>
        <div>
          <h3>{skill.full_name}</h3>
          <p>{description || noDescription}</p>
        </div>
        <div className="meta">
          <span>⭐ {skill.stars}</span>
          <span>🍴 {skill.forks}</span>
          <span>{skill.language || "Unknown"}</span>
        </div>
      </Link>
      {topics.length > 0 && lang && (
        <div className="card-topics">
          {topics.map((topic) => (
            <Link
              key={topic}
              className="card-topic"
              href={`/${lang}/topics/${encodeURIComponent(topic)}`}
              onClick={(e) => e.stopPropagation()}
            >
              {topic}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
