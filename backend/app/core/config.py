from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Electoral Logistics API"
    app_env: str = "development"
    log_level: str = "info"
    database_url: str
    jwt_secret: str = "development-only-change-this-secret"
    model_artifact_dir: str = "/models"
    model_metrics_path: str = "/models/reports/model_quality_evaluation.json"
    model_version: str = "0.1.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
