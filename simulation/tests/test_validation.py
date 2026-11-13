from pathlib import Path

from simulation.config import load_config
from simulation.generators.operation import generate_operation
from simulation.validation import validate_generated_operation


SIMULATION_DIR = Path(__file__).parents[1]


def test_generated_operation_passes_quality_gate(tmp_path: Path) -> None:
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    output_directory = tmp_path / "generated"
    generate_operation(config, SIMULATION_DIR, output_directory)

    report = validate_generated_operation(output_directory)

    assert report.valid, report.errors
    assert report.rows_checked["deliveries.csv"] == 75


def test_quality_gate_detects_missing_assignment(tmp_path: Path) -> None:
    config = load_config(SIMULATION_DIR / "configs" / "default.yaml")
    output_directory = tmp_path / "generated"
    generate_operation(config, SIMULATION_DIR, output_directory)
    assignments_path = output_directory / "assignments.csv"
    lines = assignments_path.read_text(encoding="utf-8").splitlines()
    assignments_path.write_text("\n".join(lines[:-1]) + "\n", encoding="utf-8")

    report = validate_generated_operation(output_directory)

    assert not report.valid
    assert any("exactly one assignment" in error for error in report.errors)
