import type { MetadataRoute } from "next";

import { getApiBase } from "@/lib/apiBase";
import { Skill } from "@/types/skill";

const MAX_SITEMAP_ITEMS = 500;
const PAGE_SIZE = 100;

async function fetchSkills(): Promise<Skill[]> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  let offset = 0;
  const results: Skill[] = [];

  while (results.length < MAX_SITEMAP_ITEMS) {
    const url = `${trimmedBase}/skills?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      break;
    }
    const data = (await res.json()) as { total: number; items: Skill[] };
    results.push(...data.items);
    if (results.length >= data.total || data.items.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return results.slice(0, MAX_SITEMAP_ITEMS);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await fetchSkills();
  const now = new Date();
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: "https://agentskill.work/zh",
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: "https://agentskill.work/en",
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const skillEntries: MetadataRoute.Sitemap = [];
  for (const skill of items) {
    const [owner, repo] = skill.full_name.split("/");
    if (!owner || !repo) {
      continue;
    }
    const lastModified = skill.last_pushed_at ?? skill.fetched_at ?? now;
    for (const lang of ["zh", "en"] as const) {
      skillEntries.push({
        url: `https://agentskill.work/${lang}/skills/${encodeURIComponent(
          owner,
        )}/${encodeURIComponent(repo)}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  return [...baseEntries, ...skillEntries];
}
