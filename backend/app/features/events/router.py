from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import get_current_user, require_delivery_permission, require_operation_permission
from app.features.auth.models import User
from app.features.deliveries.models import Delivery
from app.features.events.models import SimulationEvent
from app.features.events.schemas import EventCreate, EventResponse
from app.features.operations.models import Operation
from app.features.predictions.service import run_and_store_prediction
from app.features.vehicles.models import Vehicle
from app.schemas.responses import ResponseMeta, SuccessResponse


telemetry_router = APIRouter()
timeline_router = APIRouter()
monitoring_router = APIRouter()


STATE_TRANSITIONS = {
    "DELIVERY_DISPATCHED": {"PLANNED", "ASSIGNED"},
    "LOCATION_UPDATE": {"DISPATCHED", "IN_TRANSIT"},
    "ARRIVAL_RECORDED": {"DISPATCHED", "IN_TRANSIT"},
    "RECEIPT_CONFIRMED": {"ARRIVED"},
}
STATE_AFTER_EVENT = {
    "DELIVERY_DISPATCHED": "DISPATCHED",
    "LOCATION_UPDATE": "IN_TRANSIT",
    "ARRIVAL_RECORDED": "ARRIVED",
    "RECEIPT_CONFIRMED": "CONFIRMED",
}


def _event_response(event: SimulationEvent, request: Request):
    return SuccessResponse(
        data=EventResponse.model_validate(event),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@telemetry_router.post("/events", response_model=SuccessResponse[EventResponse])
def ingest_event(
    payload: EventCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.scalar(
        select(SimulationEvent).where(SimulationEvent.event_id == payload.event_id)
    )
    if existing is not None:
        return _event_response(existing, request)

    operation = db.get(Operation, payload.operation_id)
    if operation is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    # Telemetry is restricted to simulation-capable users assigned to this operation.
    require_operation_permission("telemetry:write")(operation_id=payload.operation_id, user=user, db=db)
    delivery = db.get(Delivery, payload.delivery_id) if payload.delivery_id else None
    vehicle = db.get(Vehicle, payload.vehicle_id) if payload.vehicle_id else None
    if payload.delivery_id and delivery is None:
        raise HTTPException(status_code=404, detail="Delivery not found")
    if payload.vehicle_id and vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if delivery and delivery.operation_id != operation.id:
        raise HTTPException(status_code=400, detail="Delivery belongs to another operation")
    if vehicle and vehicle.operation_id != operation.id:
        raise HTTPException(status_code=400, detail="Vehicle belongs to another operation")

    event = SimulationEvent(**payload.model_dump())
    db.add(event)

    should_transition = delivery is not None
    if delivery is not None:
        latest = db.scalar(
            select(SimulationEvent)
            .where(SimulationEvent.delivery_id == delivery.id)
            .order_by(SimulationEvent.occurred_at.desc())
        )
        if latest and payload.occurred_at < latest.occurred_at:
            should_transition = False
        allowed_states = STATE_TRANSITIONS.get(payload.event_type)
        if should_transition and allowed_states and delivery.status not in allowed_states:
            raise HTTPException(
                status_code=409,
                detail=f"Invalid delivery transition from {delivery.status} using {payload.event_type}",
            )
        if should_transition and payload.event_type in STATE_AFTER_EVENT:
            delivery.status = STATE_AFTER_EVENT[payload.event_type]

    db.commit()
    db.refresh(event)
    if delivery is not None and payload.event_type in {
        "DELIVERY_DISPATCHED",
        "LOCATION_UPDATE",
        "DELAY_REPORTED",
        "DISRUPTION_STARTED",
        "TELEMETRY_MISSING",
    }:
        try:
            run_and_store_prediction(db, delivery.id, trigger=payload.event_type, as_of=payload.occurred_at)
        except Exception:
            # Forecasting must not invalidate an otherwise valid operational event.
            import logging

            logging.getLogger(__name__).exception("Prediction refresh failed for delivery %s", delivery.id)
    response.status_code = status.HTTP_201_CREATED
    return _event_response(event, request)


@timeline_router.get(
    "/{delivery_id}/timeline", response_model=SuccessResponse[list[EventResponse]]
)
def delivery_timeline(
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_delivery_permission("deliveries:read")),
):
    if db.get(Delivery, delivery_id) is None:
        raise HTTPException(status_code=404, detail="Delivery not found")
    events = db.scalars(
        select(SimulationEvent)
        .where(SimulationEvent.delivery_id == delivery_id)
        .order_by(SimulationEvent.occurred_at, SimulationEvent.received_at)
    ).all()
    return SuccessResponse(
        data=[EventResponse.model_validate(event) for event in events],
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@timeline_router.get(
    "/{delivery_id}/movement-events", response_model=SuccessResponse[list[EventResponse]]
)
def delivery_movement_events(
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_delivery_permission("deliveries:read")),
):
    events = db.scalars(
        select(SimulationEvent)
        .where(
            SimulationEvent.delivery_id == delivery_id,
            SimulationEvent.event_type.in_(
                ["LOCATION_UPDATE", "TELEMETRY_MISSING", "ARRIVAL_RECORDED"]
            ),
        )
        .order_by(SimulationEvent.occurred_at, SimulationEvent.received_at)
    ).all()
    return SuccessResponse(
        data=[EventResponse.model_validate(event) for event in events],
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@monitoring_router.get(
    "/{operation_id}/telemetry/latest", response_model=SuccessResponse[list[dict]]
)
def latest_telemetry(
    operation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_operation_permission("operations:read")),
):
    if db.get(Operation, operation_id) is None:
        raise HTTPException(status_code=404, detail="Operation not found")
    events = db.scalars(
        select(SimulationEvent)
        .where(
            SimulationEvent.operation_id == operation_id,
            SimulationEvent.event_type.in_(["LOCATION_UPDATE", "TELEMETRY_MISSING"]),
        )
        .order_by(SimulationEvent.occurred_at.desc())
    ).all()
    latest_by_vehicle: dict[str, SimulationEvent] = {}
    for event in events:
        if event.vehicle_id is not None and str(event.vehicle_id) not in latest_by_vehicle:
            latest_by_vehicle[str(event.vehicle_id)] = event
    result = [
        {
            "vehicle_id": vehicle_id,
            "delivery_id": str(event.delivery_id) if event.delivery_id else None,
            "event_type": event.event_type,
            "occurred_at": event.occurred_at,
            "telemetry_status": "MISSING" if event.event_type == "TELEMETRY_MISSING" else "CURRENT",
            "payload": event.payload,
        }
        for vehicle_id, event in latest_by_vehicle.items()
    ]
    return SuccessResponse(
        data=result,
        meta=ResponseMeta(request_id=request.state.request_id),
    )
