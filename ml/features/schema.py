from __future__ import annotations

from datetime import datetime
from typing import Any

from ml.data.contracts import PredictionSnapshot, PredictionTarget


def _required(row: dict[str, str], name: str) -> str:
    value = row.get(name, "").strip()
    if not value:
        raise ValueError(f"Missing required field: {name}")
    return value


def _float(row: dict[str, str], name: str, minimum: float = 0) -> float:
    try:
        value = float(_required(row, name))
    except ValueError as exc:
        raise ValueError(f"{name} must be numeric") from exc
    if value < minimum:
        raise ValueError(f"{name} must be at least {minimum}")
    return value


def _bool(row: dict[str, str], name: str) -> bool:
    value = _required(row, name).lower()
    if value not in {"true", "false"}:
        raise ValueError(f"{name} must be true or false")
    return value == "true"


def parse_snapshot(row: dict[str, str]) -> PredictionSnapshot:
    progress = _float(row, "journey_progress_pct")
    if progress > 100:
        raise ValueError("journey_progress_pct must be between 0 and 100")
    dispatch_hour = int(_required(row, "dispatch_hour"))
    if dispatch_hour not in range(24):
        raise ValueError("dispatch_hour must be between 0 and 23")
    last_update = row.get("last_update_age_min", "").strip()
    actual_arrival = row.get("actual_arrival_time", "").strip()
    scheduled_arrival = row.get("scheduled_arrival_time", "").strip()
    actual_remaining = row.get("actual_remaining_minutes", "").strip()
    return PredictionSnapshot(
        delivery_id=_required(row, "delivery_id"),
        simulation_id=_required(row, "simulation_id"),
        snapshot_time=datetime.fromisoformat(_required(row, "snapshot_time")),
        remaining_distance_km=_float(row, "remaining_distance_km"),
        elapsed_minutes=_float(row, "elapsed_minutes"),
        journey_progress_pct=progress,
        vehicle_type=_required(row, "vehicle_type"),
        settlement_type=_required(row, "settlement_type"),
        planned_duration_min=_float(row, "planned_duration_min", minimum=0.01),
        dispatch_hour=dispatch_hour,
        weather_condition=_required(row, "weather_condition"),
        disruption_reported=_bool(row, "disruption_reported"),
        actual_arrival_time=datetime.fromisoformat(actual_arrival) if actual_arrival else None,
        scheduled_arrival_time=datetime.fromisoformat(scheduled_arrival) if scheduled_arrival else None,
        actual_remaining_minutes=float(actual_remaining) if actual_remaining else None,
        is_delayed=_bool(row, "is_delayed") if row.get("is_delayed", "").strip() else None,
        last_update_age_min=float(last_update) if last_update else None,
    )


def parse_target(row: dict[str, str]) -> PredictionTarget:
    value = row.get("actual_remaining_minutes", row.get("remaining_time_min", "")).strip()
    if not value:
        raise ValueError("Missing training target: actual_remaining_minutes")
    target = float(value)
    if target < 0:
        raise ValueError("remaining_time_min cannot be negative")
    return PredictionTarget(remaining_time_min=target)


def validate_feature_values(features: dict[str, Any]) -> None:
    required = {
        "remaining_distance_km", "elapsed_minutes", "journey_progress_pct",
        "vehicle_type", "settlement_type", "planned_duration_min",
        "dispatch_hour", "weather_condition", "disruption_reported",
    }
    missing = required - features.keys()
    if missing:
        raise ValueError(f"Missing model features: {', '.join(sorted(missing))}")
    if not 0 <= float(features["journey_progress_pct"]) <= 100:
        raise ValueError("journey_progress_pct must be between 0 and 100")
    if not 0 <= int(features["dispatch_hour"]) <= 23:
        raise ValueError("dispatch_hour must be between 0 and 23")
    for name in ("remaining_distance_km", "elapsed_minutes", "planned_duration_min", "last_update_age_min"):
        if name in features and float(features[name]) < 0:
            raise ValueError(f"{name} cannot be negative")
