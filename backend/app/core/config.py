"""
Application settings – loaded from environment variables via pydantic-settings.

Usage:
    from app.core.config import settings
    print(settings.DATABASE_URL)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration.  Values are read from .env or environment
    variables; defaults are used when nothing is set.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "Gull"
    APP_ENV: str = "development"  # development | staging | production
    DEBUG: bool = True

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str = "postgresql://gull_user:gull_pass@localhost:5432/gull_db"

    # ── Security ─────────────────────────────────────────
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()
