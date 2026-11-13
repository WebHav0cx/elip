from pathlib import Path

import pytest

from simulation.config import ConfigurationError, load_config


CONFIG_PATH = Path(__file__).parents[1] / "configs" / "default.yaml"


def test_default_config_is_valid() -> None:
    config = load_config(CONFIG_PATH)

    assert config.seed == 2026
    assert config.vehicles == 10
    assert sum(config.vehicle_types.values()) == config.vehicles
    assert config.default_scenario in config.available_scenarios


def test_vehicle_counts_must_match(tmp_path: Path) -> None:
    invalid_config = tmp_path / "invalid.yaml"
    invalid_config.write_text(
        """
simulation:
  name: test
  seed: 1
  start_time: 2026-12-03T06:00:00+01:00
  duration_hours: 1
  speed_multiplier: 1
geography:
  source_data_directory: .
  hubs: 1
  destinations: 1
resources:
  vehicles: 2
  vehicle_types: {bus: 1}
deliveries: {count: 1, allow_multiple_trips: false, deadline_policy: generated}
telemetry: {interval_seconds: 30, missing_update_probability: 0}
scenarios: {default: normal, available: [normal]}
output: {format: csv, directory: datasets/generated}
""",
        encoding="utf-8",
    )

    with pytest.raises(ConfigurationError, match="vehicle_types"):
        load_config(invalid_config)
