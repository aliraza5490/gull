"""
Webhook & WebhookDelivery SQLModel table definitions.

These are the *database* models.  Request/response schemas live in
app/schemas/webhook.py.
"""

import uuid as _uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Webhook(SQLModel, table=True):
    """A registered webhook endpoint."""

    __tablename__ = "webhooks"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255, index=True)
    url: str = Field(max_length=2048)
    secret: str | None = Field(default=None, max_length=512)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class WebhookDelivery(SQLModel, table=True):
    """An individual delivery attempt for a webhook."""

    __tablename__ = "webhook_deliveries"

    id: _uuid.UUID = Field(default_factory=_uuid.uuid4, primary_key=True)
    webhook_id: _uuid.UUID = Field(foreign_key="webhooks.id", index=True)
    payload: str = Field(default="{}")
    status_code: int | None = Field(default=None)
    response_body: str | None = Field(default=None)
    success: bool = Field(default=False)
    attempt: int = Field(default=1)
    delivered_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
