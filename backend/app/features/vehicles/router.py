from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import require_operation_permission
from app.features.locations.models import Location
from app.features.operations.models import Operation
from app.features.vehicles.models import Vehicle
from app.features.vehicles.schemas import VehicleCreate, VehicleResponse
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


@router.post("", response_model=SuccessResponse[VehicleResponse], status_code=status.HTTP_201_CREATED)
def create_vehicle(
    operation_id: str,
    payload: VehicleCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:write")),
):
    if str(payload.operation_id) != operation_id:
        raise HTTPException(status_code=400, detail="Operation IDs do not match")
    if db.get(Operation, operation_id) is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    hub = db.get(Location, payload.base_hub_id)
    if hub is None or str(hub.operation_id) != operation_id or hub.location_type != "HUB":
        raise HTTPException(status_code=400, detail="base_hub_id must reference a hub in this operation")
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return SuccessResponse(
        data=VehicleResponse.model_validate(vehicle),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("", response_model=SuccessResponse[list[VehicleResponse]])
def list_vehicles(
    operation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:read")),
):
    vehicles = db.scalars(
        select(Vehicle).where(Vehicle.operation_id == operation_id).order_by(Vehicle.vehicle_code)
    ).all()
    return SuccessResponse(
        data=[VehicleResponse.model_validate(item) for item in vehicles],
        meta=ResponseMeta(request_id=request.state.request_id),
    )
