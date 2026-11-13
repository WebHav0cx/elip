from datetime import datetime

import pytest

from ml.data.contracts import PredictionSnapshot
from ml.models.baseline import classify_risk, fit_contextual_speeds, predict_eta


def _snapshot(**changes) -> PredictionSnapshot:
    values = {
        "delivery_id": "DEL-001",
        "simulation_id": "SIM-001",
        "snapshot_time": datetime.fromisoformat("2026-12-03T06:00:00+01:00"),
        "remaining_distance_km": 30.0,
        "elapsed_minutes": 0.0,
        "journey_progress_pct": 0.0,
        "vehicle_type": "truck",
        "settlement_type": "urban",
        "planned_duration_min": 60.0,
        "dispatch_hour": 6,
        "weather_condition": "CLEAR",
        "disruption_reported": False,
        "actual_arrival_time": None,
        "scheduled_arrival_time": datetime.fromisoformat("2026-12-03T07:00:00+01:00"),
        "actual_remaining_minutes": 60.0,
        "is_delayed": False,
    }
    values.update(changes)
    return PredictionSnapshot(**values)


def test_baseline_eta_and_risk() -> None:
    prediction = predict_eta(_snapshot(), speed_kmh=30)

    assert prediction.predicted_remaining_minutes == pytest.approx(60)
    assert prediction.predicted_lateness_minutes == pytest.approx(0)
    assert prediction.risk_level == "LOW"


def test_risk_thresholds() -> None:
    assert classify_risk(0) == "LOW"
    assert classify_risk(30) == "AT_RISK"
    assert classify_risk(30.1) == "HIGH"


def test_contextual_speed_uses_development_data() -> None:
    speeds = fit_contextual_speeds([_snapshot()])

    assert speeds[("truck", "urban")] == pytest.approx(30)
