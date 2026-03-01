"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchSkills } from "@/lib/api";
import { normalizeClaudeSkill, toSnippet } from "@/lib/text";
import { getSkillDetailPath } from "@/lib/skills";
import type { Language } from "@/lib/i18n";
import type { Skill } from "@/types/skill";

export function FeaturedSkills({ lang }: { lang: Language }) {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetchSkills("", { sort: "stars", limit: 6 })
      .then((data) => setSkills(data.items))
      .catch(() => null);
  }, []);

  if (skills.length === 0) return null;

  return (
    <section className="featured-section">
      <h2>🔥 {lang === "zh" ? "精选 Skills" : "Featured Skills"}</h2>
      <div className="featured-grid">
        {skills.map((skill) => {
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
