from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    database_url: str = "sqlite+pysqlite:///./agentskill.db"
    redis_url: str = "redis://localhost:6379/0"

    # Database connection pool settings
    db_pool_size: int = 20
    db_pool_max_overflow: int = 10
    db_pool_recycle: int = 3600
    db_pool_timeout: int = 30
    db_echo: bool = False

    github_token: str | None = None
    github_search_query: str = (
        '"claude skill" OR "agent skill" OR openclaw in:name,description,topics'
    )
    github_search_per_page: int = 30
    github_max_pages: int = 5
    github_max_results: int = 300
    github_rate_limit_buffer: int = 2
    github_newest_window_days: int = 7
    github_newest_max_pages: int = 2
    github_newest_max_results: int = 100

    sync_interval_minutes: int = 60
    sync_on_start: bool = True
    enable_scheduler: bool = True
    enable_translation: bool = False
    enable_enrichment: bool = False
    sync_api_enabled: bool = False
    sync_api_token: str | None = None

    celery_broker_url: str | None = None
    celery_result_backend: str | None = None

    deepseek_api_key: str | None = None
    deepseek_api_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    enrich_interval_minutes: int = 180
    enrich_batch_size: int = 5

    cors_origins: str = Field(default="http://localhost:3000,http://localhost:8083")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
