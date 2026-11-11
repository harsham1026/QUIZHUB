import os
import ssl
from datetime import timedelta
from urllib.parse import urlparse, parse_qs, urlunparse
from dotenv import load_dotenv

load_dotenv()


def _resolve_database_config():
    raw_uri = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
    )
    if raw_uri:
        parsed = urlparse(raw_uri)
        scheme = parsed.scheme
        if scheme in ("postgres", "postgresql"):
            scheme = "postgresql+pg8000"

        query_params = parse_qs(parsed.query)
        sslmode = query_params.get("sslmode", [""])[0].lower()

        # pg8000 does not accept libpq query parameters like sslmode/channel_binding in the URL
        clean_uri = urlunparse((
            scheme,
            parsed.netloc,
            parsed.path,
            "",
            "",
            "",
        ))

        engine_opts = {
            "pool_recycle": 280,
            "pool_pre_ping": True,
        }
        if scheme.startswith("postgresql+pg8000"):
            if sslmode != "disable" and (
                sslmode in ("require", "verify-ca", "verify-full")
                or "neon.tech" in (parsed.hostname or "")
                or "vercel" in (parsed.hostname or "")
            ):
                engine_opts["connect_args"] = {"ssl_context": ssl.create_default_context()}

        return clean_uri, engine_opts

    # Vercel serverless filesystem is read-only except /tmp
    if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        return "sqlite:////tmp/quizhub.db", {}

    return "sqlite:///quizhub.db", {}


_DB_URI, _DB_ENGINE_OPTIONS = _resolve_database_config()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "quizhub-ultra-secret-session-key-dev-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "quizhub-jwt-secret-token-key-dev-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")))

    SQLALCHEMY_DATABASE_URI = _DB_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _DB_ENGINE_OPTIONS

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
