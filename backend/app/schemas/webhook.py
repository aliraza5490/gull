"""
Request / response schemas for the webhook endpoints.

Keeping schemas separate from table models lets you control exactly
what the API accepts and returns without leaking internal columns.
"""

import uuid
from datetime import datetime

from sqlmodel import SQLModel


# ── Create / Update ─────────────────────────────────────────
class WebhookCreate(SQLModel):
    name: str
    url: str
    secret: str | None = None
    is_active: bool = True


class WebhookUpdate(SQLModel):
    name: str | None = None
    url: str | None = None
    secret: str | None = None
    is_active: bool | None = None


# ── Read ────────────────────────────────────────────────────
class WebhookRead(SQLModel):
    id: uuid.UUID
    name: str
    url: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class WebhookDeliveryRead(SQLModel):
    id: uuid.UUID
    webhook_id: uuid.UUID
    payload: str
    status_code: int | None
    response_body: str | None
    success: bool
    attempt: int
    delivered_at: datetime


# ── Generic list wrapper ────────────────────────────────────
class PaginatedResponse[T](SQLModel):
    """Generic paginated response wrapper."""
    items: list[T]
    total: int
    page: int
    page_size: int
