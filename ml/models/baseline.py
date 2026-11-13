from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from ml.data.contracts import PredictionSnapshot


@dataclass(frozen=True)
class ETAPrediction:
    predicted_remaining_minutes: float
    predicted_eta: datetime
    scheduled_arrival: datetime | None
    predicted_lateness_minutes: float
    risk_level: str


def classify_risk(lateness_minutes: float) -> str:
    if lateness_minutes <= 0:
        return "LOW"
    if lateness_minutes <= 30:
        return "AT_RISK"
    return "HIGH"


def predict_eta(snapshot: PredictionSnapshot, speed_kmh: float) -> ETAPrediction:
    if speed_kmh <= 0:
        raise ValueError("speed_kmh must be greater than zero")
    remaining_minutes = snapshot.remaining_distance_km / speed_kmh * 60
    eta = snapshot.snapshot_time + timedelta(minutes=remaining_minutes)
    lateness = 0.0
    if snapshot.scheduled_arrival_time is not None:
        lateness = max(0.0, (eta - snapshot.scheduled_arrival_time).total_seconds() / 60)
    return ETAPrediction(
        predicted_remaining_minutes=remaining_minutes,
        predicted_eta=eta,
        scheduled_arrival=snapshot.scheduled_arrival_time,
        predicted_lateness_minutes=lateness,
        risk_level=classify_risk(lateness),
    )


def fit_contextual_speeds(snapshots: list[PredictionSnapshot]) -> dict[tuple[str, str], float]:
    """Estimate median observed speed from development rows only."""
    speeds: dict[tuple[str, str], list[float]] = {}
    for snapshot in snapshots:
        if snapshot.actual_remaining_minutes is None or snapshot.actual_remaining_minutes <= 0:
            continue
        speed = snapshot.remaining_distance_km / (snapshot.actual_remaining_minutes / 60)
        if speed <= 0:
            continue
        speeds.setdefault((snapshot.vehicle_type, snapshot.settlement_type), []).append(speed)
    return {
        key: sorted(values)[len(values) // 2]
        for key, values in speeds.items()
        if values
    }


def contextual_speed(snapshot: PredictionSnapshot, speeds: dict[tuple[str, str], float], fallback: float = 30.0) -> float:
    return speeds.get((snapshot.vehicle_type, snapshot.settlement_type), fallback)
