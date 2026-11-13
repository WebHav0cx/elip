from ml.data.contracts import FeatureRow, PredictionSnapshot, PredictionTarget
from ml.features.feature_definitions import FEATURE_NAMES, LEAKAGE_FIELDS
from ml.features.schema import parse_snapshot, parse_target, validate_feature_values


def build_features(snapshot: PredictionSnapshot | dict[str, str]) -> FeatureRow:
    """Build inference features using only fields available at snapshot time."""
    parsed = parse_snapshot(snapshot) if isinstance(snapshot, dict) else snapshot
    features = FeatureRow(
        remaining_distance_km=parsed.remaining_distance_km,
        elapsed_minutes=parsed.elapsed_minutes,
        journey_progress_pct=parsed.journey_progress_pct,
        vehicle_type=parsed.vehicle_type,
        settlement_type=parsed.settlement_type,
        planned_duration_min=parsed.planned_duration_min,
        dispatch_hour=parsed.dispatch_hour,
        weather_condition=parsed.weather_condition,
        disruption_reported=parsed.disruption_reported,
        last_update_age_min=parsed.last_update_age_min or 0.0,
    )
    validate_feature_values(features.as_dict())
    return features


def build_training_row(row: dict[str, str]) -> tuple[dict[str, object], PredictionTarget]:
    """Return model inputs and a separate target; outcome columns never enter features."""
    snapshot = parse_snapshot(row)
    target = parse_target(row)
    features = build_features(snapshot).as_dict()
    assert not LEAKAGE_FIELDS.intersection(features)
    assert set(features).issubset(FEATURE_NAMES)
    return features, target
