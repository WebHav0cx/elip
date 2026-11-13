from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.features.auth.dependencies import require_delivery_permission
from app.features.assignments.models import Assignment
from app.features.assignments.schemas import AssignmentCreate, AssignmentResponse
from app.features.deliveries.models import Delivery
from app.features.vehicles.models import Vehicle
from app.features.personnel.models import Personnel
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


@router.post("", response_model=SuccessResponse[AssignmentResponse], status_code=status.HTTP_201_CREATED)
def create_assignment(
    delivery_id: str,
    payload: AssignmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_delivery_permission("deliveries:write")),
):
    delivery = db.get(Delivery, delivery_id)
    vehicle = db.get(Vehicle, payload.vehicle_id)
    personnel = db.get(Personnel, payload.personnel_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Delivery not found")
    if vehicle is None or personnel is None:
        raise HTTPException(status_code=404, detail="Assigned resource not found")
    if str(payload.delivery_id) != delivery_id:
        raise HTTPException(status_code=400, detail="Delivery IDs do not match")
    if delivery.operation_id != vehicle.operation_id or delivery.operation_id != personnel.operation_id:
        raise HTTPException(status_code=400, detail="Resources must belong to the delivery operation")
    if delivery.demand_units > vehicle.capacity_units:
        raise HTTPException(status_code=409, detail="Vehicle capacity is insufficient")
    if db.scalar(select(Assignment).where(Assignment.delivery_id == delivery.id)):
        raise HTTPException(status_code=409, detail="Delivery already has an assignment")

    new_start = delivery.scheduled_dispatch
    new_end = new_start + timedelta(minutes=delivery.planned_duration_min)
    existing = db.scalars(
        select(Assignment).where(
            (Assignment.vehicle_id == vehicle.id) | (Assignment.personnel_id == personnel.id)
        )
    ).all()
    for assignment in existing:
        assigned_delivery = db.get(Delivery, assignment.delivery_id)
        if assigned_delivery is None:
            continue
        existing_start = assigned_delivery.scheduled_dispatch
        existing_end = existing_start + timedelta(minutes=assigned_delivery.planned_duration_min)
        if new_start < existing_end and existing_start < new_end:
            raise HTTPException(status_code=409, detail="Resource schedule overlaps another delivery")

    assignment = Assignment(**payload.model_dump(exclude={"delivery_id"}))
    assignment.delivery_id = delivery.id
    db.add(assignment)
    delivery.status = "ASSIGNED"
    db.commit()
    db.refresh(assignment)
    return SuccessResponse(
        data=AssignmentResponse.model_validate(assignment),
        meta=ResponseMeta(request_id=request.state.request_id),
    )


@router.get("", response_model=SuccessResponse[list[AssignmentResponse]])
def list_assignments(
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_delivery_permission("deliveries:read")),
):
    assignments = db.scalars(
        select(Assignment).where(Assignment.delivery_id == delivery_id)
    ).all()
    return SuccessResponse(
        data=[AssignmentResponse.model_validate(item) for item in assignments],
        meta=ResponseMeta(request_id=request.state.request_id),
    )
