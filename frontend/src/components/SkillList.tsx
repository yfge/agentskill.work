import { Language } from "@/lib/i18n";
import { Skill } from "@/types/skill";
import { SkillCard } from "@/components/SkillCard";

export function SkillList({
  skills,
  lang,
  emptyLabel,
}: {
  skills: Skill[];
  lang: Language;
  emptyLabel: string;
}) {
  if (!skills.length) {
    return <p className="status">{emptyLabel}</p>;
  }

  return (
    <div className="grid">
      {skills.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          descriptionOverride={
            lang === "zh"
              ? normalizeClaudeSkill(skill.description_zh || skill.description)
              : skill.description
          }
        />
      ))}
    </div>
  );
}

function normalizeClaudeSkill(text?: string | null) {
  if (!text) {
    return text;
  }
  return text
    .replace(/Claude\s*技能/gi, "Claude Skill")
    .replace(/克劳德技能/gi, "Claude Skill");
}
