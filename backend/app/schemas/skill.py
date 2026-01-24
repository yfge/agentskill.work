from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SkillBase(BaseModel):
    repo_id: int
    name: str
    full_name: str
    description: str | None
    description_zh: str | None
    html_url: str
    stars: int
    forks: int
    language: str | None
    topics: str | None
    last_pushed_at: datetime | None


class SkillOut(SkillBase):
    id: int
    fetched_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SkillList(BaseModel):
    total: int
    items: list[SkillOut]
