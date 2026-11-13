import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any


EVENT_TYPES = (
    "DELIVERY_DISPATCHED",
    "LOCATION_UPDATE",
    "ARRIVAL_RECORDED",
    "RECEIPT_CONFIRMED",
    "TELEMETRY_MISSING",
    "DELAY_REPORTED",
    "DISRUPTION_STARTED",
    "DISRUPTION_ENDED",
    "VEHICLE_UNAVAILABLE",
)


@dataclass(frozen=True)
class ReplayEvent:
    event_id: str
    simulation_id: str
    delivery_id: str
    vehicle_id: str
    event_type: str
    occurred_at: datetime
    source: str
    payload: dict[str, Any]

    def to_row(self) -> dict[str, str]:
        return {
            "event_id": self.event_id,
            "simulation_id": self.simulation_id,
            "delivery_id": self.delivery_id,
            "vehicle_id": self.vehicle_id,
            "event_type": self.event_type,
            "occurred_at": self.occurred_at.isoformat(),
            "source": self.source,
            "payload": json.dumps(self.payload, sort_keys=True),
        }
