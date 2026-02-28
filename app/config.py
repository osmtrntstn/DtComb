import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration settings"""

    # Security
    SECRET_KEY: str = "9e222fe9-652f-4a63-afab-1909f76d4c5e"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "sqlite:///./app/db/dtcomb_data.db"

    # Admin Credentials (Should be in .env file)
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "adminPasword"

    # R Configuration
    R_HOME: str = os.getenv("R_HOME", "/usr/lib/R")

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list = ["http://localhost:8000"]

    # Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # Yeni nesil (v2) yapılandırma bloğu:
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # LD_LIBRARY_PATH hatasını bu satır çözer
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance"""
    try:
        return Settings()
    except Exception as e:
        print(f"Failed to load settings: {e}")
        raise e
