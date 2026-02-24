import { getApiBase } from "@/lib/apiBase";
import type { Skill, SkillListResponse } from "@/types/skill";

export interface FacetItem {
  value: string;
  count: number;
}

export interface FacetListResponse {
  items: FacetItem[];
}

/**
 * Revalidation times for different data types (ISR strategy)
 */
export const REVALIDATION_TIMES = {
  skills: 600, // 10 minutes - skill listings change frequently
  facets: 3600, // 1 hour - topics/languages change slowly
  metrics: 300, // 5 minutes - visitor metrics update often
  skillDetail: 86400, // 24 hours - individual skill data is stable
} as const;

const DEFAULT_REVALIDATE_SECONDS = REVALIDATION_TIMES.skills;

export async function fetchSkillsCached(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    topic?: string;
    language?: string;
    owner?: string;
    sort?: "stars" | "newest";
  } = {},
  revalidateSeconds: number = DEFAULT_REVALIDATE_SECONDS,
): Promise<SkillListResponse> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (options.topic) {
    params.set("topic", options.topic);
  }
  if (options.language) {
    params.set("language", options.language);
  }
  if (options.owner) {
    params.set("owner", options.owner);
  }
  if (options.sort) {
    params.set("sort", options.sort);
  }
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set("offset", String(options.offset));
  }
  const qs = params.toString();
  const url = `${trimmedBase}/skills${qs ? `?${qs}` : ""}`;

  // Avoid caching arbitrary search queries (high-cardinality); cache only the
  // default lists for SEO + faster TTFB.
  const response = await fetch(
    url,
    query ? { cache: "no-store" } : { next: { revalidate: revalidateSeconds } },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch skills");
  }

  return response.json();
}

export async function fetchFacetsCached(
  type: "topics" | "languages" | "owners",
  limit: number = 50,
): Promise<FacetListResponse> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/facets/${type}?limit=${limit}`;
  const response = await fetch(url, {
    next: { revalidate: REVALIDATION_TIMES.facets },
  });
  if (!response.ok) {
    return { items: [] };
  }
  return response.json();
}

export async function fetchRelatedSkillsCached(
  owner: string,
  repo: string,
  limit: number = 6,
): Promise<Skill[]> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/skills/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/related?limit=${limit}`;
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATION_TIMES.facets },
    });
    if (!response.ok) {
      return [];
    }
    const data: SkillListResponse = await response.json();
    return data.items;
  } catch {
    return [];
  }
}
