import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def _resolve_database_uri() -> str:
    uri = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
    )
    if uri:
        # SQLAlchemy 2.x requires postgresql:// instead of postgres://
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql://", 1)
        return uri

    # Vercel serverless filesystem is read-only except /tmp
    if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        return "sqlite:////tmp/quizhub.db"

    return "sqlite:///quizhub.db"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "quizhub-ultra-secret-session-key-dev-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "quizhub-jwt-secret-token-key-dev-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")))

    SQLALCHEMY_DATABASE_URI = _resolve_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = (
        {"pool_recycle": 280, "pool_pre_ping": True}
        if ("mysql" in SQLALCHEMY_DATABASE_URI or "postgresql" in SQLALCHEMY_DATABASE_URI)
        else {}
    )

    # Gemini AI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,https://pesquiz.vercel.app",
        ).split(",")
    ]


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
