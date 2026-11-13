import csv
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from simulation.config import SimulationConfig
from simulation.engine.events import ReplayEvent
from simulation.scenarios.engine import delay_minutes, scenario_markers


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def _write_events(path: Path, events: list[ReplayEvent]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        fieldnames = [
            "event_id",
            "simulation_id",
            "delivery_id",
            "vehicle_id",
            "event_type",
            "occurred_at",
            "source",
            "payload",
        ]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(event.to_row() for event in events)


def generate_events(
    config: SimulationConfig,
    generated_directory: Path,
    output_path: Path,
    scenario: str | None = None,
) -> list[ReplayEvent]:
    operations = _read_csv(generated_directory / "operations.csv")
    deliveries = _read_csv(generated_directory / "deliveries.csv")
    assignments = _read_csv(generated_directory / "assignments.csv")
    destinations = _read_csv(generated_directory / "destinations.csv")
    hubs = _read_csv(generated_directory / "hubs.csv")

    operation = operations[0]
    assignment_by_delivery = {row["delivery_id"]: row for row in assignments}
    destination_by_id = {row["location_id"]: row for row in destinations}
    hub_by_id = {row["hub_id"]: row for row in hubs}
    active_scenario = scenario or config.default_scenario
    target_destination_id = sorted(destination_by_id)[0]
    target_vehicle_id = "VEH-001"
    rng = random.Random(config.seed)
    events: list[ReplayEvent] = []
    event_number = 1

    def add_event(
        delivery: dict[str, str],
        assignment: dict[str, str],
        event_type: str,
        occurred_at: datetime,
        payload: dict[str, Any],
    ) -> None:
        nonlocal event_number
        events.append(
            ReplayEvent(
                event_id=f"EVT-{event_number:06d}",
                simulation_id=operation["operation_id"],
                delivery_id=delivery["delivery_id"],
                vehicle_id=assignment["vehicle_id"],
                event_type=event_type,
                occurred_at=occurred_at,
                source="SIMULATOR",
                payload=payload,
            )
        )
        event_number += 1

    for delivery in deliveries:
        assignment = assignment_by_delivery[delivery["delivery_id"]]
        dispatch = datetime.fromisoformat(delivery["scheduled_dispatch"])
        baseline_duration = int(delivery["planned_duration_min"])
        delay = delay_minutes(
            active_scenario,
            delivery,
            assignment,
            target_destination_id,
            target_vehicle_id,
        )
        duration = baseline_duration + delay
        origin = hub_by_id[delivery["origin_hub_id"]]
        destination = destination_by_id[delivery["destination_id"]]
        add_event(
            delivery,
            assignment,
            "DELIVERY_DISPATCHED",
            dispatch,
            {
                "origin_hub_id": delivery["origin_hub_id"],
                "progress_pct": 0,
                "scenario": active_scenario,
            },
        )
        if delay:
            add_event(
                delivery,
                assignment,
                "DELAY_REPORTED",
                dispatch,
                {
                    "scenario": active_scenario,
                    "delay_minutes": delay,
                    "baseline_duration_min": baseline_duration,
                },
            )

        for progress in (25, 50, 75):
            occurred_at = dispatch + timedelta(minutes=duration * progress / 100)
            if rng.random() < config.missing_update_probability:
                add_event(
                    delivery,
                    assignment,
                    "TELEMETRY_MISSING",
                    occurred_at,
                    {"expected_progress_pct": progress, "reason": "SIMULATED_GAP"},
                )
                continue
            fraction = progress / 100
            add_event(
                delivery,
                assignment,
                "LOCATION_UPDATE",
                occurred_at,
                {
                    "latitude": round(
                        float(origin["latitude"])
                        + (float(destination["latitude"]) - float(origin["latitude"]))
                        * fraction,
                        6,
                    ),
                    "longitude": round(
                        float(origin["longitude"])
                        + (float(destination["longitude"])
                           - float(origin["longitude"]))
                        * fraction,
                        6,
                    ),
                    "progress_pct": progress,
                },
            )

        arrival = dispatch + timedelta(minutes=duration)
        add_event(
            delivery,
            assignment,
            "ARRIVAL_RECORDED",
            arrival,
            {"destination_id": delivery["destination_id"], "progress_pct": 100},
        )
        add_event(
            delivery,
            assignment,
            "RECEIPT_CONFIRMED",
            arrival + timedelta(minutes=5),
            {"destination_id": delivery["destination_id"], "confirmed": True},
        )

    markers = scenario_markers(
        config,
        active_scenario,
        target_destination_id,
        target_vehicle_id,
    )
    for marker in markers:
        events.append(
            ReplayEvent(
                event_id=f"EVT-{event_number:06d}",
                simulation_id=operation["operation_id"],
                delivery_id="",
                vehicle_id=target_vehicle_id if active_scenario == "vehicle_unavailable" else "",
                event_type=marker.event_type,
                occurred_at=marker.occurred_at,
                source="SIMULATOR",
                payload=marker.payload,
            )
        )
        event_number += 1

    events.sort(key=lambda event: (event.occurred_at, event.event_id))
    _write_events(output_path, events)
    return events


class ReplayEngine:
    """Deterministic event cursor with pause, resume, and reset controls."""

    def __init__(self, events: list[ReplayEvent]) -> None:
        self.events = list(events)
        self.position = 0
        self.paused = False

    def start(self) -> None:
        self.paused = False

    def pause(self) -> None:
        self.paused = True

    def resume(self) -> None:
        self.paused = False

    def reset(self) -> None:
        self.position = 0
        self.paused = False

    def next_event(self) -> ReplayEvent | None:
        if self.paused or self.position >= len(self.events):
            return None
        event = self.events[self.position]
        self.position += 1
        return event

    def remaining(self) -> int:
        return len(self.events) - self.position
