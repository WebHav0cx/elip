from pathlib import Path

from simulation.config import load_config
from simulation.engine.replay import generate_events
from simulation.generators.operation import generate_operation


SIMULATION_DIR = Path(__file__).parents[1]


def _events_for(tmp_path: Path, scenario: str):
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    generated_directory = tmp_path / scenario
    generate_operation(config, SIMULATION_DIR, generated_directory)
    return generate_events(
        config,
        generated_directory,
        generated_directory / "events.csv",
        scenario,
    )


def test_normal_scenario_has_no_disruption_markers(tmp_path: Path) -> None:
    events = _events_for(tmp_path, "normal")

    assert not {
        event.event_type
        for event in events
        if event.event_type in {"DISRUPTION_STARTED", "VEHICLE_UNAVAILABLE"}
    }


def test_road_disruption_changes_delivery_timing(tmp_path: Path) -> None:
    normal = _events_for(tmp_path, "normal")
    disrupted = _events_for(tmp_path, "road_disruption")

    normal_arrivals = {
        event.delivery_id: event.occurred_at
        for event in normal
        if event.event_type == "ARRIVAL_RECORDED"
    }
    disrupted_arrivals = {
        event.delivery_id: event.occurred_at
        for event in disrupted
        if event.event_type == "ARRIVAL_RECORDED"
    }
    assert any(
        disrupted_arrivals[delivery_id] > normal_arrivals[delivery_id]
        for delivery_id in normal_arrivals
    )
    assert any(event.event_type == "DISRUPTION_STARTED" for event in disrupted)
