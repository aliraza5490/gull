"""
Webhook service – all DB operations for webhooks live here.

Routers should stay thin; complex logic belongs in services.
"""

import uuid
from datetime import datetime, timezone

from sqlmodel import Session, select, func

from app.models.webhook import Webhook
from app.schemas.webhook import WebhookCreate, WebhookUpdate


# ── CRUD ────────────────────────────────────────────────────
def create_webhook(*, session: Session, data: WebhookCreate) -> Webhook:
    webhook = Webhook.model_validate(data)
    session.add(webhook)
    session.commit()
    session.refresh(webhook)
    return webhook


def get_webhook(*, session: Session, webhook_id: uuid.UUID) -> Webhook | None:
    return session.get(Webhook, webhook_id)


def list_webhooks(
    *,
    session: Session,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Webhook], int]:
    """Return (items, total_count)."""
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(Webhook)
    total = session.exec(count_stmt).one()

    stmt = select(Webhook).offset(offset).limit(page_size).order_by(Webhook.created_at.desc())
    items = list(session.exec(stmt).all())

    return items, total


def update_webhook(
    *,
    session: Session,
    db_webhook: Webhook,
    data: WebhookUpdate,
) -> Webhook:
    update_data = data.model_dump(exclude_unset=True)
    db_webhook.sqlmodel_update(update_data)
    db_webhook.updated_at = datetime.now(timezone.utc)
    session.add(db_webhook)
    session.commit()
    session.refresh(db_webhook)
    return db_webhook


def delete_webhook(*, session: Session, db_webhook: Webhook) -> None:
    session.delete(db_webhook)
    session.commit()
