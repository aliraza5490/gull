from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Body, BackgroundTasks, Depends, status

from app.core.deps import SessionDep
from app.core.auth_deps import get_current_user
from app.models.webhook import User
from app.schemas.webhook import (
    PaginatedResponse,
    ReceiverEndpointCreate,
    ReceiverEndpointUpdate,
    ReceiverEndpointRead,
    DestinationCreate,
    DestinationUpdate,
    DestinationRead,
    WebhookPayloadRead,
    WebhookDeliveryRead,
    SchemaDriftAlertRead,
    SessionShareCreate,
    SessionShareRead,
)
from app.services import webhook as webhook_service
from app.services.forwarder import forward_to_destination, dispatch_payload_to_destinations

router = APIRouter()


def get_default_workspace_for_user(session: SessionDep, user_id: int) -> int:
    """Helper to auto-provision a default workspace for a user if none exists."""
    workspaces = webhook_service.get_workspaces_for_user(session=session, user_id=user_id)
    if not workspaces:
        # Create a new workspace
        workspace = webhook_service.create_workspace(session=session, name="Default Workspace")
        # Add workspace member mapping
        webhook_service.add_workspace_member(
            session=session,
            workspace_id=workspace.id,
            user_id=user_id,
            role="Admin"
        )
        return workspace.id
    return workspaces[0].id


def verify_workspace_membership(session: SessionDep, workspace_id: int, user_id: int):
    """Raise 403 Forbidden if the user is not a member of the workspace."""
    member = webhook_service.get_workspace_member(session=session, workspace_id=workspace_id, user_id=user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this workspace"
        )


