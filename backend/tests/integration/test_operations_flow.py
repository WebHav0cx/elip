from datetime import datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.db.session import SessionLocal
from app.features.auth.models import User
from app.features.auth.security import hash_password


client = TestClient(app)


def _authenticate() -> None:
    db = SessionLocal()
    user = db.scalar(select(User).where(User.email == "integration-admin@example.com"))
    if user is None:
        user = User(
            email="integration-admin@example.com",
            password_hash=hash_password("integration-password"),
            role="ADMIN",
        )
        db.add(user)
    else:
        user.password_hash = hash_password("integration-password")
        user.role = "ADMIN"
    db.commit()
    db.close()
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "integration-admin@example.com", "password": "integration-password"},
    )
    assert response.status_code == 200, response.text
    client.headers.update({"Authorization": f"Bearer {response.json()['data']['access_token']}"})


def _data(response):
    assert response.status_code < 300, response.text
    return response.json()["data"]


def test_operation_assignment_and_event_lifecycle() -> None:
    _authenticate()
    suffix = uuid4().hex[:8]
    start_time = datetime.now().astimezone().replace(microsecond=0) + timedelta(hours=1)

    operation = _data(
        client.post(
            "/api/v1/operations",
            json={
                "name": f"Integration Exercise {suffix}",
                "seed": 2026,
                "start_time": start_time.isoformat(),
                "duration_hours": 12,
            },
        )
    )
    operation_id = operation["id"]

    hub = _data(
        client.post(
            f"/api/v1/operations/{operation_id}/locations",
            json={
                "operation_id": operation_id,
                "location_code": f"HUB-{suffix}",
                "location_type": "HUB",
                "name": "Integration Hub",
                "latitude": 9.1,
                "longitude": 7.4,
            },
        )
    )
    destination = _data(
        client.post(
            f"/api/v1/operations/{operation_id}/locations",
            json={
                "operation_id": operation_id,
                "location_code": f"LOC-{suffix}",
                "location_type": "DESTINATION",
                "name": "Integration Destination",
                "latitude": 9.2,
                "longitude": 7.5,
                "distance_to_hub_km": 20,
            },
        )
    )
    vehicle = _data(
        client.post(
            f"/api/v1/operations/{operation_id}/vehicles",
            json={
                "operation_id": operation_id,
                "vehicle_code": f"VEH-{suffix}",
                "vehicle_type": "truck",
                "capacity_units": 100,
                "base_hub_id": hub["id"],
                "supported_transport_mode": "road",
            },
        )
    )
    personnel = _data(
        client.post(
            f"/api/v1/operations/{operation_id}/personnel",
            json={
                "operation_id": operation_id,
                "personnel_code": f"PER-{suffix}",
                "role": "DRIVER",
                "availability_start": start_time.isoformat(),
                "availability_end": (start_time + timedelta(hours=12)).isoformat(),
            },
        )
    )
    dispatch = start_time + timedelta(minutes=5)
    delivery = _data(
        client.post(
            f"/api/v1/operations/{operation_id}/deliveries",
            json={
                "operation_id": operation_id,
                "delivery_code": f"DEL-{suffix}",
                "origin_hub_id": hub["id"],
                "destination_id": destination["id"],
                "demand_units": 12,
                "planned_duration_min": 60,
                "scheduled_dispatch": dispatch.isoformat(),
                "arrival_deadline": (dispatch + timedelta(hours=2)).isoformat(),
            },
        )
    )

    assignment = _data(
        client.post(
            f"/api/v1/deliveries/{delivery['id']}/assignments",
            json={
                "delivery_id": delivery["id"],
                "vehicle_id": vehicle["id"],
                "personnel_id": personnel["id"],
                "assigned_at": dispatch.isoformat(),
            },
        )
    )
    assert assignment["delivery_id"] == delivery["id"]

    events = [
        (
            "DELIVERY_DISPATCHED",
            dispatch,
            {"progress_pct": 0},
        ),
        (
            "LOCATION_UPDATE",
            dispatch + timedelta(minutes=30),
            {"latitude": 9.15, "longitude": 7.45, "progress_pct": 50},
        ),
        (
            "ARRIVAL_RECORDED",
            dispatch + timedelta(minutes=60),
            {"progress_pct": 100},
        ),
        (
            "RECEIPT_CONFIRMED",
            dispatch + timedelta(minutes=65),
            {"confirmed": True},
        ),
    ]
    for event_type, occurred_at, payload in events:
        response = client.post(
            "/api/v1/telemetry/events",
            json={
                "event_id": f"EVT-{suffix}-{event_type}",
                "operation_id": operation_id,
                "delivery_id": delivery["id"],
                "vehicle_id": vehicle["id"],
                "event_type": event_type,
                "occurred_at": occurred_at.isoformat(),
                "source": "INTEGRATION_TEST",
                "payload": payload,
            },
        )
        assert response.status_code == 201, response.text

    duplicate = client.post(
        "/api/v1/telemetry/events",
        json={
            "event_id": f"EVT-{suffix}-DELIVERY_DISPATCHED",
            "operation_id": operation_id,
            "delivery_id": delivery["id"],
            "vehicle_id": vehicle["id"],
            "event_type": "DELIVERY_DISPATCHED",
            "occurred_at": dispatch.isoformat(),
            "source": "INTEGRATION_TEST",
            "payload": {"progress_pct": 0},
        },
    )
    assert duplicate.status_code == 200

    final_delivery = _data(
        client.get(f"/api/v1/operations/{operation_id}/deliveries/{delivery['id']}")
    )
    assert final_delivery["status"] == "CONFIRMED"

    timeline = _data(client.get(f"/api/v1/deliveries/{delivery['id']}/timeline"))
    assert len(timeline) == 4

    telemetry = _data(
        client.get(f"/api/v1/operations/{operation_id}/telemetry/latest")
    )
    assert telemetry[0]["vehicle_id"] == vehicle["id"]
    assert telemetry[0]["telemetry_status"] == "CURRENT"

    latest_prediction = _data(
        client.get(f"/api/v1/deliveries/{delivery['id']}/predictions/latest")
    )
    assert latest_prediction["delivery_id"] == delivery["id"]
    assert latest_prediction["model_name"] in {"fallback_speed", "linear_regression+random_forest"}
    assert latest_prediction["risk_level"] in {"LOW", "AT_RISK", "HIGH"}
