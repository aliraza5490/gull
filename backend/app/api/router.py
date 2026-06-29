"""
Central router aggregator.

Every feature router is included here with a versioned prefix.
Import this single router in main.py.
"""

from fastapi import APIRouter

from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["Webhooks"])
api_router.include_router(workspaces_router, prefix="/workspaces", tags=["Workspaces"])