def get_endpoint_with_auth(session: SessionDep, endpoint_id: int, user_id: int):
    """Retrieve an endpoint and verify the user is authorized to access it."""
    endpoint = webhook_service.get_endpoint(session=session, endpoint_id=endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Webhook Endpoint not found")
    verify_workspace_membership(session, endpoint.workspace_id, user_id)
    return endpoint


# ── Endpoint Management ───────────────────────────────────────

@router.post("/", response_model=ReceiverEndpointRead, status_code=201)
def create_webhook(
    *,
    session: SessionDep,
    data: ReceiverEndpointCreate,
    workspace_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    w_id = workspace_id or get_default_workspace_for_user(session, current_user.id)
    verify_workspace_membership(session, w_id, current_user.id)
    return webhook_service.create_endpoint(session=session, workspace_id=w_id, data=data)


@router.get("/", response_model=PaginatedResponse[ReceiverEndpointRead])
def list_webhooks(
    *,
    session: SessionDep,
    workspace_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    w_id = workspace_id or get_default_workspace_for_user(session, current_user.id)
    verify_workspace_membership(session, w_id, current_user.id)
    items, total = webhook_service.list_endpoints(
        session=session, workspace_id=w_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{endpoint_id}", response_model=ReceiverEndpointRead)
def get_webhook(
    *,
    session: SessionDep,
    endpoint_id: int,
    current_user: User = Depends(get_current_user),
):
    return get_endpoint_with_auth(session, endpoint_id, current_user.id)


@router.patch("/{endpoint_id}", response_model=ReceiverEndpointRead)
def update_webhook(
    *,
    session: SessionDep,
    endpoint_id: int,
    data: ReceiverEndpointUpdate,
    current_user: User = Depends(get_current_user),
):
    endpoint = get_endpoint_with_auth(session, endpoint_id, current_user.id)
    return webhook_service.update_endpoint(
        session=session, db_endpoint=endpoint, data=data
    )


@router.delete("/{endpoint_id}", status_code=204)
def delete_webhook(
    *,
    session: SessionDep,
    endpoint_id: int,
    current_user: User = Depends(get_current_user),
):
    endpoint = get_endpoint_with_auth(session, endpoint_id, current_user.id)
    webhook_service.delete_endpoint(session=session, db_endpoint=endpoint)


# ── Destination Management ────────────────────────────────────

@router.post("/{endpoint_id}/destinations", response_model=DestinationRead, status_code=201)
def create_destination(
    *,
    session: SessionDep,
    endpoint_id: int,
    data: DestinationCreate,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    return webhook_service.create_destination(session=session, endpoint_id=endpoint_id, data=data)


@router.get("/{endpoint_id}/destinations", response_model=List[DestinationRead])
def list_destinations(
    *,
    session: SessionDep,
    endpoint_id: int,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    return webhook_service.list_destinations(session=session, endpoint_id=endpoint_id)


@router.patch("/{endpoint_id}/destinations/{destination_id}", response_model=DestinationRead)
def update_destination(
    *,
    session: SessionDep,
    endpoint_id: int,
    destination_id: int,
    data: DestinationUpdate,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    dest = webhook_service.get_destination(session=session, destination_id=destination_id)
    if not dest or dest.endpoint_id != endpoint_id:
        raise HTTPException(status_code=404, detail="Destination not found")
    return webhook_service.update_destination(session=session, db_destination=dest, data=data)


@router.delete("/{endpoint_id}/destinations/{destination_id}", status_code=204)
def delete_destination(
    *,
    session: SessionDep,
    endpoint_id: int,
    destination_id: int,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    dest = webhook_service.get_destination(session=session, destination_id=destination_id)
    if not dest or dest.endpoint_id != endpoint_id:
        raise HTTPException(status_code=404, detail="Destination not found")
    webhook_service.delete_destination(session=session, db_destination=dest)


# ── Webhook Payloads & Inspection ──────────────────────────────

@router.get("/{endpoint_id}/payloads", response_model=PaginatedResponse[WebhookPayloadRead])
def list_payloads(
    *,
    session: SessionDep,
    endpoint_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    method: Optional[str] = None,
    success: Optional[bool] = None,
    search_query: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    items, total = webhook_service.list_payloads(
        session=session,
        endpoint_id=endpoint_id,
        page=page,
        page_size=page_size,
        method=method,
        success=success,
        search_query=search_query,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{endpoint_id}/payloads/{payload_id}", response_model=WebhookPayloadRead)
def get_payload(
    *,
    session: SessionDep,
    endpoint_id: int,
    payload_id: int,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    payload = webhook_service.get_payload(session=session, payload_id=payload_id)
    if not payload or payload.endpoint_id != endpoint_id:
        raise HTTPException(status_code=404, detail="Webhook Payload not found")
    return payload


@router.get("/{endpoint_id}/payloads/{payload_id}/deliveries", response_model=List[WebhookDeliveryRead])
def list_deliveries(
    *,
    session: SessionDep,
    endpoint_id: int,
    payload_id: int,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    payload = webhook_service.get_payload(session=session, payload_id=payload_id)
    if not payload or payload.endpoint_id != endpoint_id:
        raise HTTPException(status_code=404, detail="Webhook Payload not found")
    return webhook_service.list_deliveries_for_payload(session=session, payload_id=payload_id)


@router.post("/{endpoint_id}/payloads/{payload_id}/replay")
def replay_webhook(
    *,
    session: SessionDep,
    endpoint_id: int,
    payload_id: int,
    background_tasks: BackgroundTasks,
    destination_id: Optional[int] = Query(None),
    custom_body: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    payload = webhook_service.get_payload(session=session, payload_id=payload_id)
    if not payload or payload.endpoint_id != endpoint_id:
        raise HTTPException(status_code=404, detail="Webhook Payload not found")

    # If user customized the body for the replay, we clone the payload record with the custom body
    if custom_body is not None:
        import json
        parsed = {}
        try:
            parsed = json.loads(custom_body)
        except Exception:
            pass

        replayed_payload = webhook_service.create_payload(
            session=session,
            endpoint_id=endpoint_id,
            method=payload.method,
            headers=payload.headers,
            query_params=payload.query_params,
            raw_body=custom_body,
            parsed_body=parsed,
            content_type=payload.content_type,
            is_drifted=payload.is_drifted,
        )
        target_payload_id = replayed_payload.id
    else:
        target_payload_id = payload.id

    if destination_id is not None:
        # Replay to one specific destination
        background_tasks.add_task(
            forward_to_destination,
            destination_id=destination_id,
            payload_id=target_payload_id,
        )
    else:
        # Replay to all destinations
        background_tasks.add_task(
            dispatch_payload_to_destinations,
            payload_id=target_payload_id,
            endpoint_id=endpoint_id,
        )

    return {"status": "replayed", "payload_id": target_payload_id}


# ── Schema Drift Alerts ───────────────────────────────────────

@router.get("/{endpoint_id}/drift-alerts", response_model=List[SchemaDriftAlertRead])
def list_drift_alerts(
    *,
    session: SessionDep,
    endpoint_id: int,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    return webhook_service.list_drift_alerts(session=session, endpoint_id=endpoint_id)


# ── Session Sharing ───────────────────────────────────────────

@router.post("/{endpoint_id}/shares", response_model=SessionShareRead)
def create_share_link(
    *,
    session: SessionDep,
    endpoint_id: int,
    data: SessionShareCreate,
    current_user: User = Depends(get_current_user),
):
    get_endpoint_with_auth(session, endpoint_id, current_user.id)
    return webhook_service.create_share(session=session, endpoint_id=endpoint_id, expires_in_seconds=data.expires_in_seconds)


# ── Public Session Share Inspection ───────────────────────────

@router.get("/shares/{token}", response_model=ReceiverEndpointRead)
def get_shared_endpoint(*, session: SessionDep, token: str):
    share = webhook_service.get_share_by_token(session=session, token=token)
    if not share:
        raise HTTPException(status_code=404, detail="Invalid or expired share link")

    endpoint = webhook_service.get_endpoint(session=session, endpoint_id=share.endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Shared endpoint not found")

    # Hide security secret in shared views
    endpoint.secret = None
    return endpoint


@router.get("/shares/{token}/payloads", response_model=PaginatedResponse[WebhookPayloadRead])
def list_shared_payloads(
    *,
    session: SessionDep,
    token: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    share = webhook_service.get_share_by_token(session=session, token=token)
    if not share:
        raise HTTPException(status_code=404, detail="Invalid or expired share link")

    items, total = webhook_service.list_payloads(
        session=session,
        endpoint_id=share.endpoint_id,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/shares/{token}/payloads/{payload_id}/deliveries", response_model=List[WebhookDeliveryRead])
def list_shared_deliveries(
    *,
    session: SessionDep,
    token: str,
    payload_id: int,
):
    share = webhook_service.get_share_by_token(session=session, token=token)
    if not share:
        raise HTTPException(status_code=404, detail="Invalid or expired share link")

    payload = webhook_service.get_payload(session=session, payload_id=payload_id)
    if not payload or payload.endpoint_id != share.endpoint_id:
        raise HTTPException(status_code=404, detail="Shared payload not found")

    return webhook_service.list_deliveries_for_payload(session=session, payload_id=payload_id)
