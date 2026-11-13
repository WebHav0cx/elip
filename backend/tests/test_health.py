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
def test_cors_allows_configured_frontend_origin() -> None:
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "POST" in response.headers["access-control-allow-methods"]


def test_cors_rejects_unconfigured_origin() -> None:
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://malicious.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
