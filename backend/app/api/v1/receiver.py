import json
import uuid
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlmodel import Session, select

from app.core.deps import SessionDep
from app.core.database import get_session
from app.services import webhook as webhook_service
from app.services.streaming import manager as stream_manager
from app.services.drift import detect_schema_drift
from app.services.forwarder import dispatch_payload_to_destinations

router = APIRouter()


async def parse_body(request: Request) -> tuple[str, dict, str]:
    """Helper to parse body text, parsed JSON representation, and content type."""
    content_type = request.headers.get("content-type", "")
    raw_body = await request.body()
    body_str = raw_body.decode("utf-8", errors="ignore")
    parsed_body = {}

    if "application/json" in content_type:
        try:
            parsed_body = json.loads(body_str)
        except json.JSONDecodeError:
            pass
    elif "application/x-www-form-urlencoded" in content_type:
        try:
            form_data = await request.form()
            parsed_body = {k: v for k, v in form_data.items()}
        except Exception:
            pass

    return body_str, parsed_body, content_type


def verify_signature(secret: str, body: str, signature_header: Optional[str]) -> bool:
    """Validate HMAC signature matches X-Gull-Signature."""
    if not signature_header:
        return False
    # Calculate expected HMAC
    expected = hmac.new(
        secret.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


async def handle_incoming_webhook(
    endpoint_slug: str,
    request: Request,
    background_tasks: BackgroundTasks,
    session: Session,
) -> dict:
    """Central processing logic for all incoming HTTP webhooks."""
    # 1. Fetch Endpoint
    endpoint = webhook_service.get_endpoint_by_slug(session=session, slug=endpoint_slug)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Webhook Endpoint not found or expired")

    if not endpoint.is_active:
        raise HTTPException(status_code=503, detail="Webhook Endpoint is currently paused")

    # 2. Extract HTTP attributes
    method = request.method
    headers = dict(request.headers)
    query_params = dict(request.query_params)
    raw_body, parsed_body, content_type = await parse_body(request)

    # 3. Security & Validation
    if endpoint.secret:
        sig_header = request.headers.get("X-Gull-Signature") or request.headers.get("x-gull-signature")
        if not verify_signature(endpoint.secret, raw_body, sig_header):
            raise HTTPException(status_code=401, detail="Invalid signature header. Verification failed.")

    # 4. Proactive Schema Drift Alerting
    is_drifted = False
    drift_msg = ""
    if parsed_body:
        # Load up to 10 historical payloads for this endpoint that did not drift
        stmt = (
            select(webhook_service.WebhookPayload)
            .where(
                webhook_service.WebhookPayload.endpoint_id == endpoint.id,
                webhook_service.WebhookPayload.is_drifted == False,
            )
            .order_by(webhook_service.WebhookPayload.received_at.desc())
            .limit(10)
        )
        history = list(session.exec(stmt).all())
        history_bodies = [h.parsed_body for h in history if h.parsed_body]
        is_drifted, drift_msg = detect_schema_drift(history_bodies, parsed_body)

    # 5. Save Payload
    payload = webhook_service.create_payload(
        session=session,
        endpoint_id=endpoint.id,
        method=method,
        headers=headers,
        query_params=query_params,
        raw_body=raw_body,
        parsed_body=parsed_body,
        content_type=content_type,
        is_drifted=is_drifted,
    )

    # 6. Save Drift Alert if drifted
    if is_drifted and drift_msg:
        alert = webhook_service.create_drift_alert(
            session=session,
            endpoint_id=endpoint.id,
            payload_id=payload.id,
            message=drift_msg,
        )
        # Broadcast alert to WebSocket
        await stream_manager.broadcast(
            str(endpoint.id),
            {
                "event": "drift_alert",
                "data": {
                    "id": str(alert.id),
                    "endpoint_id": str(endpoint.id),
                    "payload_id": str(payload.id),
                    "message": drift_msg,
                    "created_at": alert.created_at.isoformat(),
                },
            },
        )

    # 7. Real-Time Streaming Broadcast to connected WebSocket clients
    await stream_manager.broadcast(
        str(endpoint.id),
        {
            "event": "payload",
            "data": {
                "id": str(payload.id),
                "endpoint_id": str(endpoint.id),
                "method": payload.method,
                "headers": payload.headers,
                "query_params": payload.query_params,
                "raw_body": payload.raw_body,
                "parsed_body": payload.parsed_body,
                "content_type": payload.content_type,
                "is_drifted": payload.is_drifted,
                "received_at": payload.received_at.isoformat(),
            },
        },
    )

    # 8. Multi-Destination Forwarding Fan-Out (in background task)
    background_tasks.add_task(
        dispatch_payload_to_destinations,
        payload_id=str(payload.id),
        endpoint_id=str(endpoint.id),
    )

    return {"status": "received", "payload_id": str(payload.id), "is_drifted": is_drifted}


# ── Ingestion Handlers (Any HTTP Method) ──────────────────────

@router.api_route("/t/{slug}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def receive_temporary_webhook(
    slug: str,
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
):
    return await handle_incoming_webhook(
        endpoint_slug=slug,
        request=request,
        background_tasks=background_tasks,
        session=session,
    )


@router.api_route("/w/{slug}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def receive_persistent_webhook(
    slug: str,
    request: Request,
    background_tasks: BackgroundTasks,
    session: SessionDep,
):
    return await handle_incoming_webhook(
        endpoint_slug=slug,
        request=request,
        background_tasks=background_tasks,
        session=session,
    )


# ── WebSockets Stream ─────────────────────────────────────────

@router.websocket("/api/v1/endpoints/{endpoint_id}/stream")
async def websocket_endpoint_stream(websocket: WebSocket, endpoint_id: str):
    await stream_manager.connect(endpoint_id, websocket)
    try:
        while True:
            # Keep-alive loop
            await websocket.receive_text()
    except WebSocketDisconnect:
        stream_manager.disconnect(endpoint_id, websocket)
    except Exception:
        stream_manager.disconnect(endpoint_id, websocket)
