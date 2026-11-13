from pathlib import Path

from simulation.config import load_config
from simulation.generators.operation import generate_operation


SIMULATION_DIR = Path(__file__).parents[1]


def test_generation_is_reproducible(tmp_path: Path) -> None:
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    first = generate_operation(config, SIMULATION_DIR, tmp_path / "first")
    second = generate_operation(config, SIMULATION_DIR, tmp_path / "second")

    assert first == second
    assert len(first["hubs"]) == config.hubs
    assert len(first["destinations"]) == config.destinations
    assert len(first["vehicles"]) == config.vehicles
    assert len(first["deliveries"]) == config.delivery_count


def test_generated_references_and_capacity_are_valid(tmp_path: Path) -> None:
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    generated = generate_operation(config, SIMULATION_DIR, tmp_path)
    destinations = {row["location_id"] for row in generated["destinations"]}
    vehicles = {row["vehicle_id"]: row for row in generated["vehicles"]}
    deliveries = {row["delivery_id"]: row for row in generated["deliveries"]}

    for delivery in deliveries.values():
        assert delivery["destination_id"] in destinations

    for assignment in generated["assignments"]:
        delivery = deliveries[assignment["delivery_id"]]
        vehicle = vehicles[assignment["vehicle_id"]]
        assert int(delivery["demand_units"]) <= int(vehicle["capacity_units"])
