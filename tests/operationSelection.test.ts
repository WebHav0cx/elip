import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "../src/features/auth/types/auth.types.ts";
import type { Operation } from "../src/types/logistics.types.ts";
import type {
  OperationDataSource,
  OperationRecords,
} from "../src/features/operations/types/operationSource.types.ts";
import {
  authorisedOperations,
  emptyOperationRecords,
  operationName,
  resolveOperationId,
  scopeOperationRecords,
} from "../src/features/operations/services/operationSelection.ts";
import {
  loadOperationList,
  loadOperationRecords,
} from "../src/features/operations/services/operationSource.ts";
import { analyticsSummary } from "../src/features/analytics/services/analyticsSelectors.ts";
const user: AuthUser = {
  id: "USR-003",
  name: "Sam Okafor",
  email: "sam.okafor@elip.demo",
  role: "Monitoring Analyst",
  status: "ACTIVE",
};
const operation: Operation = {
  id: "SIM-2026-001",
  name: "",
  start: "2026-12-03T07:00",
  end: "2026-12-03T18:00",
  status: "RUNNING",
  totalDeliveries: 75,
  createdAt: "2026-10-18",
  seed: "ELIP-NG-2603",
};
const second: Operation = {
  ...operation,
  id: "SIM-2026-002",
  name: "Readiness Exercise 02",
  status: "READY",
};

test("access respects the existing role gate, inactive users and explicit operation grants", () => {
  assert.deepEqual(authorisedOperations([operation, second], null, true), []);
  assert.deepEqual(authorisedOperations([operation, second], user), []);
  assert.deepEqual(
    authorisedOperations(
      [operation, second],
      { ...user, status: "INACTIVE" },
      true,
    ),
    [],
  );
  assert.deepEqual(
    authorisedOperations(
      [operation, second],
      { ...user, operationIds: [] },
      true,
    ),
    [],
  );
  assert.deepEqual(
    authorisedOperations(
      [operation, second],
      { ...user, operationIds: [second.id] },
      true,
    ).map((o) => o.id),
    [second.id],
  );
  assert.equal(authorisedOperations([operation, second], user, true).length, 2);
});
test("names come from records and unnamed records display their identifier", () => {
  assert.equal(operationName(operation), operation.id);
  assert.equal(operationName(second), second.name);
  assert.equal(
    operationName({ ...second, name: "  Backend supplied name  " }),
    "Backend supplied name",
  );
});
test("saved selections are validated against current access", () => {
  assert.equal(resolveOperationId([second], operation.id), second.id);
  assert.equal(resolveOperationId([], operation.id), "");
  assert.equal(resolveOperationId([operation, second], second.id), second.id);
});
test("all operation-owned records and comparison results are scoped together", () => {
  const records: OperationRecords = emptyOperationRecords();
  records.deliveries = [
    {
      id: "delivery-1",
      code: "SIM-001",
      operationId: operation.id,
      status: "IN_TRANSIT",
      vehicle: "VEH-001",
      deadline: "2026-12-03T10:00",
      region: "South West",
      duration: 60,
      lateness: 0,
    },
  ];
  records.vehicles = [
    {
      id: "vehicle-1",
      code: "VEH-001",
      operationId: operation.id,
      capacity: 8,
      status: "ASSIGNED",
      assignment: "SIM-001",
    },
  ];
  records.scenarios = [
    {
      id: "SCN-001",
      name: "Recorded scenario",
      operationId: operation.id,
      createdAt: "2026-12-03",
      baseline: "v1",
      solverStatus: "COMPLETED",
      reviewStatus: "NOT_REVIEWED",
      objective: "Recorded",
      assumptions: "Recorded",
      constraints: "Recorded",
      createdBy: user.name,
    },
  ];
  records.reviews = [
    {
      scenarioId: "SCN-001",
      decision: "APPROVED",
      reviewer: user.name,
      timestamp: "2026-12-03",
      note: "Recorded",
    },
  ];
  records.scenarioResults = {
    "SCN-001": {
      scenarioId: "SCN-001",
      baseline: [1, 1, 0, 1, 0],
      alternative: [1, 1, 0, 1, 0],
    },
  };
  assert.equal(
    scopeOperationRecords(records, operation.id).deliveries.length,
    1,
  );
  assert.deepEqual(
    scopeOperationRecords(records, second.id),
    emptyOperationRecords(),
  );
  assert.deepEqual(scopeOperationRecords(records, ""), emptyOperationRecords());
});
test("connected clients receive the authenticated principal, active id and AbortSignal", async () => {
  const controller = new AbortController();
  const records = emptyOperationRecords();
  const source: OperationDataSource = {
    mode: "live",
    async listOperations(principal, signal) {
      assert.equal(principal, user);
      assert.equal(signal, controller.signal);
      return [second];
    },
    async loadOperation(id, principal, signal) {
      assert.equal(id, second.id);
      assert.equal(principal, user);
      assert.equal(signal, controller.signal);
      return records;
    },
  };
  assert.deepEqual(await loadOperationList(source, user, controller.signal), [
    second,
  ]);
  assert.equal(
    await loadOperationRecords(source, second.id, user, controller.signal),
    records,
  );
});
test("failed or malformed connected responses do not silently use demo data", async () => {
  const controller = new AbortController();
  const source: OperationDataSource = {
    mode: "live",
    async listOperations() {
      throw new Error("Unavailable");
    },
    async loadOperation() {
      return null as unknown as OperationRecords;
    },
  };
  await assert.rejects(loadOperationList(source, user, controller.signal));
  await assert.rejects(
    loadOperationRecords(source, second.id, user, controller.signal),
  );
  source.loadOperation = async () => ({ ...emptyOperationRecords(), movementRoutes: { invalid: [[9, 7]] } });
  await assert.rejects(loadOperationRecords(source, second.id, user, controller.signal));
});
test("empty analytics never invents percentages, trend points or previous-operation counts", () => {
  const summary = analyticsSummary([], []);
  assert.equal(summary.onTimeRate, null);
  assert.equal(summary.averageDuration, null);
  assert.equal(summary.utilisation, null);
  assert.deepEqual(summary.trend, []);
  assert.deepEqual(summary.regions, []);
  assert.ok(summary.statuses.every((s) => s.count === 0));
});
