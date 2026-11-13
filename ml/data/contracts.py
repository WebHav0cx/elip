from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class PredictionSnapshot:
    """A point-in-time record containing only information available then plus labels."""

    delivery_id: str
    simulation_id: str
    snapshot_time: datetime
    remaining_distance_km: float
    elapsed_minutes: float
    journey_progress_pct: float
    vehicle_type: str
    settlement_type: str
    planned_duration_min: float
    dispatch_hour: int
    weather_condition: str
    disruption_reported: bool
    actual_arrival_time: datetime | None
    scheduled_arrival_time: datetime | None
    actual_remaining_minutes: float | None
    is_delayed: bool | None
    last_update_age_min: float | None = None


@dataclass(frozen=True)
class PredictionTarget:
    remaining_time_min: float


@dataclass(frozen=True)
class FeatureRow:
    remaining_distance_km: float
    elapsed_minutes: float
    journey_progress_pct: float
    vehicle_type: str
    settlement_type: str
    planned_duration_min: float
    dispatch_hour: int
    weather_condition: str
    disruption_reported: bool
    last_update_age_min: float

    def as_dict(self) -> dict[str, object]:
        return {
            "remaining_distance_km": self.remaining_distance_km,
            "elapsed_minutes": self.elapsed_minutes,
            "journey_progress_pct": self.journey_progress_pct,
            "vehicle_type": self.vehicle_type,
            "settlement_type": self.settlement_type,
            "planned_duration_min": self.planned_duration_min,
            "dispatch_hour": self.dispatch_hour,
            "weather_condition": self.weather_condition,
            "disruption_reported": self.disruption_reported,
            "last_update_age_min": self.last_update_age_min,
        }
