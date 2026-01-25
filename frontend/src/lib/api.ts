import { getApiBase } from "@/lib/apiBase";
import { SkillListResponse } from "@/types/skill";

export async function fetchSkills(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    topic?: string;
    language?: string;
    owner?: string;
    sort?: "stars" | "newest";
  } = {},
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

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch skills");
  }

  return response.json();
}
