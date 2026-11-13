import argparse
from pathlib import Path

from simulation.config import load_config
from simulation.engine.replay import generate_events


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a movement event timeline")
    parser.add_argument("--config", default="simulation/configs/default.yaml")
    parser.add_argument(
        "--data", default="simulation/datasets/generated", help="Generated operation directory"
    )
    parser.add_argument(
        "--output", default="simulation/datasets/generated/events.csv"
    )
    parser.add_argument("--scenario", default=None)
    args = parser.parse_args()

    config = load_config(Path(args.config).resolve())
    events = generate_events(
        config,
        Path(args.data).resolve(),
        Path(args.output).resolve(),
        args.scenario,
    )
    print(f"Generated {len(events)} replay events")
    print(f"Output file: {Path(args.output).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
