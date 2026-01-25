import { getApiBase } from "@/lib/apiBase";
import type { SkillListResponse } from "@/types/skill";

const DEFAULT_REVALIDATE_SECONDS = 600;

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
