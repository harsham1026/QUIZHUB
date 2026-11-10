import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "quizhub-ultra-secret-session-key-dev-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "quizhub-jwt-secret-token-key-dev-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")))
    
    # Database config: default to MySQL, with graceful fallback to sqlite for dev if desired
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///quizhub.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
    } if "mysql" in os.getenv("DATABASE_URL", "sqlite:///quizhub.db") else {}

    # Gemini AI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # CORS
    CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")]

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

