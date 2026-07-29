from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "KNOTS"
    ENVIRONMENT: str = "development"

    # CORS Origins (comma-separated string or list)
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:3000",
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

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
export_settings = settings
