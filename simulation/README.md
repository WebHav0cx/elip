# Simulation foundation

This package covers the first two Epic 2 phases: validating the synthetic starter data and loading a reproducible simulation configuration.

## Validate starter data

From the repository root, after installing the simulation package:

```bash
pip install -e "./simulation[dev]"
python -m simulation.validate_data ./simulation
```

The validator checks the required columns, unique identifiers, and references between polling units, logistics records, and incidents. It does not modify the source CSVs.

## Load configuration

The default configuration is at `simulation/configs/default.yaml`. It controls the seed, operation scale, vehicle mix, timing, telemetry, scenarios, and output location.

The configuration loader rejects invalid settings such as mismatched vehicle totals, invalid probabilities, missing timezones, or an unknown default scenario.

The current configuration is a development baseline. All generated locations, routes, capacities, and operational records must remain fictional.

## Generate a fictional operation

From the repository root:

```bash
python -m simulation.generate
```

Generated CSV files are written to `simulation/datasets/generated/`:

```text
operations.csv
hubs.csv
destinations.csv
vehicles.csv
personnel.csv
deliveries.csv
assignments.csv
```

The generator uses seed `2026`, samples destinations from the validated polling-unit data, and schedules sequential trips per vehicle so the initial assignments do not overlap.

## Validate generated operation data

Run the Phase 4 quality gate after generation:

```bash
python -m simulation.validate_generated
```

It checks IDs, operation and resource references, assignment completeness, vehicle capacity, ISO 8601 timestamps, deadlines, and vehicle/personnel schedule overlaps.

## Generate and replay movement events

After generating and validating an operation:

```bash
python -m simulation.replay
```

This writes `events.csv` alongside the generated operation data. The initial replay includes dispatch, interpolated fictional location updates, arrival, receipt confirmation, and deterministic missing-telemetry events.

To replay a disruption scenario:

```bash
python -m simulation.replay --scenario heavy_rain
python -m simulation.replay --scenario road_disruption
python -m simulation.replay --scenario vehicle_unavailable
```

Disruption markers and delay reports are included in the event stream. Scenario effects are fictional, deterministic, and documented as simulation assumptions; they are not real-world travel or electoral-material models.

## Generate ML-ready datasets

After generating an operation and its replay events:

```bash
python -m simulation.ml_data
```

This writes to `simulation/datasets/ml/`:

```text
historical_deliveries.csv
prediction_snapshots.csv
split_manifest.csv
```

Snapshots include only information available at the snapshot time as features. Arrival and delay outcomes are retained as targets. A single simulation is marked `development_only`; independent simulation seeds are required before a train/test evaluation split is claimed.

## Submit replay events to the backend

The simulator uses human-readable IDs while PostgreSQL uses UUIDs. Provide a mapping JSON with this shape:

```json
{
  "operations": {"SIM-2026-001": "database-uuid"},
  "deliveries": {"DEL-001": "database-uuid"},
  "vehicles": {"VEH-001": "database-uuid"}
}
```

Then submit the replay:

```bash
python -m simulation.submit_replay --id-map path/to/id-map.json
```

Use `--limit 5` to verify a small batch first. Duplicate event IDs are safe to resubmit because the backend treats them idempotently.

To seed generated records and create the UUID mapping automatically:

```bash
python -m simulation.seed_backend
python -m simulation.submit_replay --limit 5 --id-map simulation/datasets/generated/id-map.json
python -m simulation.submit_replay --id-map simulation/datasets/generated/id-map.json
```
