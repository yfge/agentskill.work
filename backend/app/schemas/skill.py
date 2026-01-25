from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SkillBase(BaseModel):
    repo_id: int
    name: str
    full_name: str
    description: str | None
    description_zh: str | None
    summary_en: str | None = None
    summary_zh: str | None = None
    key_features_en: list[str] | None = None
    key_features_zh: list[str] | None = None
    use_cases_en: list[str] | None = None
    use_cases_zh: list[str] | None = None
    seo_title_en: str | None = None
    seo_title_zh: str | None = None
    seo_description_en: str | None = None
    seo_description_zh: str | None = None
    content_updated_at: datetime | None = None
    html_url: str
    stars: int
    forks: int
    language: str | None
    topics: str | None
    last_pushed_at: datetime | None
    repo_created_at: datetime | None = None
    repo_updated_at: datetime | None = None


class SkillOut(SkillBase):
    id: int
    fetched_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SkillList(BaseModel):
    total: int
    items: list[SkillOut]
