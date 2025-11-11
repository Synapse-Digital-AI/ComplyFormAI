from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Environment: development (local) or production (render)
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database URLs
    DATABASE_URL_LOCAL: str = os.getenv(
        "DATABASE_URL_LOCAL",
        "postgresql://postgres.lfizixmiqrspdskubdyj:sgnAdmin11%24%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
    )
    DATABASE_URL_PRODUCTION: str = os.getenv(
        "DATABASE_URL_PRODUCTION",
        "postgresql://postgres:sgnAdmin11%24%24@db.lfizixmiqrspdskubdyj.supabase.co:5432/postgres"
    )

    # Automatically select database URL based on environment
    @property
    def DATABASE_URL(self) -> str:
        """Automatically switch between local and production based on ENVIRONMENT"""
        if self.ENVIRONMENT == "production":
            return self.DATABASE_URL_PRODUCTION
        return self.DATABASE_URL_LOCAL

    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "ComplyForm API"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = "ignore"

settings = Settings()