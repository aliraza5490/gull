"""
Webhook service – all DB operations for workspaces, endpoints, destinations,
payloads, and deliveries live here.
"""

import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from sqlmodel import Session, select, func, or_, and_

from app.models.webhook import (
    User,
    Workspace,
    WorkspaceMember,
    ReceiverEndpoint,
    Destination,
    WebhookPayload,
    WebhookDelivery,
    SchemaDriftAlert,
    SessionShare,
    EndpointType,
)
from app.schemas.webhook import (
    ReceiverEndpointCreate,
    ReceiverEndpointUpdate,
    DestinationCreate,
    DestinationUpdate,
)


# ── User & Workspace Operations ───────────────────────────────
def create_user(*, session: Session, email: str, hashed_password: str) -> User:
    user = User(email=email, hashed_password=hashed_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def get_user_by_email(*, session: Session, email: str) -> Optional[User]:
    stmt = select(User).where(User.email == email)
    return session.exec(stmt).first()


def create_workspace(*, session: Session, name: str) -> Workspace:
    workspace = Workspace(name=name)
    session.add(workspace)
    session.commit()
    session.refresh(workspace)
    return workspace


def get_workspace(*, session: Session, workspace_id: uuid.UUID) -> Optional[Workspace]:
    return session.get(Workspace, workspace_id)


def add_workspace_member(
    *, session: Session, workspace_id: uuid.UUID, user_id: uuid.UUID, role: str
) -> WorkspaceMember:
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


def get_workspace_member(
    *, session: Session, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> Optional[WorkspaceMember]:
    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    )
    return session.exec(stmt).first()


def get_workspaces_for_user(*, session: Session, user_id: uuid.UUID) -> List[Workspace]:
    stmt = (
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
    )
    return list(session.exec(stmt).all())


# ── Receiver Endpoint Operations ──────────────────────────────
def create_endpoint(
    *, session: Session, workspace_id: uuid.UUID, data: ReceiverEndpointCreate
) -> ReceiverEndpoint:
    expires_at = data.expires_at
    if data.type == EndpointType.TEMPORARY and not expires_at:
        # Default temporary endpoint to expire in 24 hours
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    endpoint = ReceiverEndpoint(
        workspace_id=workspace_id,
        name=data.name,
        slug=data.slug,
        type=data.type,
        secret=data.secret,
        is_active=data.is_active,
        expires_at=expires_at,
    )
    session.add(endpoint)
    session.commit()
    session.refresh(endpoint)
    return endpoint


def get_endpoint(*, session: Session, endpoint_id: uuid.UUID) -> Optional[ReceiverEndpoint]:
    return session.get(ReceiverEndpoint, endpoint_id)


def get_endpoint_by_slug(*, session: Session, slug: str) -> Optional[ReceiverEndpoint]:
    stmt = select(ReceiverEndpoint).where(ReceiverEndpoint.slug == slug)
    endpoint = session.exec(stmt).first()
    if endpoint and endpoint.expires_at and endpoint.expires_at < datetime.now(timezone.utc):
        # Handle expired temporary endpoint: mark inactive or delete
        endpoint.is_active = False
        session.add(endpoint)
        session.commit()
        session.refresh(endpoint)
        return None
    return endpoint


def list_endpoints(
    *,
    session: Session,
    workspace_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[ReceiverEndpoint], int]:
    offset = (page - 1) * page_size
    # Clean up expired temporary endpoints first
    now = datetime.now(timezone.utc)
    
    count_stmt = select(func.count()).select_from(ReceiverEndpoint).where(
        ReceiverEndpoint.workspace_id == workspace_id
    )
    total = session.exec(count_stmt).one()

    stmt = (
        select(ReceiverEndpoint)
        .where(ReceiverEndpoint.workspace_id == workspace_id)
        .offset(offset)
        .limit(page_size)
        .order_by(ReceiverEndpoint.created_at.desc())
    )
    items = list(session.exec(stmt).all())
    return items, total


def update_endpoint(
    *,
    session: Session,
    db_endpoint: ReceiverEndpoint,
    data: ReceiverEndpointUpdate,
) -> ReceiverEndpoint:
    update_data = data.model_dump(exclude_unset=True)
    db_endpoint.sqlmodel_update(update_data)
    db_endpoint.updated_at = datetime.now(timezone.utc)
    session.add(db_endpoint)
    session.commit()
    session.refresh(db_endpoint)
    return db_endpoint


def delete_endpoint(*, session: Session, db_endpoint: ReceiverEndpoint) -> None:
    session.delete(db_endpoint)
    session.commit()


# ── Destination Operations ────────────────────────────────────
def create_destination(
    *, session: Session, endpoint_id: uuid.UUID, data: DestinationCreate
) -> Destination:
    destination = Destination(
        endpoint_id=endpoint_id,
        name=data.name,
        url=data.url,
        method=data.method,
        timeout=data.timeout,
        is_active=data.is_active,
        auth_type=data.auth_type,
        auth_config=data.auth_config,
        headers_to_inject=data.headers_to_inject,
        headers_to_strip=data.headers_to_strip,
        payload_transform_template=data.payload_transform_template,
    )
    session.add(destination)
    session.commit()
    session.refresh(destination)
    return destination


def get_destination(*, session: Session, destination_id: uuid.UUID) -> Optional[Destination]:
    return session.get(Destination, destination_id)


def list_destinations(*, session: Session, endpoint_id: uuid.UUID) -> List[Destination]:
    stmt = select(Destination).where(Destination.endpoint_id == endpoint_id)
    return list(session.exec(stmt).all())


def update_destination(
    *,
    session: Session,
    db_destination: Destination,
    data: DestinationUpdate,
) -> Destination:
    update_data = data.model_dump(exclude_unset=True)
    db_destination.sqlmodel_update(update_data)
    session.add(db_destination)
    session.commit()
    session.refresh(db_destination)
    return db_destination


def delete_destination(*, session: Session, db_destination: Destination) -> None:
    session.delete(db_destination)
    session.commit()


# ── Webhook Payload Operations ────────────────────────────────
def create_payload(
    *,
    session: Session,
    endpoint_id: uuid.UUID,
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


def get_payload(*, session: Session, payload_id: uuid.UUID) -> Optional[WebhookPayload]:
    return session.get(WebhookPayload, payload_id)


def list_payloads(
    *,
    session: Session,
    endpoint_id: uuid.UUID,
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
    payload_id: uuid.UUID,
    destination_id: uuid.UUID,
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
    *, session: Session, payload_id: uuid.UUID
) -> List[WebhookDelivery]:
    stmt = select(WebhookDelivery).where(WebhookDelivery.payload_id == payload_id).order_by(WebhookDelivery.delivered_at.asc())
    return list(session.exec(stmt).all())


# ── Schema Drift Alerts ───────────────────────────────────────
def create_drift_alert(
    *, session: Session, endpoint_id: uuid.UUID, payload_id: uuid.UUID, message: str
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


def list_drift_alerts(*, session: Session, endpoint_id: uuid.UUID) -> List[SchemaDriftAlert]:
    stmt = select(SchemaDriftAlert).where(SchemaDriftAlert.endpoint_id == endpoint_id).order_by(SchemaDriftAlert.created_at.desc())
    return list(session.exec(stmt).all())


# ── Session Sharing Operations ────────────────────────────────
def create_share(
    *, session: Session, endpoint_id: uuid.UUID, expires_in_seconds: int = 3600
) -> SessionShare:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    share = SessionShare(endpoint_id=endpoint_id, token=token, expires_at=expires_at)
    session.add(share)
    session.commit()
    session.refresh(share)
    return share


def get_share_by_token(*, session: Session, token: str) -> Optional[SessionShare]:
    stmt = select(SessionShare).where(SessionShare.token == token)
    share = session.exec(stmt).first()
    if share and share.expires_at < datetime.now(timezone.utc):
        # Cleanup expired share link
        session.delete(share)
        session.commit()
        return None
    return share
