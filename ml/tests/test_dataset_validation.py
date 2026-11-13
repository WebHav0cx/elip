import csv
import json
from pathlib import Path

from ml.data.build_training_dataset import build_training_dataset
from ml.data.validate_ml_dataset import validate_ml_dataset


ROOT = Path(__file__).parents[2]
MANIFEST = ROOT / "simulation" / "datasets" / "batch" / "split_manifest.csv"


def test_consolidated_dataset_has_provenance_and_valid_splits(tmp_path: Path) -> None:
    metadata = build_training_dataset(MANIFEST, tmp_path)
    report = validate_ml_dataset(tmp_path)

    assert report.valid, report.errors
    assert metadata["exercise_count"] == 6
    assert report.historical_rows == 450
    assert report.snapshot_rows == 1800
    saved_metadata = json.loads((tmp_path / "metadata.json").read_text(encoding="utf-8"))
    assert saved_metadata["split_policy"] == "complete simulation exercises remain in one split"


def test_validator_detects_duplicate_snapshots(tmp_path: Path) -> None:
    build_training_dataset(MANIFEST, tmp_path)
    snapshot_path = tmp_path / "prediction_snapshots.csv"
    with snapshot_path.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
        fieldnames = rows[0].keys()
    rows.append(rows[0])
    with snapshot_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    report = validate_ml_dataset(tmp_path)
    assert not report.valid
    assert any("Duplicate prediction snapshot" in error for error in report.errors)
