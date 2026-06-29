"""
API endpoints for workspaces: list, create.
"""

from typing import List
from fastapi import APIRouter, Depends, status

from app.core.deps import SessionDep
from app.core.auth_deps import get_current_user
from app.models.webhook import User
from app.schemas.webhook import WorkspaceRead, WorkspaceCreate
from app.services import webhook as webhook_service

router = APIRouter()


@router.get("/", response_model=List[WorkspaceRead])
def list_workspaces(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """List workspaces for the current logged-in user."""
    return webhook_service.get_workspaces_for_user(session=session, user_id=current_user.id)


@router.post("/", response_model=WorkspaceRead, status_code=201)
def create_workspace(
    data: WorkspaceCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """Create a new workspace and add the logged-in user as Admin."""
    workspace = webhook_service.create_workspace(session=session, name=data.name)
    webhook_service.add_workspace_member(
        session=session,
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="Admin"
    )
    return workspace
