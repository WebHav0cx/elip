from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from simulation.config import SimulationConfig


SUPPORTED_SCENARIOS = {
    "normal",
    "heavy_rain",
    "road_disruption",
    "vehicle_unavailable",
}


@dataclass(frozen=True)
class ScenarioMarker:
    event_type: str
    occurred_at: datetime
    payload: dict[str, Any]


def validate_scenario(name: str, available: tuple[str, ...]) -> None:
    if name not in SUPPORTED_SCENARIOS:
        raise ValueError(f"Unsupported scenario: {name}")
    if name not in available:
        raise ValueError(f"Scenario is not enabled in configuration: {name}")


def scenario_markers(
    config: SimulationConfig,
    scenario: str,
    target_destination_id: str,
    target_vehicle_id: str,
) -> list[ScenarioMarker]:
    validate_scenario(scenario, config.available_scenarios)
    if scenario == "normal":
        return []

    if scenario == "heavy_rain":
        start = config.start_time + timedelta(hours=2)
        return [
            ScenarioMarker(
                "DISRUPTION_STARTED",
                start,
                {
                    "category": "HEAVY_RAIN",
                    "severity": 3,
                    "affected_zone": "SIMULATED-ZONE-A",
                    "verification_status": "SIMULATED_CONFIRMED",
                    "expected_duration_minutes": 90,
                },
            ),
            ScenarioMarker(
                "DISRUPTION_ENDED",
                start + timedelta(minutes=90),
                {"category": "HEAVY_RAIN", "affected_zone": "SIMULATED-ZONE-A"},
            ),
        ]

    if scenario == "road_disruption":
        start = config.start_time + timedelta(hours=3)
        return [
            ScenarioMarker(
                "DISRUPTION_STARTED",
                start,
                {
                    "category": "ROAD_DISRUPTION",
                    "severity": 3,
                    "affected_destination_id": target_destination_id,
                    "verification_status": "SIMULATED_CONFIRMED",
                    "expected_duration_minutes": 120,
                },
            ),
            ScenarioMarker(
                "DISRUPTION_ENDED",
                start + timedelta(minutes=120),
                {"category": "ROAD_DISRUPTION", "affected_destination_id": target_destination_id},
            ),
        ]

    start = config.start_time + timedelta(hours=1)
    return [
        ScenarioMarker(
            "VEHICLE_UNAVAILABLE",
            start,
            {
                "vehicle_id": target_vehicle_id,
                "reason": "SIMULATED_RESOURCE_FAILURE",
                "expected_duration_minutes": 180,
            },
        )
    ]


def delay_minutes(
    scenario: str,
    delivery: dict[str, str],
    assignment: dict[str, str],
    target_destination_id: str,
    target_vehicle_id: str,
) -> int:
    if scenario == "heavy_rain":
        return 30 if int(delivery["delivery_id"].split("-")[-1]) % 2 == 0 else 0
    if scenario == "road_disruption":
        return 45 if delivery["destination_id"] == target_destination_id else 0
    if scenario == "vehicle_unavailable":
        return 120 if assignment["vehicle_id"] == target_vehicle_id else 0
    return 0
