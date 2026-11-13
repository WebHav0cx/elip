import argparse
import csv
import json
from pathlib import Path
from typing import Any

from simulation.adapters.api_client import SimulationAPIClient


def _read_events(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        events = []
        for row in csv.DictReader(csv_file):
            events.append(
                {
                    **row,
                    "payload": json.loads(row["payload"]),
                }
            )
        return events


def build_api_payload(
    event: dict[str, Any], id_map: dict[str, dict[str, str]]
) -> dict[str, Any]:
    operation_id = id_map["operations"][event["simulation_id"]]
    payload: dict[str, Any] = {
        "event_id": event["event_id"],
        "operation_id": operation_id,
        "event_type": event["event_type"],
        "occurred_at": event["occurred_at"],
        "source": event["source"],
        "payload": event["payload"],
    }
    if event.get("delivery_id"):
        payload["delivery_id"] = id_map["deliveries"][event["delivery_id"]]
    if event.get("vehicle_id"):
        payload["vehicle_id"] = id_map["vehicles"][event["vehicle_id"]]
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Submit replay events to the backend")
    parser.add_argument("--events", default="simulation/datasets/generated/events.csv")
    parser.add_argument("--id-map", required=True, help="JSON mapping from simulator IDs to database UUIDs")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--email", default=None)
    parser.add_argument("--password", default=None)
    args = parser.parse_args()

    events = _read_events(Path(args.events).resolve())
    id_map = json.loads(Path(args.id_map).read_text(encoding="utf-8"))
    payloads = [build_api_payload(event, id_map) for event in events[: args.limit]]
    client = SimulationAPIClient(args.base_url)
    try:
        client.authenticate(args.email, args.password)
        responses = client.submit_events(payloads)
    finally:
        client.close()
    print(f"Submitted {len(responses)} events to {args.base_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
