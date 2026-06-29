"""
Webhook CRUD endpoints.

Thin router – delegates to app.services.webhook for all DB logic.
"""

import uuid

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import SessionDep
from app.schemas.webhook import (
    PaginatedResponse,
    WebhookCreate,
    WebhookRead,
    WebhookUpdate,
)
from app.services import webhook as webhook_service

router = APIRouter()


@router.post("/", response_model=WebhookRead, status_code=201)
def create_webhook(*, session: SessionDep, data: WebhookCreate):
    return webhook_service.create_webhook(session=session, data=data)


@router.get("/", response_model=PaginatedResponse[WebhookRead])
def list_webhooks(
    *,
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    items, total = webhook_service.list_webhooks(
        session=session, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{webhook_id}", response_model=WebhookRead)
def get_webhook(*, session: SessionDep, webhook_id: uuid.UUID):
    webhook = webhook_service.get_webhook(session=session, webhook_id=webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook


@router.patch("/{webhook_id}", response_model=WebhookRead)
def update_webhook(
    *, session: SessionDep, webhook_id: uuid.UUID, data: WebhookUpdate
):
    webhook = webhook_service.get_webhook(session=session, webhook_id=webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook_service.update_webhook(
        session=session, db_webhook=webhook, data=data
    )


@router.delete("/{webhook_id}", status_code=204)
def delete_webhook(*, session: SessionDep, webhook_id: uuid.UUID):
    webhook = webhook_service.get_webhook(session=session, webhook_id=webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    webhook_service.delete_webhook(session=session, db_webhook=webhook)
