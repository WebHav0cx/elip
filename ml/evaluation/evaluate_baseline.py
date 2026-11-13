from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from pathlib import Path
from statistics import mean, median

from ml.features.schema import parse_snapshot
from ml.models.baseline import contextual_speed, fit_contextual_speeds, predict_eta


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def _metrics(errors: list[float]) -> dict[str, float | int]:
    if not errors:
        return {"count": 0, "mae_minutes": 0, "rmse_minutes": 0, "median_absolute_error_minutes": 0}
    return {
        "count": len(errors),
        "mae_minutes": mean(errors),
        "rmse_minutes": math.sqrt(mean(error * error for error in errors)),
        "median_absolute_error_minutes": median(errors),
    }


def _risk_metrics(predicted_late: list[bool], actual_late: list[bool]) -> dict[str, float | int | bool]:
    positive_count = sum(actual_late)
    if not actual_late:
        return {"count": 0, "positive_count": 0, "has_both_classes": False}
    true_positive = sum(pred and actual for pred, actual in zip(predicted_late, actual_late))
    false_positive = sum(pred and not actual for pred, actual in zip(predicted_late, actual_late))
    false_negative = sum(not pred and actual for pred, actual in zip(predicted_late, actual_late))
    return {
        "count": len(actual_late),
        "positive_count": positive_count,
        "has_both_classes": 0 < positive_count < len(actual_late),
        "precision": true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0,
        "recall": true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0,
        "false_negative_rate": false_negative / positive_count if positive_count else 0.0,
    }


def evaluate_baseline(manifest_path: Path, output_path: Path, fixed_speed_kmh: float = 30.0) -> dict:
    manifest = _read(manifest_path)
    all_rows: list[tuple[dict[str, str], str, str]] = []
    for exercise in manifest:
        for row in _read(Path(exercise["ml_directory"]) / "prediction_snapshots.csv"):
            all_rows.append((row, exercise["split"], exercise["simulation_id"]))

    development = [parse_snapshot(row) for row, split, _ in all_rows if split == "development"]
    contextual_speeds = fit_contextual_speeds(development)
    grouped: dict[str, dict[str, object]] = defaultdict(lambda: {"naive_errors": [], "contextual_errors": [], "delivery_predictions": {}})
    for row, split, _ in all_rows:
        snapshot = parse_snapshot(row)
        actual = snapshot.actual_remaining_minutes
        if actual is None:
            continue
        naive = predict_eta(snapshot, fixed_speed_kmh)
        contextual = predict_eta(snapshot, contextual_speed(snapshot, contextual_speeds, fixed_speed_kmh))
        group = grouped[split]
        group["naive_errors"].append(abs(naive.predicted_remaining_minutes - actual))
        group["contextual_errors"].append(abs(contextual.predicted_remaining_minutes - actual))
        predictions = group["delivery_predictions"]
        if snapshot.delivery_id not in predictions:
            predictions[snapshot.delivery_id] = (
                naive.predicted_lateness_minutes > 0,
                contextual.predicted_lateness_minutes > 0,
                bool(snapshot.is_delayed),
            )

    result = {
        "model": "ETA baseline",
        "fixed_speed_kmh": fixed_speed_kmh,
        "contextual_speed_groups": {f"{key[0]}|{key[1]}": value for key, value in contextual_speeds.items()},
        "splits": {},
    }
    for split, values in grouped.items():
        predictions = list(values["delivery_predictions"].values())
        naive_late = [item[0] for item in predictions]
        contextual_late = [item[1] for item in predictions]
        actual_late = [item[2] for item in predictions]
        result["splits"][split] = {
            "naive": _metrics(values["naive_errors"]),
            "contextual": _metrics(values["contextual_errors"]),
            "delivery_level_risk": {
                "naive": _risk_metrics(naive_late, actual_late),
                "contextual": _risk_metrics(contextual_late, actual_late),
            },
        }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate baseline ETA predictions")
    parser.add_argument("--manifest", default="simulation/datasets/batch/split_manifest.csv")
    parser.add_argument("--output", default="ml/reports/baseline_evaluation.json")
    parser.add_argument("--speed-kmh", type=float, default=30.0)
    args = parser.parse_args()
    result = evaluate_baseline(Path(args.manifest).resolve(), Path(args.output).resolve(), args.speed_kmh)
    for split, metrics in result["splits"].items():
        print(f"{split}: naive MAE={metrics['naive']['mae_minutes']:.2f} min, contextual MAE={metrics['contextual']['mae_minutes']:.2f} min")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
