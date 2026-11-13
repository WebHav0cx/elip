from pathlib import Path

from simulation.config import load_config
from simulation.generators.operation import generate_operation
from simulation.ml_data import generate_ml_datasets


SIMULATION_DIR = Path(__file__).parents[1]


def test_ml_datasets_have_expected_shapes(tmp_path: Path) -> None:
    config_path = SIMULATION_DIR / "configs" / "default.yaml"
    config = load_config(config_path)
    generated_directory = tmp_path / "generated"
    ml_directory = tmp_path / "ml"
    generate_operation(config, SIMULATION_DIR, generated_directory)

    datasets = generate_ml_datasets(config_path, generated_directory, ml_directory)

    assert len(datasets["historical_deliveries"]) == 75
    assert len(datasets["prediction_snapshots"]) == 300
    assert datasets["split_manifest"][0]["split"] == "development_only"


def test_ml_snapshots_have_targets_and_features(tmp_path: Path) -> None:
    config_path = SIMULATION_DIR / "configs" / "default.yaml"
    config = load_config(config_path)
    generated_directory = tmp_path / "generated"
    generate_operation(config, SIMULATION_DIR, generated_directory)

    datasets = generate_ml_datasets(config_path, generated_directory, tmp_path / "ml")
    snapshot = datasets["prediction_snapshots"][0]

    assert snapshot["journey_progress_pct"] == "0"
    assert snapshot["weather_condition"] == "CLEAR"
    assert "actual_arrival_time" in snapshot
    assert "actual_remaining_minutes" in snapshot
