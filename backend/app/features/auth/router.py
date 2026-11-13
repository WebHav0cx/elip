from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import get_current_user, get_optional_user, require_admin
from app.features.auth.models import OperationMembership, User
from app.features.auth.schemas import (
    AdminUserCreate, LoginRequest, MembershipCreate, MembershipResponse,
    RefreshRequest, TokenResponse, UserResponse,
)
from app.features.auth.security import create_token, decode_refresh_token, hash_password, verify_password
from app.features.operations.models import Operation
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


def _tokens(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_token(str(user.id), "access", 3600),
        refresh_token=create_token(str(user.id), "refresh", 604800),
    )


@router.post("/auth/login", response_model=SuccessResponse[TokenResponse])
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return SuccessResponse(data=_tokens(user), meta=ResponseMeta(request_id=request.state.request_id))


@router.post("/auth/refresh", response_model=SuccessResponse[TokenResponse])
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    claims = decode_refresh_token(payload.refresh_token)
    user = db.get(User, claims.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or does not exist")
    return SuccessResponse(data=_tokens(user), meta=ResponseMeta(request_id=request.state.request_id))


@router.get("/users/me", response_model=SuccessResponse[UserResponse])
def current_user(request: Request, user: User = Depends(get_current_user)):
    return SuccessResponse(data=UserResponse.model_validate(user), meta=ResponseMeta(request_id=request.state.request_id))


@router.post("/admin/users", response_model=SuccessResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    # The first account is the development/deployment bootstrap admin. Subsequent accounts require ADMIN.
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    if user_count and (user is None or user.role != "ADMIN"):
        raise HTTPException(status_code=403, detail="Only an administrator can create users")
    account = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="ADMIN" if user_count == 0 else payload.role,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return SuccessResponse(data=UserResponse.model_validate(account), meta=ResponseMeta(request_id=request.state.request_id))


@router.post("/operations/{operation_id}/members", response_model=SuccessResponse[MembershipResponse], status_code=201)
def add_member(operation_id: str, payload: MembershipCreate, request: Request, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.get(Operation, operation_id) is None or db.get(User, payload.user_id) is None:
        raise HTTPException(status_code=404, detail="Operation or user not found")
    membership = OperationMembership(operation_id=operation_id, user_id=payload.user_id, role=payload.role)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return SuccessResponse(data=MembershipResponse.model_validate(membership), meta=ResponseMeta(request_id=request.state.request_id))
