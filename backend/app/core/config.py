from pathlib import Path
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ROOT_DIR = _BACKEND_DIR.parent

_ENV_FILES = [
    str(_BACKEND_DIR / ".env"),
    str(_ROOT_DIR / ".env"),
    ".env",
]


class Settings(BaseSettings):
    PROJECT_NAME: str = "KNOTS"
    ENVIRONMENT: str = "development"

    # CORS Origins (comma-separated string or list)
    BACKEND_CORS_ORIGINS: list[str] | str = [
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
        "https://knots-frontend.onrender.com",
        "https://knots-backend-6snz.onrender.com",
    ]

    # Database Settings
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres.lvbrfajzcglykgxthcqg:zWD8jyBRttybHZfP@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
    )
    SYNC_DATABASE_URL: str = (
        "postgresql://postgres.lvbrfajzcglykgxthcqg:zWD8jyBRttybHZfP@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
    )

    # Redis Settings
    REDIS_URL: str = (
        "rediss://default:gQAAAAAAAnarAAIgcDI1YThkMzlhNWMwNGM0NDYyYTY4Zjg0NzlmOGVjYmU5MQ@informed-bull-161451.upstash.io:6379"
    )

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
    ALLOWED_EMAIL_DOMAINS: list[str] | str = ["@sbjit.edu.in", "@sbjie.edu.in"]

    # HTTP Email API Keys (Bypasses Render/Cloud SMTP port blocks over HTTPS 443)
    RESEND_API_KEY: str | None = None
    RESEND_FROM_EMAIL: str | None = (
        None  # e.g., "KNOTS <onboarding@resend.dev>" or "KNOTS <noreply@yourdomain.com>"
    )
    BREVO_API_KEY: str | None = None
    SENDGRID_API_KEY: str | None = None

    # SMTP / Email Service Settings (Fallback)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: str | None = "kanchangaikwad.aiml23@sbjit.edu.in"
    SMTP_PASSWORD: str | None = "duno wqxi sfkg cokb"
    EMAILS_FROM_EMAIL: str = "kanchangaikwad.aiml23@sbjit.edu.in"
    EMAILS_FROM_NAME: str = "KNOTS Campus Hub"

    # Gemini Configurations
    GEMINI_API_KEY: str | None = None

    @field_validator("DATABASE_URL", "SYNC_DATABASE_URL", mode="before")
    @classmethod
    def rewrite_supabase_pooler_port(cls, v: Any) -> Any:
        if isinstance(v, str) and "pooler.supabase.com:5432" in v:
            # Supabase Session Mode (:5432) has a strict limit of 15 connections (EMAXCONNSESSION).
            # Transaction Mode (:6543) enables pooled multi-tenant connections.
            return v.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")
        return v

    @field_validator("ALLOWED_EMAIL_DOMAINS", mode="before")
    @classmethod
    def parse_allowed_domains(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    import json

                    parsed = json.loads(v_trimmed)
                    if isinstance(parsed, list):
                        return [str(d).strip() for d in parsed if str(d).strip()]
                except Exception:
                    pass
            return [d.strip() for d in v_trimmed.split(",") if d.strip()]
        elif isinstance(v, (list, tuple, set)):
            return [str(d).strip() for d in v if str(d).strip()]
        return v

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    import json

                    parsed = json.loads(v_trimmed)
                    if isinstance(parsed, list):
                        return [str(d).strip() for d in parsed if str(d).strip()]
                except Exception:
                    pass
            return [d.strip() for d in v_trimmed.split(",") if d.strip()]
        elif isinstance(v, (list, tuple, set)):
            return [str(d).strip() for d in v if str(d).strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
export_settings = settings
