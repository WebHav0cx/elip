"""Train and evaluate candidate ETA regression models."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.features.feature_builder import build_features
from ml.features.schema import parse_snapshot


NUMERIC_FEATURES = (
    "remaining_distance_km", "elapsed_minutes", "journey_progress_pct",
    "planned_duration_min", "dispatch_hour", "last_update_age_min",
)
CATEGORICAL_FEATURES = (
    "vehicle_type", "settlement_type", "weather_condition", "disruption_reported",
)
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


def _feature_row(row: dict[str, str]) -> dict[str, object]:
    return build_features(parse_snapshot(row)).as_dict()


def _feature_frame(rows: list[dict[str, str]]) -> pd.DataFrame:
    return pd.DataFrame([_feature_row(row) for row in rows], columns=list(ALL_FEATURES))


def _pipeline(model: object) -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", "passthrough", list(NUMERIC_FEATURES)),
            ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), list(CATEGORICAL_FEATURES)),
        ]
    )
    return Pipeline([("preprocessor", preprocessor), ("model", model)])


def _metrics(actual: list[float], predicted: list[float]) -> dict[str, float | int]:
    return {
        "count": len(actual),
        "mae_minutes": mean_absolute_error(actual, predicted),
        "rmse_minutes": mean_squared_error(actual, predicted) ** 0.5,
        "median_absolute_error_minutes": median_absolute_error(actual, predicted),
    }


def train_candidates(data_directory: Path, artifact_directory: Path, report_path: Path) -> dict:
    rows = _read(data_directory / "prediction_snapshots.csv")
    train_rows = [row for row in rows if row["source_split"] == "development"]
    if not train_rows:
        raise ValueError("No development rows available for model training")
    x_train = _feature_frame(train_rows)
    y_train = [float(row["actual_remaining_minutes"]) for row in train_rows]

    candidates = {
        "linear_regression": _pipeline(LinearRegression()),
        "random_forest": _pipeline(RandomForestRegressor(
            n_estimators=200,
            random_state=42,
            min_samples_leaf=2,
            n_jobs=-1,
        )),
    }
    artifact_directory.mkdir(parents=True, exist_ok=True)
    report = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "training_split": "development",
        "training_rows": len(train_rows),
        "feature_names": list(ALL_FEATURES),
        "target_name": "remaining_time_min",
        "models": {},
    }
    for name, pipeline in candidates.items():
        pipeline.fit(x_train, y_train)
        artifact_path = artifact_directory / f"{name}.joblib"
        joblib.dump(pipeline, artifact_path)
        model_report = {"artifact": str(artifact_path), "splits": {}}
        for split in sorted({row["source_split"] for row in rows}):
            split_rows = [row for row in rows if row["source_split"] == split]
            actual = [float(row["actual_remaining_minutes"]) for row in split_rows]
            predicted = pipeline.predict(_feature_frame(split_rows)).tolist()
            model_report["splits"][split] = _metrics(actual, predicted)
        report["models"][name] = model_report

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Train candidate ETA regression models")
    parser.add_argument("--data", default="simulation/datasets/ml_batch")
    parser.add_argument("--artifacts", default="ml/artifacts")
    parser.add_argument("--report", default="ml/reports/candidate_model_evaluation.json")
    args = parser.parse_args()
    report = train_candidates(Path(args.data).resolve(), Path(args.artifacts).resolve(), Path(args.report).resolve())
    for name, model in report["models"].items():
        test = model["splits"].get("test", {})
        print(f"{name}: test MAE={test.get('mae_minutes', 0):.2f} min")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
