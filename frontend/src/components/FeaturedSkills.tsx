"use client";

import Link from "next/link";

import { normalizeClaudeSkill, toSnippet } from "@/lib/text";
import { getSkillDetailPath } from "@/lib/skills";
import type { Language } from "@/lib/i18n";
import type { Skill } from "@/types/skill";

export function FeaturedSkills({ lang, initialSkills = [] }: { lang: Language; initialSkills?: Skill[] }) {
  if (initialSkills.length === 0) return null;

  return (
    <section className="featured-section">
      <h2>🔥 {lang === "zh" ? "精选 Skills" : "Featured Skills"}</h2>
      <div className="featured-grid">
        {initialSkills.map((skill) => {
          const desc = toSnippet(
            lang === "zh"
              ? normalizeClaudeSkill(skill.description_zh || skill.description)
              : skill.description || skill.description_zh,
            120,
          );
          const detailPath = getSkillDetailPath(skill);
          const href = `/${lang}${detailPath}`;
          return (
            <Link key={skill.id} className="featured-card" href={href}>
              <h3>{skill.full_name}</h3>
              <p>{desc || "No description"}</p>
              <div className="meta">
                <span>⭐ {skill.stars}</span>
                <span>🍴 {skill.forks}</span>
                <span>{skill.language || "Unknown"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
