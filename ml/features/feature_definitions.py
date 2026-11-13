from dataclasses import dataclass
from typing import Literal


Availability = Literal["PRE_DISPATCH", "IN_TRANSIT"]
FEATURE_SCHEMA_VERSION = "1.0.0"


@dataclass(frozen=True)
class FeatureDefinition:
    name: str
    data_type: str
    availability: Availability
    required: bool
    description: str


FEATURE_DEFINITIONS = (
    FeatureDefinition("remaining_distance_km", "float", "IN_TRANSIT", True, "Estimated distance still to travel."),
    FeatureDefinition("elapsed_minutes", "float", "IN_TRANSIT", True, "Minutes since dispatch."),
    FeatureDefinition("journey_progress_pct", "float", "IN_TRANSIT", True, "Observed journey progress from 0 to 100."),
    FeatureDefinition("vehicle_type", "category", "PRE_DISPATCH", True, "Simulated transport category."),
    FeatureDefinition("settlement_type", "category", "PRE_DISPATCH", True, "Urban or rural destination classification."),
    FeatureDefinition("planned_duration_min", "float", "PRE_DISPATCH", True, "Scheduled journey duration."),
    FeatureDefinition("dispatch_hour", "integer", "PRE_DISPATCH", True, "Hour of dispatch in local time."),
    FeatureDefinition("weather_condition", "category", "IN_TRANSIT", True, "Known weather condition at prediction time."),
    FeatureDefinition("disruption_reported", "boolean", "IN_TRANSIT", True, "Whether a valid disruption was observed by prediction time."),
    FeatureDefinition("last_update_age_min", "float", "IN_TRANSIT", False, "Minutes since the latest movement update."),
)

FEATURE_NAMES = tuple(item.name for item in FEATURE_DEFINITIONS)
REQUIRED_FEATURE_NAMES = tuple(item.name for item in FEATURE_DEFINITIONS if item.required)

# These fields are outcomes or future information. They must never enter inference features.
LEAKAGE_FIELDS = frozenset({
    "actual_arrival_time",
    "actual_remaining_minutes",
    "remaining_time_min",
    "actual_duration_min",
    "delay_minutes",
    "is_delayed",
    "arrival_event_time",
})

TARGET_NAME = "remaining_time_min"
