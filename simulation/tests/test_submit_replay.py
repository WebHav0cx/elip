from simulation.submit_replay import build_api_payload


def test_build_api_payload_translates_simulator_ids() -> None:
    event = {
        "event_id": "EVT-000001",
        "simulation_id": "SIM-2026-001",
        "delivery_id": "DEL-001",
        "vehicle_id": "VEH-001",
        "event_type": "LOCATION_UPDATE",
        "occurred_at": "2026-12-03T06:30:00+01:00",
        "source": "SIMULATOR",
        "payload": {"progress_pct": 25},
    }
    id_map = {
        "operations": {"SIM-2026-001": "00000000-0000-0000-0000-000000000001"},
        "deliveries": {"DEL-001": "00000000-0000-0000-0000-000000000002"},
        "vehicles": {"VEH-001": "00000000-0000-0000-0000-000000000003"},
    }

    payload = build_api_payload(event, id_map)

    assert payload["operation_id"] == id_map["operations"]["SIM-2026-001"]
    assert payload["delivery_id"] == id_map["deliveries"]["DEL-001"]
    assert payload["vehicle_id"] == id_map["vehicles"]["VEH-001"]
