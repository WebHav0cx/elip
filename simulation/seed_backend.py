import argparse
import csv
import json
from pathlib import Path
from typing import Any

from simulation.adapters.api_client import SimulationAPIClient


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def _data(response: dict[str, Any]) -> dict[str, Any]:
    return response["data"]


def seed_backend(
    data_directory: Path,
    base_url: str,
    map_path: Path,
    email: str | None = None,
    password: str | None = None,
) -> dict[str, dict[str, str]]:
    operations = _read(data_directory / "operations.csv")
    hubs = _read(data_directory / "hubs.csv")
    destinations = _read(data_directory / "destinations.csv")
    vehicles = _read(data_directory / "vehicles.csv")
    personnel = _read(data_directory / "personnel.csv")
    deliveries = _read(data_directory / "deliveries.csv")
    assignments = _read(data_directory / "assignments.csv")

    client = SimulationAPIClient(base_url)
    client.authenticate(email, password)
    id_map: dict[str, dict[str, str]] = {
        "operations": {},
        "locations": {},
        "vehicles": {},
        "personnel": {},
        "deliveries": {},
    }
    try:
        operation = operations[0]
        operation_record = _data(
            client.post(
                "/api/v1/operations",
                {
                    "name": operation["name"],
                    "seed": int(operation["seed"]),
                    "start_time": operation["start_time"],
                    "duration_hours": int(operation["duration_hours"]),
                },
            )
        )
        id_map["operations"][operation["operation_id"]] = operation_record["id"]
        operation_uuid = operation_record["id"]

        for location in hubs + destinations:
            external_id = location.get("hub_id") or location["location_id"]
            record = _data(
                client.post(
                    f"/api/v1/operations/{operation_uuid}/locations",
                    {
                        "operation_id": operation_uuid,
                        "location_code": external_id,
                        "location_type": location.get("location_type", "HUB"),
                        "name": location["name"],
                        "state": location.get("state"),
                        "lga": location.get("lga"),
                        "ward": location.get("ward"),
                        "settlement": location.get("settlement"),
                        "latitude": float(location["latitude"]),
                        "longitude": float(location["longitude"]),
                        "distance_to_hub_km": float(location["distance_to_hub_km"])
                        if location.get("distance_to_hub_km")
                        else None,
                        "source_pu_id": location.get("source_pu_id"),
                    },
                )
            )
            id_map["locations"][external_id] = record["id"]

        for vehicle in vehicles:
            record = _data(
                client.post(
                    f"/api/v1/operations/{operation_uuid}/vehicles",
                    {
                        "operation_id": operation_uuid,
                        "vehicle_code": vehicle["vehicle_id"],
                        "vehicle_type": vehicle["vehicle_type"],
                        "capacity_units": int(vehicle["capacity_units"]),
                        "base_hub_id": id_map["locations"][vehicle["base_hub_id"]],
                        "availability_status": vehicle["availability_status"],
                        "speed_profile": vehicle["speed_profile"],
                        "supported_transport_mode": vehicle["supported_transport_mode"],
                    },
                )
            )
            id_map["vehicles"][vehicle["vehicle_id"]] = record["id"]

        for person in personnel:
            record = _data(
                client.post(
                    f"/api/v1/operations/{operation_uuid}/personnel",
                    {
                        "operation_id": operation_uuid,
                        "personnel_code": person["personnel_id"],
                        "role": person["role"],
                        "availability_start": person["availability_start"],
                        "availability_end": person["availability_end"],
                    },
                )
            )
            id_map["personnel"][person["personnel_id"]] = record["id"]

        for delivery in deliveries:
            record = _data(
                client.post(
                    f"/api/v1/operations/{operation_uuid}/deliveries",
                    {
                        "operation_id": operation_uuid,
                        "delivery_code": delivery["delivery_id"],
                        "origin_hub_id": id_map["locations"][delivery["origin_hub_id"]],
                        "destination_id": id_map["locations"][delivery["destination_id"]],
                        "demand_units": int(delivery["demand_units"]),
                        "planned_duration_min": int(delivery["planned_duration_min"]),
                        "scheduled_dispatch": delivery["scheduled_dispatch"],
                        "arrival_deadline": delivery["arrival_deadline"],
                    },
                )
            )
            id_map["deliveries"][delivery["delivery_id"]] = record["id"]

        for assignment in assignments:
            client.post(
                f"/api/v1/deliveries/{id_map['deliveries'][assignment['delivery_id']]}/assignments",
                {
                    "delivery_id": id_map["deliveries"][assignment["delivery_id"]],
                    "vehicle_id": id_map["vehicles"][assignment["vehicle_id"]],
                    "personnel_id": id_map["personnel"][assignment["personnel_id"]],
                    "assigned_at": assignment["assigned_at"],
                },
            )
    finally:
        client.close()

    map_path.parent.mkdir(parents=True, exist_ok=True)
    map_path.write_text(json.dumps(id_map, indent=2), encoding="utf-8")
    return id_map


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed generated operation data through the backend API")
    parser.add_argument("--data", default="simulation/datasets/generated")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--id-map", default="simulation/datasets/generated/id-map.json")
    parser.add_argument("--email", default=None)
    parser.add_argument("--password", default=None)
    args = parser.parse_args()
    id_map = seed_backend(Path(args.data).resolve(), args.base_url, Path(args.id_map).resolve(), args.email, args.password)
    print(f"Seeded operation and wrote {sum(len(values) for values in id_map.values())} ID mappings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
