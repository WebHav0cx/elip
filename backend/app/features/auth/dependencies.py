from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.models import OperationMembership, User
from app.features.auth.security import decode_access_token
from app.features.operations.models import Operation


bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    user = db.get(User, payload.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or does not exist")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    return db.get(User, payload.get("sub"))


def require_scope(scope: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role == "ADMIN":
            return user
        allowed = {
            "VIEWER": {"operations:read", "deliveries:read"},
            "OPERATOR": {"operations:read", "operations:write", "deliveries:read", "deliveries:write"},
            "SIMULATION_OPERATOR": {"operations:read", "deliveries:read", "telemetry:write", "simulation:control"},
        }
        if scope not in allowed.get(user.role, set()):
            raise HTTPException(status_code=403, detail="Insufficient permission")
        return user
    return dependency


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrator permission required")
    return user


def require_operation_permission(scope: str) -> Callable:
    def dependency(
        operation_id: UUID,
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if db.get(Operation, operation_id) is None:
            raise HTTPException(status_code=404, detail="Operation not found")
        if user.role == "ADMIN":
            return user
        if scope not in {
            "VIEWER": {"operations:read", "deliveries:read"},
            "OPERATOR": {"operations:read", "operations:write", "deliveries:read", "deliveries:write"},
            "SIMULATION_OPERATOR": {"operations:read", "deliveries:read", "telemetry:write", "simulation:control"},
        }.get(user.role, set()):
            raise HTTPException(status_code=403, detail="Insufficient permission")
        membership = db.scalar(select(OperationMembership).where(OperationMembership.user_id == user.id, OperationMembership.operation_id == operation_id))
        if membership is None or (scope.endswith(":write") and membership.role == "VIEWER"):
            raise HTTPException(status_code=403, detail="User is not assigned to this operation")
        return user
    return dependency


def require_delivery_permission(scope: str) -> Callable:
    def dependency(
        delivery_id: UUID,
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        from app.features.deliveries.models import Delivery

        delivery = db.get(Delivery, delivery_id)
        if delivery is None:
            raise HTTPException(status_code=404, detail="Delivery not found")
        return require_operation_permission(scope)(operation_id=delivery.operation_id, user=user, db=db)
    return dependency
