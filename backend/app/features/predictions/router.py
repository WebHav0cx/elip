import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.features.auth.dependencies import get_current_user, require_delivery_permission
from app.features.auth.models import User
from app.features.deliveries.models import Delivery
from app.features.predictions.models import DelayPrediction
from app.features.predictions.schemas import PredictionResponse, PredictionRunRequest
from app.features.predictions.service import run_and_store_prediction
from app.schemas.responses import ResponseMeta, SuccessResponse


router = APIRouter()


def _response(data, request: Request):
    return SuccessResponse(data=data, meta=ResponseMeta(request_id=request.state.request_id))


@router.post("/predictions/run", response_model=SuccessResponse[PredictionResponse], status_code=status.HTTP_201_CREATED)
def run_prediction(
    payload: PredictionRunRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    delivery = db.get(Delivery, payload.delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Delivery not found")
    from app.features.auth.dependencies import require_operation_permission

    require_operation_permission("deliveries:read")(operation_id=delivery.operation_id, user=user, db=db)
    prediction = run_and_store_prediction(db, payload.delivery_id, payload.trigger)
    return _response(PredictionResponse.model_validate(prediction), request)


@router.get("/deliveries/{delivery_id}/predictions/latest", response_model=SuccessResponse[PredictionResponse])
def latest_prediction(
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_delivery_permission("deliveries:read")),
):
    prediction = db.scalar(
        select(DelayPrediction)
        .where(DelayPrediction.delivery_id == delivery_id)
        .order_by(DelayPrediction.predicted_at.desc(), DelayPrediction.created_at.desc())
    )
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return _response(PredictionResponse.model_validate(prediction), request)


@router.get("/deliveries/{delivery_id}/predictions/history", response_model=SuccessResponse[list[PredictionResponse]])
def prediction_history(
    delivery_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _: object = Depends(require_delivery_permission("deliveries:read")),
):
    predictions = db.scalars(
        select(DelayPrediction)
        .where(DelayPrediction.delivery_id == delivery_id)
        .order_by(DelayPrediction.predicted_at, DelayPrediction.created_at)
    ).all()
    return _response([PredictionResponse.model_validate(item) for item in predictions], request)


@router.get("/models/metrics", response_model=SuccessResponse[dict])
def model_metrics(request: Request, _: User = Depends(get_current_user)):
    path = Path(settings.model_metrics_path)
    if not path.exists():
        return _response({"status": "UNAVAILABLE", "data_type": "SYNTHETIC"}, request)
    return _response(json.loads(path.read_text(encoding="utf-8")), request)
