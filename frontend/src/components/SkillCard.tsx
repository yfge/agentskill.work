import Link from "next/link";

import { messages, type Language } from "@/lib/i18n";
import { getSkillDetailPath } from "@/lib/skills";
import { toSnippet } from "@/lib/text";
import { Skill } from "@/types/skill";

export function SkillCard({
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
  return (
    <Link className="card" href={detailHref}>
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
  );
}
