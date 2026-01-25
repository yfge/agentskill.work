from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    repo_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    full_name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    description_zh: Mapped[str | None] = mapped_column(Text)
    html_url: Mapped[str] = mapped_column(String(512))
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str | None] = mapped_column(String(64))
    topics: Mapped[str | None] = mapped_column(Text)
    summary_en: Mapped[str | None] = mapped_column(Text)
    summary_zh: Mapped[str | None] = mapped_column(Text)
    key_features_en: Mapped[list[str] | None] = mapped_column(JSON)
    key_features_zh: Mapped[list[str] | None] = mapped_column(JSON)
    use_cases_en: Mapped[list[str] | None] = mapped_column(JSON)
    use_cases_zh: Mapped[list[str] | None] = mapped_column(JSON)
    seo_title_en: Mapped[str | None] = mapped_column(String(255))
    seo_title_zh: Mapped[str | None] = mapped_column(String(255))
    seo_description_en: Mapped[str | None] = mapped_column(Text)
    seo_description_zh: Mapped[str | None] = mapped_column(Text)
    content_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_pushed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    repo_created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), index=True
    )
    repo_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
