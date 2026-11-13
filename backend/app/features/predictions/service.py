from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.features.assignments.models import Assignment
from app.features.deliveries.models import Delivery
from app.features.events.models import SimulationEvent
from app.features.locations.models import Location
from app.features.predictions.models import DelayPrediction
from app.features.vehicles.models import Vehicle


logger = logging.getLogger(__name__)
FALLBACK_SPEEDS = {"bus": 45.0, "truck": 40.0, "motorcycle": 55.0, "boat": 25.0}


def _risk(lateness: float) -> str:
    if lateness <= 0:
        return "LOW"
    if lateness <= 30:
        return "AT_RISK"
    return "HIGH"


def _load_model(filename: str):
    artifact = Path(settings.model_artifact_dir) / filename
    if not artifact.exists():
        return None
    try:
        import joblib

        return joblib.load(artifact)
    except Exception:  # Artifact problems must use the safe fallback.
        logger.exception("Could not load prediction artifact %s", artifact)
        return None


def run_and_store_prediction(
    db: Session,
    delivery_id,
    trigger: str = "MANUAL",
    as_of: datetime | None = None,
) -> DelayPrediction:
    delivery = db.get(Delivery, delivery_id)
    if delivery is None:
        raise ValueError("Delivery not found")
    destination = db.get(Location, delivery.destination_id)
    assignment = db.scalar(select(Assignment).where(Assignment.delivery_id == delivery.id))
    vehicle = db.get(Vehicle, assignment.vehicle_id) if assignment else None
    events = db.scalars(
        select(SimulationEvent)
        .where(SimulationEvent.delivery_id == delivery.id)
        .order_by(SimulationEvent.occurred_at.desc())
    ).all()
    prediction_time = as_of or datetime.now(timezone.utc)
    if prediction_time < delivery.scheduled_dispatch:
        prediction_time = delivery.scheduled_dispatch
    latest_movement = next(
        (event for event in events if event.event_type in {"LOCATION_UPDATE", "TELEMETRY_MISSING"}),
        None,
    )
    progress = float((latest_movement.payload or {}).get("progress_pct", 0)) if latest_movement else 0.0
    progress = min(100.0, max(0.0, progress))
    distance = float(destination.distance_to_hub_km or 0) if destination else 0.0
    vehicle_type = vehicle.vehicle_type if vehicle else "truck"
    settlement = (destination.settlement if destination and destination.settlement else "urban").lower()
    weather = "HEAVY_RAIN" if any(
        event.event_type == "DISRUPTION_STARTED" and str((event.payload or {}).get("category", "")).upper() == "HEAVY_RAIN"
        for event in events
    ) else "CLEAR"
    disruption = any(
        event.event_type in {"DISRUPTION_STARTED", "DELAY_REPORTED", "TELEMETRY_MISSING", "VEHICLE_UNAVAILABLE"}
        and event.occurred_at <= prediction_time
        for event in events
    )
    features: dict[str, Any] = {
        "remaining_distance_km": round(max(0.0, distance * (1 - progress / 100)), 2),
        "elapsed_minutes": round(max(0.0, (prediction_time - delivery.scheduled_dispatch).total_seconds() / 60), 2),
        "journey_progress_pct": progress,
        "planned_duration_min": float(delivery.planned_duration_min),
        "dispatch_hour": delivery.scheduled_dispatch.hour,
        "last_update_age_min": round(max(0.0, (prediction_time - latest_movement.occurred_at).total_seconds() / 60), 2) if latest_movement else 0.0,
        "vehicle_type": vehicle_type,
        "settlement_type": settlement,
        "weather_condition": weather,
        "disruption_reported": disruption,
    }
    frame = None
    try:
        import pandas as pd

        frame = pd.DataFrame([features])
    except ImportError:
        pass
    eta_model = _load_model("linear_regression.joblib") if frame is not None else None
    risk_model = _load_model("random_forest.joblib") if frame is not None else None
    fallback_speed = FALLBACK_SPEEDS.get(vehicle_type, 30.0)
    eta_minutes = float(eta_model.predict(frame)[0]) if eta_model is not None else features["remaining_distance_km"] / fallback_speed * 60
    risk_minutes = float(risk_model.predict(frame)[0]) if risk_model is not None else eta_minutes
    eta_minutes = max(0.0, eta_minutes)
    risk_minutes = max(0.0, risk_minutes)
    predicted_eta = prediction_time + timedelta(minutes=eta_minutes)
    lateness = max(0.0, (predicted_eta - delivery.arrival_deadline).total_seconds() / 60)
    risk_eta = prediction_time + timedelta(minutes=risk_minutes)
    risk_lateness = max(0.0, (risk_eta - delivery.arrival_deadline).total_seconds() / 60)
    model_name = "linear_regression+random_forest" if eta_model and risk_model else "fallback_speed"
    prediction = DelayPrediction(
        delivery_id=delivery.id,
        predicted_at=prediction_time,
        predicted_remaining_minutes=eta_minutes,
        predicted_eta=predicted_eta,
        scheduled_arrival=delivery.arrival_deadline,
        predicted_lateness_minutes=lateness,
        risk_level=_risk(risk_lateness),
        model_name=model_name,
        model_version=settings.model_version,
        data_type="SYNTHETIC",
        trigger=trigger,
        input_features=features,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction
