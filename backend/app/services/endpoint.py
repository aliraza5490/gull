"""
Endpoint service – DB operations for receiver endpoints, destinations, and session sharing.
"""

import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from sqlmodel import Session, select, func

from app.models.webhook import (
    ReceiverEndpoint,
    Destination,
    SessionShare,
    EndpointType,
)
from app.schemas.webhook import (
    ReceiverEndpointCreate,
    ReceiverEndpointUpdate,
    DestinationCreate,
    DestinationUpdate,
)


# ── Receiver Endpoint Operations ──────────────────────────────
def create_endpoint(
    *, session: Session, workspace_id: int, data: ReceiverEndpointCreate
) -> ReceiverEndpoint:
    expires_at = data.expires_at
    if data.type == EndpointType.TEMPORARY and not expires_at:
        # Default temporary endpoint to expire in 24 hours
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    slug = data.slug
    if not slug:
        slug = f"ep-{secrets.token_hex(4)}"
        while session.exec(select(ReceiverEndpoint).where(ReceiverEndpoint.slug == slug)).first():
            slug = f"ep-{secrets.token_hex(4)}"

    endpoint = ReceiverEndpoint(
        workspace_id=workspace_id,
        name=data.name,
        slug=slug,
        type=data.type,
        secret=data.secret,
        is_active=data.is_active,
        expires_at=expires_at,
    )
    session.add(endpoint)
    session.commit()
    session.refresh(endpoint)
    return endpoint


def get_endpoint(*, session: Session, endpoint_id: int) -> Optional[ReceiverEndpoint]:
    return session.get(ReceiverEndpoint, endpoint_id)


def get_endpoint_by_slug(*, session: Session, slug: str) -> Optional[ReceiverEndpoint]:
    stmt = select(ReceiverEndpoint).where(ReceiverEndpoint.slug == slug)
    endpoint = session.exec(stmt).first()
    if endpoint and endpoint.expires_at and endpoint.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
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
    workspace_id: int,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[ReceiverEndpoint], int]:
    offset = (page - 1) * page_size

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
    *, session: Session, endpoint_id: int, data: DestinationCreate
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


def get_destination(*, session: Session, destination_id: int) -> Optional[Destination]:
    return session.get(Destination, destination_id)


def list_destinations(*, session: Session, endpoint_id: int) -> List[Destination]:
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


# ── Session Sharing Operations ────────────────────────────────
def create_share(
    *, session: Session, endpoint_id: int, expires_in_seconds: int = 3600
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
    if share and share.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        # Cleanup expired share link
        session.delete(share)
        session.commit()
        return None
    return share
