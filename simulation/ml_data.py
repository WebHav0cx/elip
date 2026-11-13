import argparse
import csv
from dataclasses import replace
from datetime import datetime
from pathlib import Path

from simulation.config import load_config
from simulation.engine.replay import generate_events


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def _write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def generate_ml_datasets(
    config_path: Path,
    generated_directory: Path,
    output_directory: Path,
    scenario: str | None = None,
    seed: int | None = None,
) -> dict[str, list[dict[str, str]]]:
    config = load_config(config_path)
    if seed is not None:
        config = replace(config, seed=seed)
    operations = _read_csv(generated_directory / "operations.csv")
    deliveries = _read_csv(generated_directory / "deliveries.csv")
    assignments = _read_csv(generated_directory / "assignments.csv")
    vehicles = _read_csv(generated_directory / "vehicles.csv")
    destinations = _read_csv(generated_directory / "destinations.csv")
    events = generate_events(config, generated_directory, output_directory / "events.csv", scenario)

    operation = operations[0]
    active_scenario = scenario or config.default_scenario
    assignment_by_delivery = {row["delivery_id"]: row for row in assignments}
    vehicle_by_id = {row["vehicle_id"]: row for row in vehicles}
    destination_by_id = {row["location_id"]: row for row in destinations}
    events_by_delivery: dict[str, list] = {}
    for event in events:
        events_by_delivery.setdefault(event.delivery_id, []).append(event)

    historical = []
    snapshots = []
    for delivery in deliveries:
        delivery_id = delivery["delivery_id"]
        assignment = assignment_by_delivery[delivery_id]
        vehicle = vehicle_by_id[assignment["vehicle_id"]]
        destination = destination_by_id[delivery["destination_id"]]
        delivery_events = events_by_delivery[delivery_id]
        dispatch_event = next(
            event for event in delivery_events if event.event_type == "DELIVERY_DISPATCHED"
        )
        arrival_event = next(
            event for event in delivery_events if event.event_type == "ARRIVAL_RECORDED"
        )
        dispatch = dispatch_event.occurred_at
        arrival = arrival_event.occurred_at
        deadline = datetime.fromisoformat(delivery["arrival_deadline"])
        actual_duration = round((arrival - dispatch).total_seconds() / 60)
        delay_minutes = max(0, round((arrival - deadline).total_seconds() / 60))
        has_disruption = any(
            event.event_type in {"DELAY_REPORTED", "TELEMETRY_MISSING"}
            for event in delivery_events
        )
        weather = "HEAVY_RAIN" if active_scenario == "heavy_rain" else "CLEAR"

        historical.append(
            {
                "delivery_id": delivery_id,
                "simulation_id": operation["operation_id"],
                "distance_km": destination["distance_to_hub_km"],
                "vehicle_type": vehicle["vehicle_type"],
                "settlement_type": destination["settlement"],
                "planned_duration_min": delivery["planned_duration_min"],
                "dispatch_hour": str(dispatch.hour),
                "weather_condition": weather,
                "disruption_reported": str(has_disruption).lower(),
                "actual_duration_min": str(actual_duration),
                "delay_minutes": str(delay_minutes),
                "is_delayed": str(delay_minutes > 0).lower(),
            }
        )

        for progress in (0, 25, 50, 75):
            snapshot_time = dispatch + (arrival - dispatch) * (progress / 100)
            actual_remaining = max(
                0, round((arrival - snapshot_time).total_seconds() / 60)
            )
            observed_events = [
                event for event in delivery_events if event.occurred_at <= snapshot_time
            ]
            snapshot_disruption = any(
                event.event_type in {"DELAY_REPORTED", "TELEMETRY_MISSING"}
                for event in observed_events
            )
            snapshots.append(
                {
                    "delivery_id": delivery_id,
                    "simulation_id": operation["operation_id"],
                    "snapshot_time": snapshot_time.isoformat(),
                    "scheduled_arrival_time": deadline.isoformat(),
                    "journey_progress_pct": str(progress),
                    "elapsed_minutes": str(
                        round((snapshot_time - dispatch).total_seconds() / 60)
                    ),
                    "dispatch_hour": str(dispatch.hour),
                    "remaining_distance_km": str(
                        round(float(destination["distance_to_hub_km"]) * (1 - progress / 100), 2)
                    ),
                    "vehicle_type": vehicle["vehicle_type"],
                    "settlement_type": destination["settlement"],
                    "planned_duration_min": delivery["planned_duration_min"],
                    "weather_condition": weather,
                    "disruption_reported": str(snapshot_disruption).lower(),
                    "actual_arrival_time": arrival.isoformat(),
                    "actual_remaining_minutes": str(actual_remaining),
                    "is_delayed": str(delay_minutes > 0).lower(),
                }
            )

    split_manifest = [
        {
            "simulation_id": operation["operation_id"],
            "split": "development_only",
            "reason": "One independent simulation is available; create separate simulation seeds before evaluation.",
        }
    ]
    datasets = {
        "historical_deliveries": historical,
        "prediction_snapshots": snapshots,
        "split_manifest": split_manifest,
    }
    for name, rows in datasets.items():
        _write_csv(output_directory / f"{name}.csv", rows)
    return datasets


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate ML-ready simulation datasets")
    parser.add_argument("--config", default="simulation/configs/default.yaml")
    parser.add_argument("--data", default="simulation/datasets/generated")
    parser.add_argument("--output", default="simulation/datasets/ml")
    parser.add_argument("--scenario", default=None)
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()

    datasets = generate_ml_datasets(
        Path(args.config).resolve(),
        Path(args.data).resolve(),
        Path(args.output).resolve(),
        args.scenario,
        args.seed,
    )
    print(f"Generated ML datasets in {Path(args.output).resolve()}")
    for name, rows in datasets.items():
        print(f"  {name}.csv: {len(rows)} rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
