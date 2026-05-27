export interface Skill {
  id: number;
  repo_id: number;
  name: string;
  full_name: string;
  description?: string | null;
  description_zh?: string | null;
  summary_en?: string | null;
  summary_zh?: string | null;
  key_features_en?: string[] | null;
  key_features_zh?: string[] | null;
  use_cases_en?: string[] | null;
  use_cases_zh?: string[] | null;
  seo_title_en?: string | null;
  seo_title_zh?: string | null;
  seo_description_en?: string | null;
  seo_description_zh?: string | null;
  content_updated_at?: string | null;
  html_url: string;
  stars: number;
  forks: number;
  language?: string | null;
  topics?: string | null;
  topics_json?: string[] | null;
  skill_type?: string | null;
  platforms?: string[] | null;
  capabilities?: string[] | null;
  install_methods?: string[] | null;
  config_keys?: string[] | null;
  source_files?: string[] | null;
  readme_excerpt?: string | null;
  quality_score?: number | null;
  verification_status?: string | null;
  last_verified_at?: string | null;
  last_pushed_at?: string | null;
  repo_created_at?: string | null;
  repo_updated_at?: string | null;
  fetched_at: string;
}

export interface SkillListResponse {
  total: number;
  items: Skill[];
}
