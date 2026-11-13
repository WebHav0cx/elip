"""Generate independent simulation exercises for leakage-safe evaluation."""

import argparse
import csv
from dataclasses import dataclass, replace
from pathlib import Path

from simulation.config import load_config
from simulation.generators.operation import generate_operation
from simulation.ml_data import generate_ml_datasets


@dataclass(frozen=True)
class Exercise:
    exercise_id: str
    seed: int
    scenario: str
    split: str
    deadline_policy: str = "generated"


DEFAULT_EXERCISES = (
    Exercise("exercise-001", 2026, "normal", "development", "standard"),
    Exercise("exercise-002", 2027, "normal", "development", "standard"),
    Exercise("exercise-003", 2028, "normal", "validation", "tight"),
    Exercise("exercise-004", 2029, "road_disruption", "test", "tight"),
    Exercise("exercise-005", 2030, "heavy_rain", "held_out_disruption", "tight"),
    Exercise("exercise-006", 2031, "road_disruption", "held_out_disruption", "tight"),
)


def generate_batch(config_path: Path, output_root: Path) -> list[dict[str, str]]:
    base_config = load_config(config_path)
    source_directory = config_path.parents[1] / base_config.source_data_directory
    manifest: list[dict[str, str]] = []
    for exercise in DEFAULT_EXERCISES:
        generated_directory = output_root / exercise.exercise_id / "generated"
        ml_directory = output_root / exercise.exercise_id / "ml"
        config = replace(
            base_config,
            seed=exercise.seed,
            default_scenario=exercise.scenario,
            deadline_policy=exercise.deadline_policy,
            deadline_buffer_minutes={"standard": 30, "tight": 15}[exercise.deadline_policy],
        )
        generated = generate_operation(config, source_directory, generated_directory)
        operation_id = generated["operations"][0]["operation_id"]
        generate_ml_datasets(
            config_path,
            generated_directory,
            ml_directory,
            scenario=exercise.scenario,
            seed=exercise.seed,
        )
        manifest.append({
            "exercise_id": exercise.exercise_id,
            "simulation_id": operation_id,
            "seed": str(exercise.seed),
            "scenario": exercise.scenario,
            "split": exercise.split,
            "deadline_policy": exercise.deadline_policy,
            "generated_directory": str(generated_directory),
            "ml_directory": str(ml_directory),
        })

    output_root.mkdir(parents=True, exist_ok=True)
    with (output_root / "split_manifest.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(manifest[0]))
        writer.writeheader()
        writer.writerows(manifest)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate independent ML exercises")
    parser.add_argument("--config", default="simulation/configs/default.yaml")
    parser.add_argument("--output", default="simulation/datasets/batch")
    args = parser.parse_args()
    manifest = generate_batch(Path(args.config).resolve(), Path(args.output).resolve())
    print(f"Generated {len(manifest)} independent exercises")
    print(f"Manifest: {(Path(args.output).resolve() / 'split_manifest.csv')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
