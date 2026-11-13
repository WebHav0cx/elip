import csv
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path


GENERATED_FILES = (
    "operations.csv",
    "hubs.csv",
    "destinations.csv",
    "vehicles.csv",
    "personnel.csv",
    "deliveries.csv",
    "assignments.csv",
)


@dataclass(frozen=True)
class GeneratedDataReport:
    files_checked: int
    rows_checked: dict[str, int]
    errors: tuple[str, ...]
    warnings: tuple[str, ...]

    @property
    def valid(self) -> bool:
        return not self.errors


def _read_csv(directory: Path, filename: str) -> list[dict[str, str]]:
    with (directory / filename).open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def _unique_ids(rows: list[dict[str, str]], field: str, label: str) -> list[str]:
    values = [row.get(field, "") for row in rows]
    if "" in values:
        raise ValueError(f"{label} contains a blank {field}")
    if len(set(values)) != len(values):
        raise ValueError(f"{label} contains duplicate {field} values")
    return values


def _parse_time(value: str, label: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{label} is not a valid ISO 8601 timestamp: {value}") from exc
    if parsed.tzinfo is None:
        raise ValueError(f"{label} must include a timezone: {value}")
    return parsed


def validate_generated_operation(data_directory: str | Path) -> GeneratedDataReport:
    directory = Path(data_directory)
    errors: list[str] = []
    warnings: list[str] = []
    tables: dict[str, list[dict[str, str]]] = {}

    for filename in GENERATED_FILES:
        path = directory / filename
        if not path.exists():
            errors.append(f"Missing generated dataset: {path}")
            continue
        tables[filename] = _read_csv(directory, filename)

    if errors:
        return GeneratedDataReport(0, {}, tuple(errors), tuple(warnings))

    operations = tables["operations.csv"]
    hubs = tables["hubs.csv"]
    destinations = tables["destinations.csv"]
    vehicles = tables["vehicles.csv"]
    personnel = tables["personnel.csv"]
    deliveries = tables["deliveries.csv"]
    assignments = tables["assignments.csv"]

    try:
        operation_ids = _unique_ids(operations, "operation_id", "operations")
        hub_ids = _unique_ids(hubs, "hub_id", "hubs")
        destination_ids = _unique_ids(destinations, "location_id", "destinations")
        vehicle_ids = _unique_ids(vehicles, "vehicle_id", "vehicles")
        personnel_ids = _unique_ids(personnel, "personnel_id", "personnel")
        delivery_ids = _unique_ids(deliveries, "delivery_id", "deliveries")
        _unique_ids(assignments, "assignment_id", "assignments")
    except ValueError as exc:
        errors.append(str(exc))
        operation_ids = hub_ids = destination_ids = vehicle_ids = personnel_ids = delivery_ids = []

    if len(operation_ids) != 1:
        errors.append("Exactly one operation is required")
    operation_id = operation_ids[0] if operation_ids else ""
    for label, rows in (
        ("hubs", hubs),
        ("destinations", destinations),
        ("vehicles", vehicles),
        ("personnel", personnel),
        ("deliveries", deliveries),
    ):
        if any(row.get("operation_id") != operation_id for row in rows):
            errors.append(f"All {label} must reference the single operation")

    hub_set = set(hub_ids)
    destination_set = set(destination_ids)
    vehicle_set = set(vehicle_ids)
    personnel_set = set(personnel_ids)
    delivery_set = set(delivery_ids)

    if any(row.get("base_hub_id") not in hub_set for row in vehicles):
        errors.append("Every vehicle must reference an existing base hub")
    if any(row.get("origin_hub_id") not in hub_set for row in deliveries):
        errors.append("Every delivery must reference an existing origin hub")
    if any(row.get("destination_id") not in destination_set for row in deliveries):
        errors.append("Every delivery must reference an existing destination")

    assignments_by_delivery: dict[str, list[dict[str, str]]] = defaultdict(list)
    assignments_by_vehicle: dict[str, list[dict[str, str]]] = defaultdict(list)
    assignments_by_personnel: dict[str, list[dict[str, str]]] = defaultdict(list)
    for assignment in assignments:
        delivery_id = assignment.get("delivery_id", "")
        vehicle_id = assignment.get("vehicle_id", "")
        personnel_id = assignment.get("personnel_id", "")
        if delivery_id not in delivery_set:
            errors.append(f"Assignment references unknown delivery: {delivery_id}")
        if vehicle_id not in vehicle_set:
            errors.append(f"Assignment references unknown vehicle: {vehicle_id}")
        if personnel_id not in personnel_set:
            errors.append(f"Assignment references unknown personnel: {personnel_id}")
        assignments_by_delivery[delivery_id].append(assignment)
        assignments_by_vehicle[vehicle_id].append(assignment)
        assignments_by_personnel[personnel_id].append(assignment)

    for delivery_id in delivery_set:
        if len(assignments_by_delivery[delivery_id]) != 1:
            errors.append(f"Delivery must have exactly one assignment: {delivery_id}")

    vehicles_by_id = {row["vehicle_id"]: row for row in vehicles}
    deliveries_by_id = {row["delivery_id"]: row for row in deliveries}
    delivery_times: dict[str, tuple[datetime, datetime]] = {}
    for delivery in deliveries:
        delivery_id = delivery["delivery_id"]
        try:
            dispatch = _parse_time(
                delivery["scheduled_dispatch"],
                f"delivery {delivery_id} scheduled_dispatch",
            )
            deadline = _parse_time(
                delivery["arrival_deadline"],
                f"delivery {delivery_id} arrival_deadline",
            )
            duration = int(delivery["planned_duration_min"])
            demand = int(delivery["demand_units"])
            if duration <= 0:
                errors.append(f"Delivery duration must be positive: {delivery_id}")
            if demand <= 0:
                errors.append(f"Delivery demand must be positive: {delivery_id}")
            arrival = dispatch + timedelta(minutes=duration)
            if deadline < arrival:
                errors.append(f"Deadline is before planned arrival: {delivery_id}")
            delivery_times[delivery_id] = (dispatch, arrival)
        except (KeyError, TypeError, ValueError) as exc:
            errors.append(f"Invalid timing or numeric value for {delivery_id}: {exc}")

    for assignment in assignments:
        delivery = deliveries_by_id.get(assignment.get("delivery_id", ""))
        vehicle = vehicles_by_id.get(assignment.get("vehicle_id", ""))
        if delivery and vehicle:
            try:
                if int(delivery["demand_units"]) > int(vehicle["capacity_units"]):
                    errors.append(
                        f"Delivery exceeds vehicle capacity: {delivery['delivery_id']}"
                    )
            except (KeyError, ValueError) as exc:
                errors.append(f"Invalid capacity value for {vehicle['vehicle_id']}: {exc}")

    for resource_name, grouped_assignments in (
        ("vehicle", assignments_by_vehicle),
        ("personnel", assignments_by_personnel),
    ):
        for resource_id, resource_assignments in grouped_assignments.items():
            scheduled = [
                (delivery_times[a["delivery_id"]], a["delivery_id"])
                for a in resource_assignments
                if a["delivery_id"] in delivery_times
            ]
            scheduled.sort(key=lambda item: item[0][0])
            for previous, current in zip(scheduled, scheduled[1:]):
                previous_times, previous_id = previous
                current_times, current_id = current
                if current_times[0] < previous_times[1]:
                    errors.append(
                        f"{resource_name} schedule overlap: {resource_id} "
                        f"({previous_id}, {current_id})"
                    )

    if not any(row.get("status") == "PLANNED" for row in deliveries):
        warnings.append("No PLANNED deliveries were found")

    return GeneratedDataReport(
        files_checked=len(tables),
        rows_checked={filename: len(rows) for filename, rows in tables.items()},
        errors=tuple(sorted(set(errors))),
        warnings=tuple(warnings),
    )
