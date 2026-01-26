export function normalizeClaudeSkill(text?: string | null) {
  if (!text) {
    return text;
  }
  return text
    .replace(/Claude\s*技能/gi, "Claude Skill")
    .replace(/克劳德技能/gi, "Claude Skill");
}

export function compactWhitespace(text?: string | null) {
  if (!text) {
    return text;
  }
  return text.replace(/\s+/g, " ").trim();
}

export function truncateText(text: string, maxChars: number) {
  const chars = Array.from(text);
  if (chars.length <= maxChars) {
    return text;
  }
  if (maxChars <= 3) {
    return chars.slice(0, maxChars).join("");
  }
  return `${chars.slice(0, maxChars - 3).join("")}...`;
}

export function toSnippet(text?: string | null, maxChars: number = 200) {
  const normalized = normalizeClaudeSkill(text);
  const cleaned = compactWhitespace(normalized);
  if (!cleaned) {
    return undefined;
  }
  return truncateText(cleaned, maxChars);
}
