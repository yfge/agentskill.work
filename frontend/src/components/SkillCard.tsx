import Link from "next/link";

import { getSkillDetailPath } from "@/lib/skills";
import { Skill } from "@/types/skill";

export function SkillCard({
  skill,
  descriptionOverride,
  lang,
}: {
  skill: Skill;
  descriptionOverride?: string | null;
  lang?: "zh" | "en";
}) {
  const description = descriptionOverride ?? skill.description;
  const detailPath = getSkillDetailPath(skill);
  const detailHref = lang ? `${detailPath}?lang=${lang}` : detailPath;
  return (
    <Link className="card" href={detailHref}>
      <div>
        <h3>{skill.full_name}</h3>
        <p>{description || "No description yet."}</p>
      </div>
      <div className="meta">
        <span>⭐ {skill.stars}</span>
        <span>🍴 {skill.forks}</span>
        <span>{skill.language || "Unknown"}</span>
      </div>
    </Link>
  );
}
