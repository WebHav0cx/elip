"""Consolidate independent simulation exercises into ML-ready datasets."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

from ml.features.feature_definitions import FEATURE_NAMES, TARGET_NAME


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def _write(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise ValueError(f"Cannot write an empty dataset: {path}")
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def build_training_dataset(manifest_path: Path, output_directory: Path) -> dict:
    manifest = _read(manifest_path)
    if not manifest:
        raise ValueError("The exercise manifest is empty")

    historical: list[dict[str, str]] = []
    snapshots: list[dict[str, str]] = []
    source_exercises = []
    for exercise in manifest:
        metadata = {
            "source_exercise_id": exercise["exercise_id"],
            "source_simulation_id": exercise["simulation_id"],
            "source_seed": exercise["seed"],
            "source_scenario": exercise["scenario"],
            "source_split": exercise["split"],
            "source_deadline_policy": exercise.get("deadline_policy", "unknown"),
        }
        source_exercises.append(metadata)
        for row in _read(Path(exercise["ml_directory"]) / "historical_deliveries.csv"):
            historical.append({**metadata, **row})
        for row in _read(Path(exercise["ml_directory"]) / "prediction_snapshots.csv"):
            snapshots.append({**metadata, **row})

    _write(output_directory / "historical_deliveries.csv", historical)
    _write(output_directory / "prediction_snapshots.csv", snapshots)
    metadata = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_manifest": str(manifest_path),
        "exercise_count": len(source_exercises),
        "historical_row_count": len(historical),
        "snapshot_row_count": len(snapshots),
        "feature_names": list(FEATURE_NAMES),
        "target_name": TARGET_NAME,
        "split_policy": "complete simulation exercises remain in one split",
        "exercises": source_exercises,
    }
    output_directory.mkdir(parents=True, exist_ok=True)
    (output_directory / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the consolidated Epic 5 ML dataset")
    parser.add_argument("--manifest", default="simulation/datasets/batch/split_manifest.csv")
    parser.add_argument("--output", default="simulation/datasets/ml_batch")
    args = parser.parse_args()
    metadata = build_training_dataset(Path(args.manifest).resolve(), Path(args.output).resolve())
    print(f"Built {metadata['historical_row_count']} historical rows")
    print(f"Built {metadata['snapshot_row_count']} prediction snapshots")
    print(f"Output: {Path(args.output).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
