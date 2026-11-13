import csv
from dataclasses import dataclass
from pathlib import Path


EXPECTED_COLUMNS = {
    "polling_units_synthetic.csv": {
        "pu_id",
        "zone",
        "state",
        "lga",
        "ward",
        "settlement",
        "registered_voters",
        "accessible_venue",
        "has_grid_power",
        "network_coverage",
        "distance_to_lga_hq_km",
    },
    "logistics_deliveries_synthetic.csv": {
        "pu_id",
        "lga",
        "distance_km",
        "settlement",
        "vehicle",
        "dispatch_hour",
        "transit_hours",
        "materials_complete",
    },
    "incident_reports_synthetic.csv": {
        "incident_id",
        "timestamp",
        "state",
        "lga",
        "pu_id",
        "category",
        "description",
        "severity_0_4",
        "reporter_type",
        "verified",
        "has_photo_evidence",
    },
}


@dataclass(frozen=True)
class ValidationReport:
    files_checked: int
    rows_checked: dict[str, int]
    errors: tuple[str, ...]
    warnings: tuple[str, ...]

    @property
    def valid(self) -> bool:
        return not self.errors


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def validate_starter_data(data_directory: str | Path) -> ValidationReport:
    directory = Path(data_directory)
    errors: list[str] = []
    warnings: list[str] = []
    tables: dict[str, list[dict[str, str]]] = {}

    for filename, expected_columns in EXPECTED_COLUMNS.items():
        path = directory / filename
        if not path.exists():
            errors.append(f"Missing required dataset: {path}")
            continue
        rows = _read_csv(path)
        tables[filename] = rows
        actual_columns = set(rows[0]) if rows else set()
        missing_columns = expected_columns - actual_columns
        if missing_columns:
            errors.append(
                f"{filename} is missing columns: {', '.join(sorted(missing_columns))}"
            )

    polling = tables.get("polling_units_synthetic.csv", [])
    logistics = tables.get("logistics_deliveries_synthetic.csv", [])
    incidents = tables.get("incident_reports_synthetic.csv", [])

    polling_ids = {row.get("pu_id", "") for row in polling}
    if len(polling_ids) != len(polling) or "" in polling_ids:
        errors.append("Polling-unit pu_id values must be present and unique")

    logistics_ids = [row.get("pu_id", "") for row in logistics]
    if len(set(logistics_ids)) != len(logistics_ids) or "" in logistics_ids:
        errors.append("Logistics pu_id values must be present and unique")
    missing_logistics_refs = sorted(set(logistics_ids) - polling_ids)
    if missing_logistics_refs:
        errors.append(
            "Logistics records reference unknown polling units: "
            + ", ".join(missing_logistics_refs[:10])
        )

    incident_ids = [row.get("incident_id", "") for row in incidents]
    if len(set(incident_ids)) != len(incident_ids) or "" in incident_ids:
        errors.append("Incident incident_id values must be present and unique")
    missing_incident_refs = sorted(
        {row.get("pu_id", "") for row in incidents if row.get("pu_id")} - polling_ids
    )
    if missing_incident_refs:
        errors.append(
            "Incident records reference unknown polling units: "
            + ", ".join(missing_incident_refs[:10])
        )

    if not any(row.get("category") == "logistics_delay" for row in incidents):
        warnings.append("No logistics_delay incidents were found")
    warnings.append(
        "Starter data has no vehicle IDs, capacity, coordinates, or causal incident-delay links; the simulator must generate these."
    )

    return ValidationReport(
        files_checked=len(tables),
        rows_checked={filename: len(rows) for filename, rows in tables.items()},
        errors=tuple(errors),
        warnings=tuple(warnings),
    )
