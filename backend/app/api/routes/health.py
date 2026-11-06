from fastapi import APIRouter
from app.core.config import settings
from app.database.mongodb import is_using_mock

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "app": "Sonic AI Collections & Reconciliation Engine",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "database_mode": "in-memory (mongomock)" if is_using_mock() else "live MongoDB",
        "gemini_configured": bool(settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_")),
        "smtp_configured": bool(settings.SMTP_USERNAME and not settings.SMTP_USERNAME.startswith("your_")),
        "imap_configured": bool(settings.IMAP_USERNAME and not settings.IMAP_USERNAME.startswith("your_"))
    }
