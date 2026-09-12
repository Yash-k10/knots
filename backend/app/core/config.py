from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "KNOTS"
    ENVIRONMENT: str = "development"

    # CORS Origins (comma-separated string or list)
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ]

    # Database Settings
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres_password@localhost:5432/knots"
    )
    SYNC_DATABASE_URL: str = (
        "postgresql://postgres:postgres_password@localhost:5432/knots"
    )

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security Settings
    SECRET_KEY: str = (
        "super-secret-key-change-in-production-environments-jwt-token-signing"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth Settings
    GOOGLE_CLIENT_ID: str = (
        "852745392294-uk37vr6m0qkjq36f7u7jk66tuvc3t8v3.apps.googleusercontent.com"
    )
    ALLOWED_EMAIL_DOMAINS: list[str] = ["@sbjit.edu.in", "@sbjie.edu.in"]

    # SMTP / Email Service Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: str = "knots.sbjit@gmail.com"
    EMAILS_FROM_NAME: str = "KNOTS Campus Hub"

    @field_validator("ALLOWED_EMAIL_DOMAINS", mode="before")
    @classmethod
    def parse_allowed_domains(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [d.strip() for d in v.split(",") if d.strip()]
        return v

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [d.strip() for d in v.split(",") if d.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
export_settings = settings
