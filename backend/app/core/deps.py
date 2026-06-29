"""
Reusable FastAPI dependencies.

Import from here in routers:
    from app.core.deps import SessionDep
"""

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.core.database import get_session

# ── Type aliases for cleaner signatures ─────────────────────
SessionDep = Annotated[Session, Depends(get_session)]
