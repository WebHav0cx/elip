"""Detailed evaluation for trained ETA models."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import timedelta
from pathlib import Path
from statistics import mean

import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error

from ml.features.feature_builder import build_features
from ml.features.feature_definitions import FEATURE_NAMES, LEAKAGE_FIELDS
from ml.features.schema import parse_snapshot
from ml.models.train_candidates import ALL_FEATURES


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def _frame(rows: list[dict[str, str]]) -> pd.DataFrame:
    return pd.DataFrame(
        [build_features(parse_snapshot(row)).as_dict() for row in rows],
        columns=list(ALL_FEATURES),
    )


def _regression_metrics(actual: list[float], predicted: list[float]) -> dict[str, float | int]:
    return {
        "count": len(actual),
        "mae_minutes": mean_absolute_error(actual, predicted),
        "rmse_minutes": mean_squared_error(actual, predicted) ** 0.5,
        "median_absolute_error_minutes": median_absolute_error(actual, predicted),
    }


def _risk_metrics(predicted: list[bool], actual: list[bool]) -> dict[str, float | int | bool]:
    positives = sum(actual)
    true_positive = sum(pred and truth for pred, truth in zip(predicted, actual))
    false_positive = sum(pred and not truth for pred, truth in zip(predicted, actual))
    false_negative = sum(not pred and truth for pred, truth in zip(predicted, actual))
    return {
        "delivery_count": len(actual),
        "late_delivery_count": positives,
        "has_both_classes": 0 < positives < len(actual),
        "precision": true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0,
        "recall": true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0,
        "false_negative_rate": false_negative / positives if positives else 0.0,
    }


def _group_metrics(rows: list[dict[str, str]], predictions: list[float], key: str) -> dict[str, dict]:
    groups: dict[str, tuple[list[float], list[float]]] = {}
    for row, prediction in zip(rows, predictions):
        group = row[key]
        actual, predicted = groups.setdefault(group, ([], []))
        actual.append(float(row["actual_remaining_minutes"]))
        predicted.append(prediction)
    return {group: _regression_metrics(actual, predicted) for group, (actual, predicted) in sorted(groups.items())}


def evaluate_models(data_directory: Path, artifact_directory: Path, report_path: Path) -> dict:
    rows = _read(data_directory / "prediction_snapshots.csv")
    feature_leakage = sorted(set(ALL_FEATURES) & LEAKAGE_FIELDS)
    contract_missing = sorted(set(ALL_FEATURES) - set(FEATURE_NAMES))
    leakage_checks = {
        "feature_names": list(ALL_FEATURES),
        "leakage_fields_detected": feature_leakage,
        "contract_features_missing": contract_missing,
        "passed": not feature_leakage and not contract_missing,
    }

    report = {
        "models": {},
        "leakage_checks": leakage_checks,
        "evaluation_rows": len(rows),
    }
    for artifact in sorted(artifact_directory.glob("*.joblib")):
        name = artifact.stem
        model = joblib.load(artifact)
        predictions = model.predict(_frame(rows)).tolist()
        model_report = {"artifact": str(artifact), "splits": {}, "scenarios": {}, "progress_stages": {}}
        for split in sorted({row["source_split"] for row in rows}):
            indices = [index for index, row in enumerate(rows) if row["source_split"] == split]
            split_rows = [rows[index] for index in indices]
            split_predictions = [predictions[index] for index in indices]
            model_report["splits"][split] = _regression_metrics(
                [float(row["actual_remaining_minutes"]) for row in split_rows], split_predictions
            )
        for scenario in sorted({row["source_scenario"] for row in rows}):
            indices = [index for index, row in enumerate(rows) if row["source_scenario"] == scenario]
            model_report["scenarios"][scenario] = _regression_metrics(
                [float(rows[index]["actual_remaining_minutes"]) for index in indices],
                [predictions[index] for index in indices],
            )
        for progress in sorted({row["journey_progress_pct"] for row in rows}, key=float):
            indices = [index for index, row in enumerate(rows) if row["journey_progress_pct"] == progress]
            model_report["progress_stages"][progress] = _regression_metrics(
                [float(rows[index]["actual_remaining_minutes"]) for index in indices],
                [predictions[index] for index in indices],
            )

        delivery_predictions: dict[tuple[str, str], tuple[bool, bool]] = {}
        for row, prediction in zip(rows, predictions):
            key = (row["source_simulation_id"], row["delivery_id"])
            if key in delivery_predictions:
                continue
            snapshot = parse_snapshot(row)
            eta = snapshot.snapshot_time + timedelta(minutes=prediction)
            predicted_late = bool(snapshot.scheduled_arrival_time and eta > snapshot.scheduled_arrival_time)
            delivery_predictions[key] = (predicted_late, bool(snapshot.is_delayed))
        model_report["delay_risk"] = _risk_metrics(
            [value[0] for value in delivery_predictions.values()],
            [value[1] for value in delivery_predictions.values()],
        )
        report["models"][name] = model_report

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate trained ETA models in detail")
    parser.add_argument("--data", default="simulation/datasets/ml_batch")
    parser.add_argument("--artifacts", default="ml/artifacts")
    parser.add_argument("--report", default="ml/reports/model_quality_evaluation.json")
    args = parser.parse_args()
    report = evaluate_models(Path(args.data).resolve(), Path(args.artifacts).resolve(), Path(args.report).resolve())
    print(f"Leakage checks: {'PASS' if report['leakage_checks']['passed'] else 'FAIL'}")
    for name, model in report["models"].items():
        print(f"{name}: disruption MAE={model['scenarios'].get('heavy_rain', {}).get('mae_minutes', 0):.2f} min")
    return 0 if report["leakage_checks"]["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
