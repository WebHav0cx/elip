import argparse
from dataclasses import replace
from pathlib import Path

from simulation.config import load_config
from simulation.generators.operation import generate_operation


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a fictional operation")
    parser.add_argument(
        "--config", default="simulation/configs/default.yaml"
    )
    parser.add_argument("--source-data", default=None)
    parser.add_argument("--output", default=None)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--scenario", default=None)
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    config = load_config(config_path)
    if args.seed is not None:
        config = replace(config, seed=args.seed)
    if args.scenario is not None:
        config = replace(config, default_scenario=args.scenario)
    simulation_directory = config_path.parents[1]
    source_directory = (
        Path(args.source_data).resolve()
        if args.source_data
        else simulation_directory / config.source_data_directory
    )
    output_directory = (
        Path(args.output).resolve()
        if args.output
        else simulation_directory / config.output_directory
    )

    generated = generate_operation(config, source_directory, output_directory)
    print(f"Generated operation {generated['operations'][0]['operation_id']}")
    print(f"Output directory: {output_directory}")
    for name, rows in generated.items():
        print(f"  {name}.csv: {len(rows)} rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
