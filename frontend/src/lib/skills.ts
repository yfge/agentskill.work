import { Skill } from "@/types/skill";

export function getSkillDetailPath(skill: Skill): string {
  if (!skill.full_name) {
    return skill.html_url || "#";
  }
  const [owner, repo] = skill.full_name.split("/");
  if (!owner || !repo) {
    return skill.html_url || "#";
  }
  return `/skills/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
