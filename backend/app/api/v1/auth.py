"""
API endpoints for user authentication: register, login, me.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import SQLModel

from app.core.deps import SessionDep
from app.core.auth import hash_password, verify_password, create_access_token
from app.core.auth_deps import get_current_user
from app.services import user as user_service
from app.models.webhook import User
from app.schemas.webhook import UserCreate, UserRead, UserLogin

router = APIRouter()


class TokenWithUser(SQLModel):
    access_token: str
    token_type: str
    user: UserRead


@router.post("/register", response_model=TokenWithUser, status_code=201)
def register(data: UserCreate, session: SessionDep):
    """Register a new user, create their personal workspace, and return a JWT access token."""
    existing_user = user_service.get_user_by_email(session=session, email=data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered",
        )

    # Hash the password
    hashed_pwd = hash_password(data.password)

    # Create the user in the database
    user = user_service.create_user(session=session, email=data.email, hashed_password=hashed_pwd)

    # Create a default workspace for the user
    workspace_name = f"{data.email.split('@')[0]}'s Workspace"
    workspace = user_service.create_workspace(session=session, name=workspace_name)

    # Assign user to the workspace as Admin
    user_service.add_workspace_member(
        session=session,
        workspace_id=workspace.id,
        user_id=user.id,
        role="Admin"
    )

    # Create access token
    access_token = create_access_token(user_id=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=TokenWithUser)
def login(data: UserLogin, session: SessionDep):
    """Authenticate a user and return a JWT access token."""
    user = user_service.get_user_by_email(session=session, email=data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated",
        )

    access_token = create_access_token(user_id=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve the current logged-in user details."""
    return current_user
