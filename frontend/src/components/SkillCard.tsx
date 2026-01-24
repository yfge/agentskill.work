import { Skill } from "@/types/skill";

export function SkillCard({
  skill,
  descriptionOverride,
}: {
  skill: Skill;
  descriptionOverride?: string | null;
}) {
  const description = descriptionOverride ?? skill.description;
  return (
    <a className="card" href={skill.html_url} target="_blank" rel="noreferrer">
      <div>
        <h3>{skill.full_name}</h3>
        <p>{description || "No description yet."}</p>
      </div>
      <div className="meta">
        <span>⭐ {skill.stars}</span>
        <span>🍴 {skill.forks}</span>
        <span>{skill.language || "Unknown"}</span>
      </div>
    </a>
  );
}
