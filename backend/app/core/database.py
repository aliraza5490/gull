"""
Database engine, session factory, and table creation helper.

Usage:
    from app.core.database import get_session

    # FastAPI dependency
    async def my_endpoint(session: Session = Depends(get_session)):
        ...
"""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# ── Engine ──────────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)


# ── Session dependency ──────────────────────────────────────
def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel Session scoped to a single request."""
    with Session(engine) as session:
        yield session


# ── Table creation (dev only – prefer Alembic for prod) ─────
def create_db_and_tables() -> None:
    """Create all tables registered via SQLModel.metadata."""
    SQLModel.metadata.create_all(engine)
