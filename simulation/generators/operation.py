import csv
import random
from datetime import timedelta
from pathlib import Path
from typing import Any

from simulation.config import SimulationConfig


VEHICLE_PROFILES = {
    "bus": {"capacity_units": 80, "mode": "road", "speed_kmh": 45},
    "truck": {"capacity_units": 120, "mode": "road", "speed_kmh": 40},
    "motorcycle": {"capacity_units": 20, "mode": "road", "speed_kmh": 55},
    "boat": {"capacity_units": 60, "mode": "water", "speed_kmh": 25},
}


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def _operation_id(config: SimulationConfig) -> str:
    return f"SIM-{config.seed}-001"


def _generate_hubs(config: SimulationConfig, rng: random.Random) -> list[dict[str, Any]]:
    return [
        {
            "hub_id": f"HUB-{index:03d}",
            "operation_id": _operation_id(config),
            "name": f"Fictional Distribution Hub {chr(64 + index)}",
            "state": f"Demo State {index}",
            "lga": f"Demo LGA {index}",
            "latitude": f"{7.0 + rng.random() * 4.0:.6f}",
            "longitude": f"{4.0 + rng.random() * 7.0:.6f}",
        }
        for index in range(1, config.hubs + 1)
    ]


def _generate_destinations(
    config: SimulationConfig,
    polling_units: list[dict[str, str]],
    logistics_by_pu: dict[str, dict[str, str]],
    rng: random.Random,
) -> list[dict[str, Any]]:
    destinations = []
    eligible_polling_units = [
        row for row in polling_units if row["pu_id"] in logistics_by_pu
    ]
    for index, polling_unit in enumerate(
        rng.sample(eligible_polling_units, config.destinations), start=1
    ):
        logistics = logistics_by_pu[polling_unit["pu_id"]]
        destinations.append(
            {
                "location_id": f"LOC-{index:03d}",
                "operation_id": _operation_id(config),
                "source_pu_id": polling_unit["pu_id"],
                "location_type": "DESTINATION",
                "name": f"Fictional Destination {index:03d}",
                "state": polling_unit["state"],
                "lga": polling_unit["lga"],
                "ward": polling_unit["ward"],
                "settlement": polling_unit["settlement"],
                "latitude": f"{7.0 + rng.random() * 4.0:.6f}",
                "longitude": f"{4.0 + rng.random() * 7.0:.6f}",
                "distance_to_hub_km": logistics["distance_km"],
            }
        )
    return destinations


def _generate_vehicles(config: SimulationConfig) -> list[dict[str, Any]]:
    vehicles = []
    vehicle_index = 1
    for vehicle_type, count in config.vehicle_types.items():
        profile = VEHICLE_PROFILES[vehicle_type]
        for _ in range(count):
            vehicles.append(
                {
                    "vehicle_id": f"VEH-{vehicle_index:03d}",
                    "operation_id": _operation_id(config),
                    "vehicle_type": vehicle_type,
                    "capacity_units": profile["capacity_units"],
                    "base_hub_id": f"HUB-{((vehicle_index - 1) % config.hubs) + 1:03d}",
                    "availability_status": "AVAILABLE",
                    "speed_profile": f"{profile['speed_kmh']} km/h baseline",
                    "supported_transport_mode": profile["mode"],
                }
            )
            vehicle_index += 1
    return vehicles


def _generate_personnel(config: SimulationConfig) -> list[dict[str, Any]]:
    end_time = config.start_time + timedelta(hours=config.duration_hours)
    return [
        {
            "personnel_id": f"PER-{index:03d}",
            "operation_id": _operation_id(config),
            "role": "DRIVER",
            "availability_start": config.start_time.isoformat(),
            "availability_end": end_time.isoformat(),
        }
        for index in range(1, config.vehicles + 1)
    ]


def generate_operation(
    config: SimulationConfig,
    source_data_directory: Path,
    output_directory: Path,
) -> dict[str, list[dict[str, Any]]]:
    rng = random.Random(config.seed)
    polling_units = _read_csv(source_data_directory / "polling_units_synthetic.csv")
    logistics = _read_csv(source_data_directory / "logistics_deliveries_synthetic.csv")
    logistics_by_pu = {row["pu_id"]: row for row in logistics}

    hubs = _generate_hubs(config, rng)
    destinations = _generate_destinations(config, polling_units, logistics_by_pu, rng)
    vehicles = _generate_vehicles(config)
    personnel = _generate_personnel(config)
    vehicle_by_id = {vehicle["vehicle_id"]: vehicle for vehicle in vehicles}
    next_available = {vehicle_id: config.start_time for vehicle_id in vehicle_by_id}

    deliveries = []
    assignments = []
    vehicle_ids = list(vehicle_by_id)
    for index in range(config.delivery_count):
        destination = destinations[index % len(destinations)]
        vehicle_id = vehicle_ids[index % len(vehicle_ids)]
        vehicle = vehicle_by_id[vehicle_id]
        logistics_row = logistics_by_pu[destination["source_pu_id"]]
        planned_duration = max(30, round(float(logistics_row["transit_hours"]) * 60))
        dispatch_time = next_available[vehicle_id]
        arrival_time = dispatch_time + timedelta(minutes=planned_duration)
        deadline = arrival_time + timedelta(minutes=config.deadline_buffer_minutes)
        demand = 1 + ((index * 7) % min(vehicle["capacity_units"], 40))
        delivery_id = f"DEL-{index + 1:03d}"
        personnel_id = f"PER-{((int(vehicle_id[-3:]) - 1) % config.vehicles) + 1:03d}"

        deliveries.append(
            {
                "delivery_id": delivery_id,
                "operation_id": _operation_id(config),
                "origin_hub_id": vehicle["base_hub_id"],
                "destination_id": destination["location_id"],
                "demand_units": demand,
                "planned_duration_min": planned_duration,
                "scheduled_dispatch": dispatch_time.isoformat(),
                "arrival_deadline": deadline.isoformat(),
                "status": "PLANNED",
            }
        )
        assignments.append(
            {
                "assignment_id": f"ASN-{index + 1:03d}",
                "delivery_id": delivery_id,
                "vehicle_id": vehicle_id,
                "personnel_id": personnel_id,
                "assigned_at": config.start_time.isoformat(),
            }
        )
        next_available[vehicle_id] = arrival_time + timedelta(minutes=15)

    generated = {
        "operations": [
            {
                "operation_id": _operation_id(config),
                "name": config.name,
                "seed": config.seed,
                "start_time": config.start_time.isoformat(),
                "duration_hours": config.duration_hours,
                "default_scenario": config.default_scenario,
            }
        ],
        "hubs": hubs,
        "destinations": destinations,
        "vehicles": vehicles,
        "personnel": personnel,
        "deliveries": deliveries,
        "assignments": assignments,
    }
    for name, rows in generated.items():
        _write_csv(output_directory / f"{name}.csv", rows)
    return generated
