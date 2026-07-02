import os
import logging
from alembic.config import Config
from alembic import command

logger = logging.getLogger("app.migrations")


def run_migrations() -> None:
    """Run Alembic migrations programmatically to the latest head."""
    logger.info("Running database migrations...")
    try:
        # Path to alembic.ini relative to this file
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        ini_path = os.path.join(base_dir, "alembic.ini")

        if not os.path.exists(ini_path):
            raise FileNotFoundError(f"Alembic configuration not found at {ini_path}")

        cfg = Config(ini_path)
        
        # Set absolute path to the migrations directory to make it working-directory independent
        script_location = os.path.join(base_dir, "alembic")
        cfg.set_main_option("script_location", script_location)

        # Run upgrade to head
        command.upgrade(cfg, "head")
        logger.info("Database migrations completed successfully.")
    except Exception as e:
        logger.error(f"Failed to run database migrations: {e}")
        raise e
