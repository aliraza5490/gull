"""
Webhook & WebhookDelivery SQLModel table definitions.

These are the *database* models. Request/response schemas live in
app/schemas/webhook.py.
"""

import uuid as _uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel, Column, JSON


class User(SQLModel, table=True):
    """User accounts."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class Workspace(SQLModel, table=True):
    """Enterprise workspaces grouping endpoints."""

    __tablename__ = "workspaces"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class WorkspaceRole(str, Enum):
    ADMIN = "Admin"
    DEVELOPER = "Developer"
    VIEWER = "Viewer"


class WorkspaceMember(SQLModel, table=True):
    """Mapping of users to workspaces with RBAC roles."""

    __tablename__ = "workspace_members"

    workspace_id: int = Field(foreign_key="workspaces.id", primary_key=True)
    user_id: int = Field(foreign_key="users.id", primary_key=True)
    role: str = Field(default=WorkspaceRole.VIEWER)  # Admin, Developer, Viewer
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class EndpointType(str, Enum):
    TEMPORARY = "temporary"
    PERSISTENT = "persistent"


class ReceiverEndpoint(SQLModel, table=True):
    """Incoming webhook endpoint configuration."""

    __tablename__ = "receiver_endpoints"

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
    name: str = Field(max_length=255)
    slug: str = Field(unique=True, index=True, max_length=255)
    type: str = Field(default=EndpointType.PERSISTENT)  # temporary | persistent
    secret: Optional[str] = Field(default=None, max_length=512)
    is_active: bool = Field(default=True)
    expires_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class Destination(SQLModel, table=True):
    """Forwarding destination for incoming webhooks."""

    __tablename__ = "destinations"

    id: Optional[int] = Field(default=None, primary_key=True)
    endpoint_id: int = Field(foreign_key="receiver_endpoints.id", ondelete="CASCADE", index=True)
    name: str = Field(max_length=255)
    url: str = Field(max_length=2048)
    method: str = Field(default="POST", max_length=10)
    timeout: int = Field(default=30)
    is_active: bool = Field(default=True)
    auth_type: str = Field(default="None")  # None | Bearer | Basic | CustomSignature
    auth_config: dict = Field(default_factory=dict, sa_column=Column(JSON))
    headers_to_inject: dict = Field(default_factory=dict, sa_column=Column(JSON))
    headers_to_strip: list = Field(default_factory=list, sa_column=Column(JSON))
    payload_transform_template: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class WebhookPayload(SQLModel, table=True):
    """An incoming webhook payload received by our system."""

    __tablename__ = "webhook_payloads"

    id: Optional[int] = Field(default=None, primary_key=True)
    endpoint_id: int = Field(foreign_key="receiver_endpoints.id", ondelete="CASCADE", index=True)
    method: str = Field(max_length=10)
    headers: dict = Field(default_factory=dict, sa_column=Column(JSON))
    query_params: dict = Field(default_factory=dict, sa_column=Column(JSON))
    raw_body: str = Field(default="")
    parsed_body: dict = Field(default_factory=dict, sa_column=Column(JSON))
    content_type: str = Field(default="", max_length=255)
    is_drifted: bool = Field(default=False)
    received_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class WebhookDelivery(SQLModel, table=True):
    """An individual delivery attempt to a destination."""

    __tablename__ = "webhook_deliveries"

    id: Optional[int] = Field(default=None, primary_key=True)
    payload_id: int = Field(foreign_key="webhook_payloads.id", ondelete="CASCADE", index=True)
    destination_id: int = Field(foreign_key="destinations.id", ondelete="CASCADE", index=True)
    attempt: int = Field(default=1)
    status_code: Optional[int] = Field(default=None)
    response_body: Optional[str] = Field(default=None)
    success: bool = Field(default=False)
    latency_ms: int = Field(default=0)
    error_message: Optional[str] = Field(default=None)
    delivered_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class SchemaDriftAlert(SQLModel, table=True):
    """Log details when a payload schema drifts from historical patterns."""

    __tablename__ = "schema_drift_alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    endpoint_id: int = Field(foreign_key="receiver_endpoints.id", ondelete="CASCADE", index=True)
    payload_id: int = Field(foreign_key="webhook_payloads.id", ondelete="CASCADE", index=True)
    message: str = Field(max_length=1024)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )


class SessionShare(SQLModel, table=True):
    """Read-only time-boxed share link configuration."""

    __tablename__ = "session_shares"

    id: Optional[int] = Field(default=None, primary_key=True)
    endpoint_id: int = Field(foreign_key="receiver_endpoints.id", ondelete="CASCADE", index=True)
    token: str = Field(unique=True, index=True, max_length=255)
    expires_at: datetime = Field()
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
