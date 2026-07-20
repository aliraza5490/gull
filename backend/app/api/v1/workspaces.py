"""
API endpoints for workspaces: list, create.
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlmodel import select, func

from app.core.deps import SessionDep
from app.core.auth_deps import get_current_user
from app.models.webhook import User, ReceiverEndpoint, WebhookPayload, WebhookDelivery, SchemaDriftAlert, EndpointType
from app.schemas.webhook import WorkspaceRead, WorkspaceCreate, WorkspaceStatsRead, HourlyTraffic, PaginatedResponse, WebhookPayloadRead
from app.services import user as user_service

router = APIRouter()


def verify_workspace_membership(session: SessionDep, workspace_id: int, user_id: int):
    """Raise 403 Forbidden if the user is not a member of the workspace."""
    member = user_service.get_workspace_member(session=session, workspace_id=workspace_id, user_id=user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this workspace"
        )


@router.get("/", response_model=List[WorkspaceRead])
def list_workspaces(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """List workspaces for the current logged-in user."""
    return user_service.get_workspaces_for_user(session=session, user_id=current_user.id)


@router.post("/", response_model=WorkspaceRead, status_code=201)
def create_workspace(
    data: WorkspaceCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """Create a new workspace and add the logged-in user as Admin."""
    workspace = user_service.create_workspace(session=session, name=data.name)
    user_service.add_workspace_member(
        session=session,
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="Admin"
    )
    return workspace


@router.get("/{workspace_id}/stats", response_model=WorkspaceStatsRead)
def get_workspace_stats(
    workspace_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """Get dynamic dashboard stats for a workspace."""
    # Verify membership
    verify_workspace_membership(session, workspace_id, current_user.id)

    # Query endpoints in workspace
    endpoints_stmt = select(ReceiverEndpoint).where(ReceiverEndpoint.workspace_id == workspace_id)
    endpoints = session.exec(endpoints_stmt).all()

    total_endpoints = len(endpoints)
    active_endpoints = sum(1 for ep in endpoints if ep.is_active)
    paused_endpoints = total_endpoints - active_endpoints
    temp_endpoints = sum(1 for ep in endpoints if ep.type == EndpointType.TEMPORARY)

    endpoint_ids = [ep.id for ep in endpoints]

    # Defaults if no endpoints exist
    success_rate = 100.0
    drift_alerts_count = 0
    traffic_chart = []

    now = datetime.now(timezone.utc)

    if endpoint_ids:
        # Success rate
        total_deliveries = session.exec(
            select(func.count(WebhookDelivery.id))
            .join(WebhookPayload)
            .where(WebhookPayload.endpoint_id.in_(endpoint_ids))
        ).one() or 0

        success_deliveries = session.exec(
            select(func.count(WebhookDelivery.id))
            .join(WebhookPayload)
            .where(
                WebhookPayload.endpoint_id.in_(endpoint_ids),
                WebhookDelivery.success == True
            )
        ).one() or 0

        if total_deliveries > 0:
            success_rate = round((success_deliveries / total_deliveries) * 100, 1)

        # Drift alerts
        drift_alerts_count = session.exec(
            select(func.count(SchemaDriftAlert.id))
            .where(SchemaDriftAlert.endpoint_id.in_(endpoint_ids))
        ).one() or 0

        # Traffic chart (last 12 hours)
        for i in range(12, 0, -1):
            start_time = now - timedelta(hours=i)
            end_time = now - timedelta(hours=i-1)

            requests_count = session.exec(
                select(func.count(WebhookPayload.id))
                .where(
                    WebhookPayload.endpoint_id.in_(endpoint_ids),
                    WebhookPayload.received_at >= start_time,
                    WebhookPayload.received_at < end_time
                )
            ).one() or 0

            traffic_chart.append(
                HourlyTraffic(
                    hour=f"{i}h ago",
                    requests=requests_count
                )
            )
    else:
        # Generate empty traffic chart with 0s
        for i in range(12, 0, -1):
            traffic_chart.append(
                HourlyTraffic(
                    hour=f"{i}h ago",
                    requests=0
                )
            )

    return WorkspaceStatsRead(
        total_endpoints=total_endpoints,
        active_endpoints=active_endpoints,
        paused_endpoints=paused_endpoints,
        temp_endpoints=temp_endpoints,
        success_rate=success_rate,
        drift_alerts_count=drift_alerts_count,
        traffic_chart=traffic_chart
    )


@router.get("/{workspace_id}/payloads", response_model=PaginatedResponse[WebhookPayloadRead])
def list_workspace_payloads(
    workspace_id: int,
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    endpoint_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    """List recent payloads across all endpoints in a workspace (or filtered by endpoint)."""
    verify_workspace_membership(session, workspace_id, current_user.id)

    endpoints_stmt = select(ReceiverEndpoint.id).where(ReceiverEndpoint.workspace_id == workspace_id)
    endpoint_ids = [row for row in session.exec(endpoints_stmt).all()]

    if not endpoint_ids:
        return PaginatedResponse(items=[], total=0, page=page, page_size=page_size)

    if endpoint_id:
        if endpoint_id not in endpoint_ids:
            raise HTTPException(status_code=404, detail="Endpoint not found in workspace")
        target_ids = [endpoint_id]
    else:
        target_ids = endpoint_ids

    offset = (page - 1) * page_size
    where_clause = WebhookPayload.endpoint_id.in_(target_ids)

    count_stmt = select(func.count()).select_from(WebhookPayload).where(where_clause)
    total = session.exec(count_stmt).one()

    stmt = (
        select(WebhookPayload)
        .where(where_clause)
        .order_by(WebhookPayload.received_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = session.exec(stmt).all()

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


