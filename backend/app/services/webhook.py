"""
Webhook service – DB operations for payloads, deliveries, and schema drift alerts.
"""

from typing import Optional, List, Tuple
from sqlmodel import Session, select, func, or_, and_

from app.models.webhook import (
    WebhookPayload,
    WebhookDelivery,
    SchemaDriftAlert,
)


# ── Webhook Payload Operations ────────────────────────────────
def create_payload(
    *,
    session: Session,
    endpoint_id: int,
    method: str,
    headers: dict,
    query_params: dict,
    raw_body: str,
    parsed_body: dict,
    content_type: str,
    is_drifted: bool = False,
) -> WebhookPayload:
    payload = WebhookPayload(
        endpoint_id=endpoint_id,
        method=method,
        headers=headers,
        query_params=query_params,
        raw_body=raw_body,
        parsed_body=parsed_body,
        content_type=content_type,
        is_drifted=is_drifted,
    )
    session.add(payload)
    session.commit()
    session.refresh(payload)
    return payload


def get_payload(*, session: Session, payload_id: int) -> Optional[WebhookPayload]:
    return session.get(WebhookPayload, payload_id)


def list_payloads(
    *,
    session: Session,
    endpoint_id: int,
    page: int = 1,
    page_size: int = 20,
    method: Optional[str] = None,
    success: Optional[bool] = None,
    search_query: Optional[str] = None,
) -> Tuple[List[WebhookPayload], int]:
    offset = (page - 1) * page_size

    # We query payloads for the endpoint
    conditions = [WebhookPayload.endpoint_id == endpoint_id]

    if method:
        conditions.append(WebhookPayload.method == method.upper())

    if search_query:
        search_pattern = f"%{search_query}%"
        conditions.append(
            or_(
                WebhookPayload.raw_body.like(search_pattern),
                WebhookPayload.content_type.like(search_pattern),
            )
        )

    if success is not None:
        # Check if deliveries succeed/fail
        # Join with WebhookDelivery to filter
        sub_stmt = (
            select(WebhookDelivery.payload_id)
            .where(WebhookDelivery.success == success)
            .subquery()
        )
        conditions.append(WebhookPayload.id.in_(select(sub_stmt)))

    where_clause = and_(*conditions) if len(conditions) > 1 else conditions[0]

    count_stmt = select(func.count()).select_from(WebhookPayload).where(where_clause)
    total = session.exec(count_stmt).one()

    stmt = (
        select(WebhookPayload)
        .where(where_clause)
        .offset(offset)
        .limit(page_size)
        .order_by(WebhookPayload.received_at.desc())
    )
    items = list(session.exec(stmt).all())

    return items, total


# ── Webhook Delivery Operations ───────────────────────────────
def create_delivery(
    *,
    session: Session,
    payload_id: int,
    destination_id: int,
    attempt: int,
    status_code: Optional[int],
    response_body: Optional[str],
    success: bool,
    latency_ms: int,
    error_message: Optional[str] = None,
) -> WebhookDelivery:
    delivery = WebhookDelivery(
        payload_id=payload_id,
        destination_id=destination_id,
        attempt=attempt,
        status_code=status_code,
        response_body=response_body,
        success=success,
        latency_ms=latency_ms,
        error_message=error_message,
    )
    session.add(delivery)
    session.commit()
    session.refresh(delivery)
    return delivery


def list_deliveries_for_payload(
    *, session: Session, payload_id: int
) -> List[WebhookDelivery]:
    stmt = select(WebhookDelivery).where(WebhookDelivery.payload_id == payload_id).order_by(WebhookDelivery.delivered_at.asc())
    return list(session.exec(stmt).all())


# ── Schema Drift Alerts ───────────────────────────────────────
def create_drift_alert(
    *, session: Session, endpoint_id: int, payload_id: int, message: str
) -> SchemaDriftAlert:
    alert = SchemaDriftAlert(
        endpoint_id=endpoint_id,
        payload_id=payload_id,
        message=message,
    )
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert


def list_drift_alerts(*, session: Session, endpoint_id: int) -> List[SchemaDriftAlert]:
    stmt = select(SchemaDriftAlert).where(SchemaDriftAlert.endpoint_id == endpoint_id).order_by(SchemaDriftAlert.created_at.desc())
    return list(session.exec(stmt).all())
