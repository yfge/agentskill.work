export interface Skill {
  id: number;
  repo_id: number;
  name: string;
  full_name: string;
  description?: string | null;
  description_zh?: string | null;
  html_url: string;
  stars: number;
  forks: number;
  language?: string | null;
  topics?: string | null;
  last_pushed_at?: string | null;
  fetched_at: string;
}

export interface SkillListResponse {
  total: number;
  items: Skill[];
}
