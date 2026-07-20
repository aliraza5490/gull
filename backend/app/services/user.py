"""
User & Workspace service – DB operations for users and workspaces.
"""

from typing import Optional, List
from sqlmodel import Session, select

from app.models.webhook import User, Workspace, WorkspaceMember


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


def get_workspace(*, session: Session, workspace_id: int) -> Optional[Workspace]:
    return session.get(Workspace, workspace_id)


def add_workspace_member(
    *, session: Session, workspace_id: int, user_id: int, role: str
) -> WorkspaceMember:
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


def get_workspace_member(
    *, session: Session, workspace_id: int, user_id: int
) -> Optional[WorkspaceMember]:
    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    )
    return session.exec(stmt).first()


def get_workspaces_for_user(*, session: Session, user_id: int) -> List[Workspace]:
    stmt = (
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
    )
    return list(session.exec(stmt).all())
