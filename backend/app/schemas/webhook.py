"""
Request / response schemas for the webhook endpoints.
"""

import uuid
from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel


# ── Generic list wrapper ────────────────────────────────────
class PaginatedResponse[T](SQLModel):
    """Generic paginated response wrapper."""
    items: list[T]
    total: int
    page: int
    page_size: int


# ── User Schemas ───────────────────────────────────────────
class UserCreate(SQLModel):
    email: str
    password: str


class UserRead(SQLModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime


class UserLogin(SQLModel):
    email: str
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str


# ── Workspace Schemas ──────────────────────────────────────
class WorkspaceCreate(SQLModel):
    name: str


class WorkspaceUpdate(SQLModel):
    name: Optional[str] = None


class WorkspaceRead(SQLModel):
    id: int
    name: str
    created_at: datetime


class WorkspaceMemberRead(SQLModel):
    workspace_id: int
    user_id: int
    role: str
    created_at: datetime


class WorkspaceMemberUpdate(SQLModel):
    role: str


# ── Receiver Endpoint Schemas ──────────────────────────────
class ReceiverEndpointCreate(SQLModel):
    name: str
    slug: Optional[str] = None
    type: str = "persistent"  # temporary | persistent
    secret: Optional[str] = None
    is_active: bool = True
    expires_at: Optional[datetime] = None


class ReceiverEndpointUpdate(SQLModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    secret: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class ReceiverEndpointRead(SQLModel):
    id: int
    workspace_id: int
    name: str
    slug: str
    type: str
    secret: Optional[str] = None
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# Aliases for compatibility
WebhookCreate = ReceiverEndpointCreate
WebhookUpdate = ReceiverEndpointUpdate
WebhookRead = ReceiverEndpointRead


# ── Destination Schemas ────────────────────────────────────
class DestinationCreate(SQLModel):
    name: str
    url: str
    method: str = "POST"
    timeout: int = 30
    is_active: bool = True
    auth_type: str = "None"  # None | Bearer | Basic | CustomSignature
    auth_config: dict = {}
    headers_to_inject: dict = {}
    headers_to_strip: list = []
    payload_transform_template: Optional[str] = None


class DestinationUpdate(SQLModel):
    name: Optional[str] = None
    url: Optional[str] = None
    method: Optional[str] = None
    timeout: Optional[int] = None
    is_active: Optional[bool] = None
    auth_type: Optional[str] = None
    auth_config: Optional[dict] = None
    headers_to_inject: Optional[dict] = None
    headers_to_strip: Optional[list] = None
    payload_transform_template: Optional[str] = None


class DestinationRead(SQLModel):
    id: int
    endpoint_id: int
    name: str
    url: str
    method: str
    timeout: int
    is_active: bool
    auth_type: str
    auth_config: dict
    headers_to_inject: dict
    headers_to_strip: list
    payload_transform_template: Optional[str] = None
    created_at: datetime


# ── Webhook Payload Schemas ────────────────────────────────
class WebhookPayloadRead(SQLModel):
    id: int
    endpoint_id: int
    method: str
    headers: dict
    query_params: dict
    raw_body: str
    parsed_body: dict
    content_type: str
    is_drifted: bool
    received_at: datetime


# ── Webhook Delivery Schemas ───────────────────────────────
class WebhookDeliveryRead(SQLModel):
    id: int
    payload_id: int
    destination_id: int
    attempt: int
    status_code: Optional[int]
    response_body: Optional[str]
    success: bool
    latency_ms: int
    error_message: Optional[str] = None
    delivered_at: datetime


# ── Schema Drift Alert Schemas ─────────────────────────────
class SchemaDriftAlertRead(SQLModel):
    id: int
    endpoint_id: int
    payload_id: int
    message: str
    created_at: datetime


# ── Session Share Schemas ──────────────────────────────────
class SessionShareCreate(SQLModel):
    expires_in_seconds: int = 3600  # Default 1 hour


class SessionShareRead(SQLModel):
    id: int
    endpoint_id: int
    token: str
    expires_at: datetime
    created_at: datetime


# ── Workspace Stats Schemas ────────────────────────────────
class HourlyTraffic(SQLModel):
    hour: str
    requests: int


class WorkspaceStatsRead(SQLModel):
    total_endpoints: int
    active_endpoints: int
    paused_endpoints: int
    temp_endpoints: int
    success_rate: float
    drift_alerts_count: int
    traffic_chart: list[HourlyTraffic]

