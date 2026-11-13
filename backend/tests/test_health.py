import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://election:change-me@localhost:5432/election",
)

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"]


def test_versioned_operations_contract() -> None:
    response = client.get("/api/v1/operations", headers={"X-Request-ID": "req-test"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"
    assert response.json()["meta"]["request_id"] == "req-test"
    assert response.headers["X-Request-ID"] == "req-test"


def test_unknown_route_uses_error_envelope() -> None:
    response = client.get("/api/v1/does-not-exist", headers={"X-Request-ID": "req-404"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "RESOURCE_NOT_FOUND"
    assert response.json()["meta"]["request_id"] == "req-404"
