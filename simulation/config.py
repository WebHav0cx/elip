from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml


class ConfigurationError(ValueError):
    """Raised when a simulation configuration is invalid."""


@dataclass(frozen=True)
class SimulationConfig:
    name: str
    seed: int
    start_time: datetime
    duration_hours: int
    speed_multiplier: float
    source_data_directory: Path
    hubs: int
    destinations: int
    vehicles: int
    vehicle_types: dict[str, int]
    delivery_count: int
    allow_multiple_trips: bool
    deadline_policy: str
    deadline_buffer_minutes: int
    telemetry_interval_seconds: int
    missing_update_probability: float
    default_scenario: str
    available_scenarios: tuple[str, ...]
    output_format: str
    output_directory: Path


def _require(mapping: dict[str, Any], key: str, section: str) -> Any:
    if key not in mapping:
        raise ConfigurationError(f"Missing configuration value: {section}.{key}")
    return mapping[key]


def load_config(path: str | Path) -> SimulationConfig:
    config_path = Path(path)
    with config_path.open(encoding="utf-8") as config_file:
        raw = yaml.safe_load(config_file) or {}

    simulation = raw.get("simulation", {})
    geography = raw.get("geography", {})
    resources = raw.get("resources", {})
    deliveries = raw.get("deliveries", {})
    telemetry = raw.get("telemetry", {})
    scenarios = raw.get("scenarios", {})
    output = raw.get("output", {})

    vehicle_types = _require(resources, "vehicle_types", "resources")
    available_scenarios = tuple(_require(scenarios, "available", "scenarios"))
    default_scenario = _require(scenarios, "default", "scenarios")
    vehicle_count = _require(resources, "vehicles", "resources")
    missing_probability = _require(
        telemetry, "missing_update_probability", "telemetry"
    )

    if not isinstance(vehicle_types, dict) or not vehicle_types:
        raise ConfigurationError("resources.vehicle_types must be a non-empty mapping")
    if any(not isinstance(count, int) or count < 0 for count in vehicle_types.values()):
        raise ConfigurationError("Vehicle type counts must be non-negative integers")
    if sum(vehicle_types.values()) != vehicle_count:
        raise ConfigurationError(
            "The sum of resources.vehicle_types must equal resources.vehicles"
        )
    if not isinstance(missing_probability, (int, float)) or not 0 <= missing_probability <= 1:
        raise ConfigurationError(
            "telemetry.missing_update_probability must be between 0 and 1"
        )
    deadline_policy = _require(deliveries, "deadline_policy", "deliveries")
    if deadline_policy not in {"generated", "relaxed", "standard", "tight", "stress"}:
        raise ConfigurationError("deliveries.deadline_policy is not supported")
    default_buffers = {"generated": 60, "relaxed": 60, "standard": 30, "tight": 15, "stress": 0}
    deadline_buffer = deliveries.get("deadline_buffer_minutes", default_buffers[deadline_policy])
    if not isinstance(deadline_buffer, int) or deadline_buffer < 0:
        raise ConfigurationError("deliveries.deadline_buffer_minutes must be a non-negative integer")
    if default_scenario not in available_scenarios:
        raise ConfigurationError(
            "scenarios.default must be included in scenarios.available"
        )
    if _require(simulation, "duration_hours", "simulation") <= 0:
        raise ConfigurationError("simulation.duration_hours must be greater than zero")
    if _require(simulation, "speed_multiplier", "simulation") <= 0:
        raise ConfigurationError("simulation.speed_multiplier must be greater than zero")
    if _require(telemetry, "interval_seconds", "telemetry") <= 0:
        raise ConfigurationError("telemetry.interval_seconds must be greater than zero")
    if _require(geography, "hubs", "geography") <= 0:
        raise ConfigurationError("geography.hubs must be greater than zero")
    if _require(geography, "destinations", "geography") <= 0:
        raise ConfigurationError("geography.destinations must be greater than zero")
    if _require(deliveries, "count", "deliveries") <= 0:
        raise ConfigurationError("deliveries.count must be greater than zero")

    try:
        start_time = datetime.fromisoformat(_require(simulation, "start_time", "simulation"))
    except ValueError as exc:
        raise ConfigurationError("simulation.start_time must be ISO 8601") from exc
    if start_time.tzinfo is None:
        raise ConfigurationError("simulation.start_time must include a timezone")

    return SimulationConfig(
        name=_require(simulation, "name", "simulation"),
        seed=_require(simulation, "seed", "simulation"),
        start_time=start_time,
        duration_hours=simulation["duration_hours"],
        speed_multiplier=simulation["speed_multiplier"],
        source_data_directory=Path(geography["source_data_directory"]),
        hubs=geography["hubs"],
        destinations=geography["destinations"],
        vehicles=vehicle_count,
        vehicle_types=dict(vehicle_types),
        delivery_count=deliveries["count"],
        allow_multiple_trips=deliveries["allow_multiple_trips"],
        deadline_policy=deadline_policy,
        deadline_buffer_minutes=deadline_buffer,
        telemetry_interval_seconds=telemetry["interval_seconds"],
        missing_update_probability=missing_probability,
        default_scenario=default_scenario,
        available_scenarios=available_scenarios,
        output_format=output["format"],
        output_directory=Path(output["directory"]),
    )
