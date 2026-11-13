"""Validate consolidated ML data and group-level split integrity."""

from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path

from ml.features.schema import parse_snapshot, parse_target


@dataclass(frozen=True)
class DatasetValidationReport:
    historical_rows: int
    snapshot_rows: int
    errors: tuple[str, ...]
    warnings: tuple[str, ...]

    @property
    def valid(self) -> bool:
        return not self.errors


def render_report(report: DatasetValidationReport) -> str:
    status = "PASS" if report.valid else "FAIL"
    warnings = "\n".join(f"- {warning}" for warning in report.warnings) or "- None"
    errors = "\n".join(f"- {error}" for error in report.errors) or "- None"
    return f"""# AI-04 ML Dataset Quality Report

Status: **{status}**

| Dataset | Rows |
|---|---:|
| Historical deliveries | {report.historical_rows} |
| Prediction snapshots | {report.snapshot_rows} |

## Warnings

{warnings}

## Errors

{errors}

The dataset is split by complete simulation exercise. Delivery snapshots from one exercise must not be distributed across train, validation, or test splits.
"""


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def validate_ml_dataset(directory: str | Path) -> DatasetValidationReport:
    root = Path(directory)
    errors: list[str] = []
    warnings: list[str] = []
    historical_path = root / "historical_deliveries.csv"
    snapshot_path = root / "prediction_snapshots.csv"
    metadata_path = root / "metadata.json"
    if not historical_path.exists() or not snapshot_path.exists() or not metadata_path.exists():
        return DatasetValidationReport(0, 0, ("ML dataset requires historical_deliveries.csv, prediction_snapshots.csv, and metadata.json",), ())

    historical = _read(historical_path)
    snapshots = _read(snapshot_path)
    try:
        import json

        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        exercises = {item["source_simulation_id"]: item for item in metadata["exercises"]}
    except (ValueError, KeyError, TypeError) as exc:
        return DatasetValidationReport(len(historical), len(snapshots), (f"Invalid metadata: {exc}",), ())

    split_by_simulation = {simulation_id: item["source_split"] for simulation_id, item in exercises.items()}
    seen_snapshots: set[tuple[str, str, str]] = set()
    labels_by_split: dict[str, set[bool]] = {}
    for row in snapshots:
        simulation_id = row.get("source_simulation_id", "")
        if simulation_id not in split_by_simulation:
            errors.append(f"Snapshot references unknown simulation: {simulation_id}")
        try:
            parse_snapshot(row)
            parse_target(row)
        except ValueError as exc:
            errors.append(f"Invalid snapshot {row.get('delivery_id', '<unknown>')}: {exc}")
        key = (
            row.get("source_simulation_id", ""),
            row.get("delivery_id", ""),
            row.get("snapshot_time", ""),
        )
        if key in seen_snapshots:
            errors.append(f"Duplicate prediction snapshot: {key[1]} at {key[2]} in {key[0]}")
        seen_snapshots.add(key)
        split = row.get("source_split", "")
        labels_by_split.setdefault(split, set()).add(row.get("is_delayed", "").lower() == "true")

    delivery_splits: dict[tuple[str, str], set[str]] = {}
    for row in snapshots:
        delivery_key = (row.get("source_simulation_id", ""), row.get("delivery_id", ""))
        delivery_splits.setdefault(delivery_key, set()).add(row.get("source_split", ""))
    leaked_deliveries = [delivery for delivery, splits in delivery_splits.items() if len(splits) > 1]
    if leaked_deliveries:
        errors.append("Deliveries appear in multiple splits: " + ", ".join(f"{simulation}/{delivery}" for simulation, delivery in leaked_deliveries[:10]))

    for split, labels in labels_by_split.items():
        if len(labels) < 2:
            warnings.append(f"Split '{split}' does not contain both on-time and late labels")

    return DatasetValidationReport(len(historical), len(snapshots), tuple(errors), tuple(warnings))


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the consolidated Epic 5 ML dataset")
    parser.add_argument("--data", default="simulation/datasets/ml_batch")
    parser.add_argument("--report", default="ml/reports/ml_dataset_quality.md")
    args = parser.parse_args()
    report = validate_ml_dataset(args.data)
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(render_report(report), encoding="utf-8")
    print(f"Historical rows: {report.historical_rows}")
    print(f"Snapshot rows: {report.snapshot_rows}")
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    if report.errors:
        for error in report.errors:
            print(f"ERROR: {error}")
        return 1
    print("ML dataset validation: PASS")
    print(f"Report: {report_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
