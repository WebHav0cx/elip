from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import get_current_user, require_operation_permission, require_scope
from app.features.auth.models import OperationMembership, User
from app.features.operations.models import Operation
from app.features.operations.schemas import OperationSummary
from app.features.operations.schemas import OperationCreate, OperationResponse
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


@router.post("", response_model=SuccessResponse[OperationResponse], status_code=status.HTTP_201_CREATED)
def create_operation(
    payload: OperationCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_scope("operations:write")),
) -> SuccessResponse[OperationResponse]:
    operation = Operation(**payload.model_dump())
    db.add(operation)
    db.commit()
    db.refresh(operation)
    db.add(OperationMembership(user_id=user.id, operation_id=operation.id, role="OPERATOR"))
    db.commit()
    return SuccessResponse(
        data=OperationResponse.model_validate(operation),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("", response_model=SuccessResponse[list[OperationSummary]])
def list_operations(
    request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> SuccessResponse[list[OperationSummary]]:
    query = select(Operation).order_by(Operation.created_at.desc())
    if user.role != "ADMIN":
        query = query.join(OperationMembership, OperationMembership.operation_id == Operation.id).where(OperationMembership.user_id == user.id)
    operations = db.scalars(query).all()
    return SuccessResponse(
        data=[OperationSummary.model_validate(item) for item in operations],
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("/{operation_id}", response_model=SuccessResponse[OperationResponse])
def get_operation(
    operation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_operation_permission("operations:read")),
) -> SuccessResponse[OperationResponse]:
    operation = db.get(Operation, operation_id)
    if operation is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    return SuccessResponse(
        data=OperationResponse.model_validate(operation),
        meta=ResponseMeta(request_id=request.state.request_id),
    )
