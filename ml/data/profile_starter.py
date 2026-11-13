"""Profile the starter logistics dataset without requiring a dataframe library."""

from __future__ import annotations

import argparse
import csv
import math
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from statistics import mean, median


NUMERIC_COLUMNS = ("distance_km", "dispatch_hour", "transit_hours")
CATEGORICAL_COLUMNS = ("settlement", "vehicle", "materials_complete")
REQUIRED_COLUMNS = {
    "pu_id", "lga", "distance_km", "settlement", "vehicle",
    "dispatch_hour", "transit_hours", "materials_complete",
}


@dataclass(frozen=True)
class NumericSummary:
    count: int
    minimum: float
    maximum: float
    mean: float
    median: float


@dataclass(frozen=True)
class StarterProfile:
    source: str
    row_count: int
    columns: tuple[str, ...]
    missing: dict[str, int]
    duplicate_pu_ids: int
    numeric: dict[str, NumericSummary]
    categories: dict[str, dict[str, int]]
    distance_transit_correlation: float | None
    by_vehicle: dict[str, NumericSummary]
    by_settlement: dict[str, NumericSummary]


def _numeric(rows: list[dict[str, str]], column: str) -> list[float]:
    values = []
    for row in rows:
        value = row.get(column, "").strip()
        if value:
            values.append(float(value))
    return values


def _summary(values: list[float]) -> NumericSummary:
    if not values:
        return NumericSummary(0, 0, 0, 0, 0)
    return NumericSummary(
        count=len(values),
        minimum=min(values),
        maximum=max(values),
        mean=mean(values),
        median=median(values),
    )


def _correlation(x: list[float], y: list[float]) -> float | None:
    if len(x) != len(y) or len(x) < 2:
        return None
    x_mean, y_mean = mean(x), mean(y)
    numerator = sum((a - x_mean) * (b - y_mean) for a, b in zip(x, y))
    denominator = math.sqrt(
        sum((a - x_mean) ** 2 for a in x) * sum((b - y_mean) ** 2 for b in y)
    )
    return numerator / denominator if denominator else None


def profile_starter_data(path: str | Path) -> StarterProfile:
    source = Path(path)
    with source.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        columns = tuple(reader.fieldnames or ())
        missing_columns = REQUIRED_COLUMNS - set(columns)
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(sorted(missing_columns))}")
        rows = list(reader)

    missing = {
        column: sum(not row.get(column, "").strip() for row in rows)
        for column in columns
    }
    ids = [row.get("pu_id", "").strip() for row in rows]
    duplicate_pu_ids = len(ids) - len(set(ids))
    numeric = {column: _summary(_numeric(rows, column)) for column in NUMERIC_COLUMNS}
    categories = {
        column: dict(sorted(Counter(row.get(column, "").strip() for row in rows).items()))
        for column in CATEGORICAL_COLUMNS
    }

    paired = [
        (float(row["distance_km"]), float(row["transit_hours"]))
        for row in rows
        if row.get("distance_km", "").strip() and row.get("transit_hours", "").strip()
    ]
    groups: dict[str, list[float]] = defaultdict(list)
    settlement_groups: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        if row.get("transit_hours", "").strip():
            groups[row["vehicle"].strip()].append(float(row["transit_hours"]))
            settlement_groups[row["settlement"].strip()].append(float(row["transit_hours"]))

    return StarterProfile(
        source=str(source),
        row_count=len(rows),
        columns=columns,
        missing=missing,
        duplicate_pu_ids=duplicate_pu_ids,
        numeric=numeric,
        categories=categories,
        distance_transit_correlation=_correlation(
            [pair[0] for pair in paired], [pair[1] for pair in paired]
        ),
        by_vehicle={key: _summary(value) for key, value in sorted(groups.items())},
        by_settlement={key: _summary(value) for key, value in sorted(settlement_groups.items())},
    )


def _fmt(value: float) -> str:
    return f"{value:.2f}"


def render_markdown(profile: StarterProfile) -> str:
    missing_rows = "\n".join(
        f"| `{column}` | {count} |"
        for column, count in profile.missing.items()
    )
    category_rows = "\n".join(
        f"| `{column}` | {', '.join(f'{key}: {value}' for key, value in values.items())} |"
        for column, values in profile.categories.items()
    )
    vehicle_rows = "\n".join(
        f"| `{group}` | {summary.count} | {_fmt(summary.mean)} | {_fmt(summary.median)} | {_fmt(summary.minimum)} | {_fmt(summary.maximum)} |"
        for group, summary in profile.by_vehicle.items()
    )
    settlement_rows = "\n".join(
        f"| `{group}` | {summary.count} | {_fmt(summary.mean)} | {_fmt(summary.median)} |"
        for group, summary in profile.by_settlement.items()
    )
    correlation = "unavailable" if profile.distance_transit_correlation is None else _fmt(profile.distance_transit_correlation)
    return f"""# AI-01 Starter Logistics Data Profile

Source: `{profile.source}`  
Rows: **{profile.row_count}**  
Duplicate `pu_id` records: **{profile.duplicate_pu_ids}**  
Distance/transit Pearson correlation: **{correlation}**

## Data quality

| Column | Missing values |
|---|---:|
{missing_rows}

All required columns are present. The profile should be rerun whenever the source CSV changes.

## Categorical distributions

| Column | Values |
|---|---|
{category_rows}

## Numeric distributions

| Column | Count | Minimum | Maximum | Mean | Median |
|---|---:|---:|---:|---:|---:|
""" + "\n".join(
        f"| `{column}` | {summary.count} | {_fmt(summary.minimum)} | {_fmt(summary.maximum)} | {_fmt(summary.mean)} | {_fmt(summary.median)} |"
        for column, summary in profile.numeric.items()
    ) + f"""

## Transit-time comparisons

| Vehicle | Records | Mean hours | Median hours | Minimum | Maximum |
|---|---:|---:|---:|---:|---:|
{vehicle_rows}

| Settlement | Records | Mean hours | Median hours |
|---|---:|---:|---:|
{settlement_rows}

## Findings and limitations

- `transit_hours` is a suitable initial regression target.
- `distance_km` is an important candidate predictor; correlation is descriptive and does not establish causation.
- Vehicle and settlement comparisons are exploratory because the source generator uses artificial rules and randomness.
- The starter data does not contain vehicle IDs, capacity, coordinates, weather, telemetry history, deadlines, or causal incident links.
- Results from this synthetic dataset must not be presented as evidence of real-world Nigerian logistics performance.

## Reproduction

```powershell
python -m ml.data.profile_starter
```
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Profile the starter logistics dataset")
    parser.add_argument("--input", default="simulation/logistics_deliveries_synthetic.csv")
    parser.add_argument("--output", default="ml/reports/starter_logistics_profile.md")
    args = parser.parse_args()
    profile = profile_starter_data(args.input)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_markdown(profile), encoding="utf-8")
    print(f"Profiled {profile.row_count} rows")
    print(f"Report: {output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
