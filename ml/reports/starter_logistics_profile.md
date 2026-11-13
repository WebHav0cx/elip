# AI-01 Starter Logistics Data Profile

Source: `simulation\logistics_deliveries_synthetic.csv`  
Rows: **300**  
Duplicate `pu_id` records: **0**  
Distance/transit Pearson correlation: **0.80**

## Data quality

| Column | Missing values |
|---|---:|
| `pu_id` | 0 |
| `lga` | 0 |
| `distance_km` | 0 |
| `settlement` | 0 |
| `vehicle` | 0 |
| `dispatch_hour` | 0 |
| `transit_hours` | 0 |
| `materials_complete` | 0 |

All required columns are present. The profile should be rerun whenever the source CSV changes.

## Categorical distributions

| Column | Values |
|---|---|
| `settlement` | rural: 153, urban: 147 |
| `vehicle` | boat: 72, bus: 83, motorcycle: 75, truck: 70 |
| `materials_complete` | False: 27, True: 273 |

## Numeric distributions

| Column | Count | Minimum | Maximum | Mean | Median |
|---|---:|---:|---:|---:|---:|
| `distance_km` | 300 | 1.10 | 89.90 | 29.67 | 20.40 |
| `dispatch_hour` | 300 | 4.00 | 9.00 | 6.48 | 7.00 |
| `transit_hours` | 300 | 0.07 | 8.38 | 2.65 | 2.46 |

## Transit-time comparisons

| Vehicle | Records | Mean hours | Median hours | Minimum | Maximum |
|---|---:|---:|---:|---:|---:|
| `boat` | 72 | 2.60 | 2.47 | 0.11 | 8.03 |
| `bus` | 83 | 2.42 | 1.83 | 0.07 | 6.70 |
| `motorcycle` | 75 | 2.74 | 2.87 | 0.12 | 6.44 |
| `truck` | 70 | 2.87 | 2.55 | 0.18 | 8.38 |

| Settlement | Records | Mean hours | Median hours |
|---|---:|---:|---:|
| `rural` | 153 | 4.06 | 3.92 |
| `urban` | 147 | 1.19 | 1.01 |

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
