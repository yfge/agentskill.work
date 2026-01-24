import { Language } from "@/lib/i18n";
import { normalizeClaudeSkill } from "@/lib/text";
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
          lang={lang}
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
