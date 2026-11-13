from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import require_operation_permission
from app.features.operations.models import Operation
from app.features.personnel.models import Personnel
from app.features.personnel.schemas import PersonnelCreate, PersonnelResponse
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


@router.post("", response_model=SuccessResponse[PersonnelResponse], status_code=status.HTTP_201_CREATED)
def create_personnel(
    operation_id: str,
    payload: PersonnelCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:write")),
):
    if str(payload.operation_id) != operation_id:
        raise HTTPException(status_code=400, detail="Operation IDs do not match")
    if db.get(Operation, operation_id) is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    person = Personnel(**payload.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return SuccessResponse(
        data=PersonnelResponse.model_validate(person),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("", response_model=SuccessResponse[list[PersonnelResponse]])
def list_personnel(
    operation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:read")),
):
    people = db.scalars(
        select(Personnel)
        .where(Personnel.operation_id == operation_id)
        .order_by(Personnel.personnel_code)
    ).all()
    return SuccessResponse(
        data=[PersonnelResponse.model_validate(person) for person in people],
        meta=ResponseMeta(request_id=request.state.request_id),
    )
