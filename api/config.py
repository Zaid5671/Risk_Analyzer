import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "AI-Powered MPLADS Monitoring and Analytics Platform"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "Production REST API for SIH PS 26102: Real-time tracking of anomalous "
        "cost estimates, duplicate works, fund expenditure anomalies, and SLA delays."
    )
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Security & Authentication (Phase 6.3)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    RATE_LIMIT_STORAGE_URL: str = os.getenv("RATE_LIMIT_STORAGE_URL", "memory://")
    DEMO_SEED_PASSWORD: str = os.getenv("DEMO_SEED_PASSWORD", "Mplads@Demo2026#")

    # Public demo deployments set DEMO_MODE=true to make account management read-only
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").strip().lower() in ("1", "true", "yes")

    # Governance summaries must be able to return every district (861) or MP in one call
    SUMMARY_MAX_LIMIT: int = 2000

    # Same fixed reference date the delay rule engine uses, so "days since sanction" is reproducible
    DATA_REFERENCE_DATE: str = "2026-09-05"

    def __init__(self):
        if not self.JWT_SECRET_KEY:
            raise RuntimeError(
                "FATAL: JWT_SECRET_KEY environment variable is not set. "
                "Set it in .env before starting the server."
            )


settings = Settings()
