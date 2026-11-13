from pathlib import Path

from simulation.config import load_config
from simulation.engine.replay import ReplayEngine, generate_events
from simulation.generators.operation import generate_operation


SIMULATION_DIR = Path(__file__).parents[1]


def test_replay_generates_ordered_lifecycle_events(tmp_path: Path) -> None:
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    generated_directory = tmp_path / "generated"
    generate_operation(config, SIMULATION_DIR, generated_directory)
    events = generate_events(config, generated_directory, generated_directory / "events.csv")

    assert len(events) >= config.delivery_count * 5
    assert len({event.event_id for event in events}) == len(events)
    assert events == sorted(events, key=lambda event: (event.occurred_at, event.event_id))
    event_types = {event.event_type for event in events}
    assert {"DELIVERY_DISPATCHED", "ARRIVAL_RECORDED", "RECEIPT_CONFIRMED"} <= event_types


def test_replay_pause_resume_and_reset(tmp_path: Path) -> None:
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    generated_directory = tmp_path / "generated"
    generate_operation(config, SIMULATION_DIR, generated_directory)
    events = generate_events(config, generated_directory, generated_directory / "events.csv")
    engine = ReplayEngine(events)

    first = engine.next_event()
    engine.pause()
    assert engine.next_event() is None
    engine.resume()
    assert engine.next_event() is not None
    engine.reset()
    assert engine.next_event() == first
