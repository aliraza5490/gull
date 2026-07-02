import json
import time
import hmac
import hashlib
import base64
import asyncio
from typing import Any, Dict, List, Optional
import httpx
from sqlmodel import Session

from app.models.webhook import Destination, WebhookPayload, WebhookDelivery
from app.services import webhook as webhook_service
from app.core.database import engine


def resolve_json_path(data: Any, path: str) -> Any:
    """
    Resolves dot-notation path on dictionary data.
    E.g. resolve_json_path({"user": {"id": 123}}, "user.id") -> 123
    """
    parts = path.strip().split(".")
    curr = data
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return None
    return curr


def transform_payload(payload_body: dict, template_str: str) -> str:
    """
    Transforms payload_body based on a JSON-template or raw string template.
    E.g. template_str = '{"user_id": "{{user.id}}", "event": "{{event_type}}"}'
    """
    try:
        # Simple variable substitution for {{path.to.key}}
        import re
        pattern = re.compile(r"\{\{\s*([^}]+)\s*\}\}")
        
        def replacer(match):
            path = match.group(1).strip()
            val = resolve_json_path(payload_body, path)
            if val is None:
                return ""
            if isinstance(val, (dict, list)):
                return json.dumps(val)
            return str(val)

        transformed = pattern.sub(replacer, template_str)
        # Verify if it's valid JSON; if so, keep it formatted, otherwise return raw string
        try:
            json.loads(transformed)
        except ValueError:
            pass
        return transformed
    except Exception as e:
        return json.dumps({"error": f"Failed payload transformation: {str(e)}", "original_payload": payload_body})


async def forward_to_destination(
    destination_id: int,
    payload_id: int,
):
    """
    Asynchronously forwards a webhook payload to a specific destination.
    Implements retry logic with exponential backoff.
    """
    # Create database session
    with Session(engine) as db:
        destination = db.get(Destination, destination_id)
        payload = db.get(WebhookPayload, payload_id)
        
        if not destination or not payload or not destination.is_active:
            return

        # Prepare headers
        headers = {
            "Content-Type": payload.content_type or "application/json",
            "User-Agent": "Gull-Webhook-Forwarder/1.0",
        }

        # Apply header stripping (lowercase for comparison)
        incoming_headers = {k.lower(): v for k, v in payload.headers.items()}
        for strip_h in destination.headers_to_strip:
            incoming_headers.pop(strip_h.lower(), None)

        # Merge remaining incoming headers (excluding host/content-length/etc.)
        ignored_headers = {"host", "content-length", "connection", "accept-encoding", "user-agent"}
        for k, v in incoming_headers.items():
            if k not in ignored_headers:
                headers[k] = v

        # Apply injected headers
        for k, v in destination.headers_to_inject.items():
            headers[k] = v

        # Prepare body (apply payload transformation if configured)
        body_to_send = payload.raw_body
        if destination.payload_transform_template and payload.parsed_body:
            body_to_send = transform_payload(payload.parsed_body, destination.payload_transform_template)

        # Apply Authentication
        auth_type = destination.auth_type
        auth_config = destination.auth_config or {}

        if auth_type == "Bearer":
            token = auth_config.get("token", "")
            headers["Authorization"] = f"Bearer {token}"
        elif auth_type == "Basic":
            username = auth_config.get("username", "")
            password = auth_config.get("password", "")
            credentials = f"{username}:{password}"
            encoded_creds = base64.b64encode(credentials.encode()).decode()
            headers["Authorization"] = f"Basic {encoded_creds}"
        elif auth_type == "CustomSignature":
            secret = auth_config.get("secret", "")
            header_name = auth_config.get("header_name", "X-Gull-Outgoing-Signature")
            # Calculate HMAC signature of the outgoing body
            digest = hmac.new(
                secret.encode(),
                body_to_send.encode(),
                hashlib.sha256
            ).hexdigest()
            headers[header_name] = digest

        # Max retries & backoff configuration
        max_attempts = 4  # 1 initial + 3 retries
        client_timeout = destination.timeout or 30

        async with httpx.AsyncClient(timeout=client_timeout) as client:
            for attempt in range(1, max_attempts + 1):
                start_time = time.time()
                status_code = None
                response_body = None
                success = False
                error_msg = None

                try:
                    # Execute HTTP request
                    response = await client.request(
                        method=destination.method or "POST",
                        url=destination.url,
                        headers=headers,
                        content=body_to_send,
                    )
                    
                    status_code = response.status_code
                    response_body = response.text[:4000]  # Cap response body log size
                    latency_ms = int((time.time() - start_time) * 1000)

                    # Successful if 2xx
                    if 200 <= status_code < 300:
                        success = True
                    else:
                        error_msg = f"HTTP Error Status Code: {status_code}"
                
                except httpx.RequestError as exc:
                    latency_ms = int((time.time() - start_time) * 1000)
                    error_msg = f"HTTP Request failure: {str(exc)}"
                
                except Exception as exc:
                    latency_ms = int((time.time() - start_time) * 1000)
                    error_msg = f"Unexpected delivery error: {str(exc)}"

                # Log the delivery attempt in database
                webhook_service.create_delivery(
                    session=db,
                    payload_id=payload.id,
                    destination_id=destination.id,
                    attempt=attempt,
                    status_code=status_code,
                    response_body=response_body,
                    success=success,
                    latency_ms=latency_ms,
                    error_message=error_msg,
                )

                if success:
                    break

                # If it failed and we have more attempts, wait with exponential backoff
                if attempt < max_attempts:
                    backoff = 5 * (2 ** (attempt - 1))  # 5s, 10s, 20s
                    await asyncio.sleep(backoff)


async def dispatch_payload_to_destinations(
    payload_id: int,
    endpoint_id: int,
):
    """
    Triggers parallel forwarding for a payload to all active destinations of the endpoint.
    """
    with Session(engine) as db:
        destinations = webhook_service.list_destinations(session=db, endpoint_id=endpoint_id)
        active_destinations = [d for d in destinations if d.is_active]

    if not active_destinations:
        return

    # Run forwarding for all destinations in parallel
    tasks = [
        forward_to_destination(dest.id, payload_id)
        for dest in active_destinations
    ]
    await asyncio.gather(*tasks, return_exceptions=True)
