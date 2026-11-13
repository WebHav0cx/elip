import os
from typing import Any

import httpx


class SimulationAPIClient:
    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self.client = httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout)

    def authenticate(self, email: str | None = None, password: str | None = None) -> None:
        email = email or os.getenv("SIMULATION_API_EMAIL", "admin@example.com")
        password = password or os.getenv("SIMULATION_API_PASSWORD", "change-me-now")
        response = self.client.post("/api/v1/auth/login", json={"email": email, "password": password})
        if response.status_code == 401:
            bootstrap = self.client.post(
                "/api/v1/admin/users",
                json={"email": email, "password": password, "role": "ADMIN"},
            )
            if bootstrap.status_code not in (201, 403):
                bootstrap.raise_for_status()
            response = self.client.post("/api/v1/auth/login", json={"email": email, "password": password})
        response.raise_for_status()
        token = response.json()["data"]["access_token"]
        self.client.headers.update({"Authorization": f"Bearer {token}"})

    def close(self) -> None:
        self.client.close()

    def submit_event(self, event: dict[str, Any]) -> dict[str, Any]:
        response = self.client.post("/api/v1/telemetry/events", json=event)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.client.post(path, json=payload)
        response.raise_for_status()
        return response.json()

    def submit_events(self, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [self.submit_event(event) for event in events]
