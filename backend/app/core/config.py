import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "sonic-ai-super-secret-development-key-32chars"
    API_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "sonic_ai"

    # LLM
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # SMTP Outbound Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_NAME: str = "AcmeCorp Accounts Receivables"

    # IMAP Inbound Email
    IMAP_HOST: str = "imap.gmail.com"
    IMAP_PORT: int = 993
    IMAP_USERNAME: Optional[str] = None
    IMAP_PASSWORD: Optional[str] = None

    # Customer Test Email
    CUSTOMER_TEST_EMAIL: Optional[str] = None

    # Testing reference date (YYYY-MM-DD)
    REFERENCE_DATE: Optional[str] = "2026-11-01"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
