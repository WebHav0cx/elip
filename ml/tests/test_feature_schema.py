from pathlib import Path

import pytest

from ml.data.contracts import FeatureRow
from ml.features.feature_builder import build_features, build_training_row
from ml.features.schema import parse_snapshot


ROOT = Path(__file__).parents[2]
SNAPSHOTS = ROOT / "simulation" / "datasets" / "ml" / "prediction_snapshots.csv"


def _row() -> dict[str, str]:
    import csv

    with SNAPSHOTS.open(newline="", encoding="utf-8-sig") as file:
        return next(csv.DictReader(file))


def test_snapshot_builds_stable_feature_contract() -> None:
    features = build_features(_row())

    assert isinstance(features, FeatureRow)
    assert set(features.as_dict()) == {
        "remaining_distance_km", "elapsed_minutes", "journey_progress_pct",
        "vehicle_type", "settlement_type", "planned_duration_min",
        "dispatch_hour", "weather_condition", "disruption_reported",
        "last_update_age_min",
    }


def test_invalid_progress_is_rejected() -> None:
    row = _row()
    row["journey_progress_pct"] = "101"

    with pytest.raises(ValueError, match="between 0 and 100"):
        parse_snapshot(row)


def test_training_target_is_separate_from_features() -> None:
    features, target = build_training_row(_row())

    assert "actual_remaining_minutes" not in features
    assert "actual_arrival_time" not in features
    assert target.remaining_time_min >= 0
