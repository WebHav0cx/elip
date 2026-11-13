from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import require_operation_permission
from app.features.deliveries.models import Delivery
from app.features.deliveries.schemas import DeliveryCreate, DeliveryResponse
from app.features.locations.models import Location
from app.features.operations.models import Operation
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


def _validate_locations(db: Session, operation_id: str, payload: DeliveryCreate) -> None:
    origin = db.get(Location, payload.origin_hub_id)
    destination = db.get(Location, payload.destination_id)
    if origin is None or origin.location_type != "HUB" or str(origin.operation_id) != operation_id:
        raise HTTPException(status_code=400, detail="origin_hub_id must reference a hub in this operation")
    if destination is None or destination.location_type != "DESTINATION" or str(destination.operation_id) != operation_id:
        raise HTTPException(status_code=400, detail="destination_id must reference a destination in this operation")


@router.post("", response_model=SuccessResponse[DeliveryResponse], status_code=status.HTTP_201_CREATED)
def create_delivery(
    operation_id: str,
    payload: DeliveryCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("deliveries:write")),
):
    if str(payload.operation_id) != operation_id:
        raise HTTPException(status_code=400, detail="Operation IDs do not match")
    if db.get(Operation, operation_id) is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    _validate_locations(db, operation_id, payload)
    delivery = Delivery(**payload.model_dump())
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return SuccessResponse(
        data=DeliveryResponse.model_validate(delivery),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("", response_model=SuccessResponse[list[DeliveryResponse]])
def list_deliveries(
    operation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("deliveries:read")),
):
    deliveries = db.scalars(
        select(Delivery).where(Delivery.operation_id == operation_id).order_by(Delivery.scheduled_dispatch)
    ).all()
    return SuccessResponse(
        data=[DeliveryResponse.model_validate(item) for item in deliveries],
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("/{delivery_id}", response_model=SuccessResponse[DeliveryResponse])
def get_delivery(
    operation_id: str,
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("deliveries:read")),
):
    delivery = db.get(Delivery, delivery_id)
    if delivery is None or str(delivery.operation_id) != operation_id:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return SuccessResponse(
        data=DeliveryResponse.model_validate(delivery),
        meta=ResponseMeta(request_id=request.state.request_id),
    )
