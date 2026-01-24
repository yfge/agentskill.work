export function normalizeClaudeSkill(text?: string | null) {
  if (!text) {
    return text;
  }
  return text
    .replace(/Claude\s*技能/gi, "Claude Skill")
    .replace(/克劳德技能/gi, "Claude Skill");
}
