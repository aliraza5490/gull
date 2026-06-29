"""
Gull – Webhook Orchestration Platform

Entry point for the FastAPI application.
Run with:  fastapi dev app/main.py
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.api.router import api_router
from app.api.v1.receiver import router as receiver_router

# Import models so SQLModel registers them before create_all
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hook."""
    # Dev convenience: create tables if they don't exist.
    # In production, use Alembic migrations instead.
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────
app.include_router(api_router)
app.include_router(receiver_router)

