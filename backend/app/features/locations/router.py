from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import require_operation_permission
from app.features.locations.models import Location
from app.features.locations.schemas import LocationCreate, LocationResponse
from app.features.operations.models import Operation
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


@router.post("", response_model=SuccessResponse[LocationResponse], status_code=status.HTTP_201_CREATED)
def create_location(
    operation_id: str,
    payload: LocationCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:write")),
):
    if str(payload.operation_id) != operation_id:
        raise HTTPException(status_code=400, detail="Operation IDs do not match")
    if db.get(Operation, operation_id) is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    location = Location(**payload.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return SuccessResponse(
        data=LocationResponse.model_validate(location),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("", response_model=SuccessResponse[list[LocationResponse]])
def list_locations(
    operation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:read")),
):
    locations = db.scalars(
        select(Location).where(Location.operation_id == operation_id).order_by(Location.location_code)
    ).all()
    return SuccessResponse(
        data=[LocationResponse.model_validate(item) for item in locations],
        meta=ResponseMeta(request_id=request.state.request_id),
    )
