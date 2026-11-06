import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import (
    health,
    organization,
    customers,
    invoices,
    collections,
    email,
    conversations,
    reviews,
    reconciliation,
    payments,
    demo
)
from app.database import repository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sonic_ai.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed if database is empty
    logger.info("Starting Sonic AI Collections & Reconciliation API...")
    org = repository.get_organization()
    if not org:
        logger.info("Initializing pristine seed data on initial startup...")
        demo.reset_demo_database()
    yield
    logger.info("Shutting down Sonic AI API...")

app = FastAPI(
    title="Sonic AI - Collections & Bank Reconciliation Platform",
    description="Enterprise collections intelligence and deterministic bank statement reconciliation engine for AcmeCorp.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Allow full local dev accessibility
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(organization.router, prefix="/api", tags=["Organization"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(invoices.router, prefix="/api", tags=["Invoices"])
app.include_router(collections.router, prefix="/api", tags=["Collections"])
app.include_router(email.router, prefix="/api", tags=["Email & IMAP"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])
app.include_router(reviews.router, prefix="/api", tags=["Needs Attention Reviews"])
app.include_router(reconciliation.router, prefix="/api", tags=["Bank Reconciliation"])
app.include_router(payments.router, prefix="/api", tags=["Payments & Audit"])
app.include_router(demo.router, prefix="/api", tags=["Demo & System"])

@app.get("/")
def root():
    return {
        "service": "Sonic AI Backend API",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
