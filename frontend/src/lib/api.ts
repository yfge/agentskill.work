import { SkillListResponse } from "@/types/skill";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function fetchSkills(
  query: string,
  options: { limit?: number; offset?: number } = {},
): Promise<SkillListResponse> {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set("offset", String(options.offset));
  }
  const qs = params.toString();
  const url = `${base}/skills${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch skills");
  }

  return response.json();
}
