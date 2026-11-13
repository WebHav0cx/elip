"""Package trained model artifacts with reproducibility metadata."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from ml.features.feature_definitions import FEATURE_NAMES, FEATURE_SCHEMA_VERSION, TARGET_NAME


MODEL_PURPOSES = {
    "linear_regression": {
        "intended_use": "ETA estimation",
        "role": "eta_model",
    },
    "random_forest": {
        "intended_use": "Delay-risk estimation",
        "role": "risk_model",
    },
}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def package_models(
    artifact_directory: Path,
    candidate_report_path: Path,
    quality_report_path: Path,
    dataset_metadata_path: Path,
    output_path: Path,
    version: str = "0.1.0",
) -> dict:
    candidate_report = json.loads(candidate_report_path.read_text(encoding="utf-8"))
    dataset_metadata = json.loads(dataset_metadata_path.read_text(encoding="utf-8"))
    quality_report = json.loads(quality_report_path.read_text(encoding="utf-8")) if quality_report_path.exists() else {}
    models = {}
    for name, purpose in MODEL_PURPOSES.items():
        artifact = artifact_directory / f"{name}.joblib"
        if not artifact.exists():
            raise FileNotFoundError(f"Missing model artifact: {artifact}")
        models[name] = {
            "name": name,
            "version": version,
            "artifact": artifact.name,
            "sha256": _sha256(artifact),
            "role": purpose["role"],
            "intended_use": purpose["intended_use"],
            "training_split": candidate_report.get("training_split"),
            "training_rows": candidate_report.get("training_rows"),
            "candidate_metrics": candidate_report.get("models", {}).get(name, {}).get("splits", {}),
            "detailed_metrics": quality_report.get("models", {}).get(name, {}),
            "data_type": "SYNTHETIC",
        }
    manifest = {
        "manifest_version": "1.0.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model_version": version,
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "feature_names": list(FEATURE_NAMES),
        "target_name": TARGET_NAME,
        "dataset_metadata": {
            "exercise_count": dataset_metadata.get("exercise_count"),
            "historical_row_count": dataset_metadata.get("historical_row_count"),
            "snapshot_row_count": dataset_metadata.get("snapshot_row_count"),
            "split_policy": dataset_metadata.get("split_policy"),
        },
        "models": models,
        "limitations": [
            "All training and evaluation data is synthetic.",
            "Model outputs support fictional exercises and must not direct real-world electoral logistics.",
        ],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Package versioned Epic 5 model artifacts")
    parser.add_argument("--artifacts", default="ml/artifacts")
    parser.add_argument("--candidate-report", default="ml/reports/candidate_model_evaluation.json")
    parser.add_argument("--quality-report", default="ml/reports/model_quality_evaluation.json")
    parser.add_argument("--dataset-metadata", default="simulation/datasets/ml_batch/metadata.json")
    parser.add_argument("--output", default="ml/artifacts/model_manifest.json")
    parser.add_argument("--version", default="0.1.0")
    args = parser.parse_args()
    manifest = package_models(
        Path(args.artifacts).resolve(),
        Path(args.candidate_report).resolve(),
        Path(args.quality_report).resolve(),
        Path(args.dataset_metadata).resolve(),
        Path(args.output).resolve(),
        args.version,
    )
    print(f"Packaged {len(manifest['models'])} models")
    print(f"Manifest: {Path(args.output).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
