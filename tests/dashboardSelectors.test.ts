import assert from "node:assert/strict";
import test from "node:test";
import {
  accessChanges,
  comparisonRows,
  deliveryEvidence,
  monitoringSummary,
  operationTimestamp,
  operationalUpdates,
  planningSummary,
  roleDistribution,
} from "../src/features/dashboards/services/dashboardSelectors.ts";
import type {
  Delivery,
  Operation,
  PlanningScenario,
} from "../src/types/logistics.types.ts";
import type { MovementVehicle } from "../src/features/movement/types/movement.types.ts";
import type { AlertRecord } from "../src/features/intelligence/types/alert.types.ts";

const operation: Operation = {
  id: "op",
  name: "Test",
  start: "2026-12-03T07:00",
  end: "2026-12-03T18:00",
  simulationTime: "2026-12-03T09:36:00+01:00",
  status: "RUNNING",
  totalDeliveries: 1,
  createdAt: "2026-12-03",
  seed: "test",
};
const delivery: Delivery = {
  id: "d1",
  code: "D-001",
  operationId: "op",
  status: "IN_TRANSIT",
  vehicle: "V-001",
  deadline: "2026-12-03T09:20",
  region: "South West",
  duration: 50,
  lateness: 20,
};
const telemetry: MovementVehicle = {
  operationId: "op",
  id: "V-001",
  delivery: "D-001",
  destination: "Destination",
  zone: "South West",
  state: "Oyo",
  position: [7.5, 3.8],
  freshness: "Fresh",
  updated: "09:35:00",
  age: "1 min ago",
  eta: "09:40",
  deadline: "09:20",
  risk: "At risk",
};
const scenario: PlanningScenario = {
  id: "s1",
  operationId: "op",
  name: "Test",
  createdAt: "2026-12-03",
  baseline: "v1",
  solverStatus: "COMPLETED",
  reviewStatus: "NOT_REVIEWED",
  objective: "Test",
  assumptions: "Recorded",
  constraints: "Recorded",
  createdBy: "Planner",
};

test("risk and overdue are independent of lifecycle and use simulation time", () => {
  const value = deliveryEvidence(delivery, [], [], operation);
  assert.equal(value.atRisk, true);
  assert.equal(value.overdue, true);
  assert.equal(value.delivery.status, "IN_TRANSIT");
  assert.equal(
    deliveryEvidence(delivery, [], [], {
      ...operation,
      simulationTime: "2026-12-03T09:00:00+01:00",
    }).overdue,
    false,
  );
  assert.equal(
    deliveryEvidence(delivery, [], [], {
      ...operation,
      simulationTime: undefined,
    }).overdue,
    false,
  );
  assert.equal(
    deliveryEvidence({ ...delivery, status: "CONFIRMED" }, [], [], operation)
      .atRisk,
    false,
  );
  assert.equal(
    operationTimestamp("2026-12-03 09:36 WAT"),
    Date.parse(operation.simulationTime!),
  );
});

test("telemetry coverage includes missing active journey reports", () => {
  const deliveries = [delivery, { ...delivery, id: "d2", code: "D-002" }];
  const result = monitoringSummary(deliveries, [telemetry], [], operation);
  assert.equal(result.active, 2);
  assert.equal(result.coverage, 50);
  assert.equal(result.exceptions.length, 1);
  assert.equal(result.exceptions[0].ageMinutes, null);
  const stale = monitoringSummary(
    [delivery],
    [{ ...telemetry, updated: "09:08:00" }],
    [],
    operation,
  );
  assert.equal(stale.stale, 1);
  assert.equal(stale.coverage, 0);
  assert.equal(stale.exceptions[0].ageMinutes, 28);
  assert.equal(monitoringSummary([], [], [], operation).coverage, null);
});

test("prediction evidence never leaks from another operation", () => {
  const other = {
    id: "a",
    operationId: "other",
    entity: delivery.code,
    updated: "09:35",
    prediction: {
      lateness: 999,
      arrival: "22:00",
      deadline: "09:20",
      generated: "09:35",
    },
  } as AlertRecord;
  assert.equal(
    deliveryEvidence(
      delivery,
      [{ ...telemetry, operationId: "other" }],
      [other],
      operation,
    ).movement,
    undefined,
  );
  assert.equal(deliveryEvidence(delivery, [], [other], operation).lateness, 20);
});

test("audit changes exclude operational events and do not fabricate records", () => {
  assert.deepEqual(accessChanges([]), []);
  const base = {
    id: "a",
    timestamp: "2026-12-03 09:36 WAT",
    actor: "Admin",
    entityId: "user",
    detail: "Recorded",
  };
  const result = accessChanges([
    { ...base, action: "ROLE_CHANGED", entityType: "User" },
    { ...base, id: "b", action: "PREDICTION_UPDATED", entityType: "Delivery" },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].action, "ROLE_CHANGED");
  const roles = roleDistribution([]);
  assert.equal(roles.length, 4);
  assert.ok(roles.every((r) => r.count === 0));
});

test("planning distinguishes pending reviews, failures and infeasibility", () => {
  const result = planningSummary([
    scenario,
    { ...scenario, id: "s2", reviewStatus: "APPROVED" },
    { ...scenario, id: "s3", solverStatus: "INFEASIBLE" },
    { ...scenario, id: "s4", solverStatus: "FAILED" },
  ]);
  assert.equal(result.completed.length, 2);
  assert.equal(result.pending.length, 1);
  assert.equal(result.infeasible.length, 1);
  assert.equal(result.attention.length, 3);
  const rows = comparisonRows({
    scenarioId: "s1",
    baseline: [75, 63, 12, 8, 214],
    alternative: [75, 68, 7, 8, 126],
  });
  assert.equal(rows[0].baseline, 63);
  assert.equal(rows[3].alternative, "126 min");
  assert.equal(rows[4].alternative, "Not recorded");
});

test("operational updates are scoped even when delivery codes match", () => {
  const event = { id: "e1", operationId: "op", time: "09:30", type: "POSITION_RECORDED", delivery: "D-001", vehicle: "V-001", description: "Recorded update" };
  const updates = operationalUpdates([event, { ...event, id: "e2", operationId: "another-operation" }, { ...event, id: "e3", type: "USER_CREATED" }], [delivery]);
  assert.deepEqual(updates.map(e => e.id), ["e1"]);
});
