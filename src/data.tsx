import { ROUTES, type WorkspacePath } from "./routes";
import { createContext, useContext, useMemo, useState } from "react";
import { useAuth } from "./features/auth/hooks/useAuth";
import { authService } from "./features/auth/services/authService";
import type { User } from "./types/user.types";

export type { User, UserRole } from "./types/user.types";
export type Operation = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "DRAFT" | "READY" | "RUNNING" | "PAUSED" | "COMPLETED";
  totalDeliveries: number;
  createdAt: string;
  seed: string;
};
export type Location = {
  id: string;
  code: string;
  type: "HUB" | "DESTINATION";
  region: string;
  operationId: string;
};
export type Vehicle = {
  id: string;
  code: string;
  capacity: number;
  status: "AVAILABLE" | "ASSIGNED" | "UNAVAILABLE";
  assignment: string;
  operationId: string;
  position?: string;
};
export type Personnel = {
  id: string;
  code: string;
  role: string;
  status: "AVAILABLE" | "ASSIGNED" | "UNAVAILABLE";
  assignment: string;
  operationId: string;
};
export type Delivery = {
  id: string;
  code: string;
  operationId: string;
  status: "PLANNED" | "ASSIGNED" | "DISPATCHED" | "IN_TRANSIT" | "ARRIVED" | "CONFIRMED";
  vehicle: string;
  deadline: string;
  arrival?: string;
  region: string;
  duration: number;
  lateness: number;
};
export type DeliveryAssignment = { deliveryId: string; vehicleId: string; assignedAt: string };
export type MovementEvent = {
  id: string;
  vehicleId: string;
  deliveryId: string;
  recordedAt: string;
  description: string;
};
export type DeliveryStatusEvent = {
  id: string;
  deliveryId: string;
  status: Delivery["status"];
  recordedAt: string;
};
export type WeatherSnapshot = { id: string; region: string; condition: string; recordedAt: string };
export type DisruptionEvent = {
  id: string;
  type: string;
  region: string;
  recordedAt: string;
  verified: boolean;
};
export type DelayPrediction = {
  id: string;
  deliveryId: string;
  predictedEta: string;
  lateness: number;
  model: string;
  createdAt: string;
};
export type SolverStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "INFEASIBLE" | "FAILED";
export type ReviewStatus = "NOT_REVIEWED" | "APPROVED" | "REJECTED";
export type PlanningScenario = {
  id: string;
  name: string;
  operationId: string;
  createdAt: string;
  baseline: string;
  solverStatus: SolverStatus;
  reviewStatus: ReviewStatus;
  objective: string;
  assumptions: string;
  constraints: string;
  createdBy: string;
};
export type ScenarioResult = {
  scenarioId: string;
  baseline: [number, number, number, number, number];
  alternative: [number, number, number, number, number];
};
export type ReviewDecision = {
  scenarioId: string;
  decision: "APPROVED" | "REJECTED";
  reviewer: string;
  timestamp: string;
  note: string;
};
export type AuditLog = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
};
export type SimulationEvent = {
  id: string;
  time: string;
  type: string;
  delivery: string;
  vehicle: string;
  description: string;
};
export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "critical" | "success";
  read: boolean;
  destination: WorkspacePath;
};

const operation: Operation = {
  id: "SIM-2026-001",
  name: "Demo Operation",
  start: "2026-12-03T07:00",
  end: "2026-12-03T18:00",
  status: "RUNNING",
  totalDeliveries: 75,
  createdAt: "2026-10-18",
  seed: "ELIP-NG-2603",
};
const operation2: Operation = {
  id: "SIM-2026-002",
  name: "Readiness Exercise 02",
  start: "2026-12-10T07:00",
  end: "2026-12-10T17:00",
  status: "READY",
  totalDeliveries: 48,
  createdAt: "2026-11-02",
  seed: "ELIP-NG-2610",
};
const operation3: Operation = {
  id: "SIM-2026-003",
  name: "Regional Routing Test",
  start: "2026-11-12T08:00",
  end: "2026-11-12T16:00",
  status: "COMPLETED",
  totalDeliveries: 32,
  createdAt: "2026-10-28",
  seed: "ELIP-NG-2512",
};

export const sharedDeliveries: Delivery[] = Array.from({ length: 75 }, (_, index) => {
  const number = index + 1;
  const confirmed = number <= 42;
  const inTransit = number > 42 && number <= 67;
  const status = confirmed
    ? "CONFIRMED"
    : inTransit
      ? "IN_TRANSIT"
      : number <= 72
        ? "ASSIGNED"
        : "PLANNED";
  const late = [18, 24, 29, 41].includes(number);
  return {
    id: `delivery-${number}`,
    code: `SIM-${String(number).padStart(3, "0")}`,
    operationId: operation.id,
    status,
    vehicle: inTransit ? `VEH-${String((number % 12) + 1).padStart(3, "0")}` : "—",
    deadline: `2026-12-03T${String(9 + (number % 7)).padStart(2, "0")}:${number % 2 ? "30" : "00"}`,
    arrival: confirmed
      ? `2026-12-03T${String(8 + (number % 7)).padStart(2, "0")}:${number % 2 ? "18" : "42"}`
      : undefined,
    region: ["North Central", "South West", "South East", "North West"][number % 4],
    duration: 58 + (number % 6) * 11,
    lateness: late ? 18 + (number % 4) * 9 : 0,
  };
});

const initialUsers: User[] = [
  {
    id: "USR-001",
    name: "Alex Morgan",
    email: "alex.morgan@elip.demo",
    role: "Administrator",
    status: "ACTIVE",
    createdAt: "2026-09-14",
  },
  {
    id: "USR-002",
    name: "Maya Chen",
    email: "maya.chen@elip.demo",
    role: "Operations Coordinator",
    status: "ACTIVE",
    createdAt: "2026-09-18",
  },
  {
    id: "USR-003",
    name: "Sam Okafor",
    email: "sam.okafor@elip.demo",
    role: "Monitoring Analyst",
    status: "ACTIVE",
    createdAt: "2026-10-01",
  },
  {
    id: "USR-004",
    name: "Amara Bello",
    email: "amara.bello@elip.demo",
    role: "Planning Analyst",
    status: "ACTIVE",
    createdAt: "2026-10-05",
  },
  {
    id: "USR-005",
    name: "Jordan Lee",
    email: "jordan.lee@elip.demo",
    role: "Monitoring Analyst",
    status: "INACTIVE",
    createdAt: "2026-10-21",
  },
];

const initialVehicles: Vehicle[] = Array.from({ length: 10 }, (_, index) => ({
  id: `vehicle-${index + 1}`,
  code: `VEH-${String(index + 1).padStart(3, "0")}`,
  capacity: 8 + (index % 4) * 4,
  status: index < 7 ? "ASSIGNED" : index === 9 ? "UNAVAILABLE" : "AVAILABLE",
  assignment: index < 7 ? `SIM-${String(index + 18).padStart(3, "0")}` : "—",
  operationId: operation.id,
  position:
    index < 7
      ? `${(6.45 + index * 0.48).toFixed(3)}° N, ${(3.39 + index * 0.66).toFixed(3)}° E`
      : undefined,
}));
const initialPersonnel: Personnel[] = Array.from({ length: 8 }, (_, index) => ({
  id: `staff-${index + 1}`,
  code: `STF-${String(index + 1).padStart(3, "0")}`,
  role: index % 2 ? "Driver" : "Logistics Officer",
  status: index < 6 ? "ASSIGNED" : "AVAILABLE",
  assignment: index < 6 ? `VEH-${String(index + 1).padStart(3, "0")}` : "—",
  operationId: operation.id,
}));

const initialScenarios: PlanningScenario[] = [
  {
    id: "SCN-001",
    name: "Reduce South West delays",
    operationId: operation.id,
    createdAt: "2026-12-03 08:24",
    baseline: "PLAN-v1.4",
    solverStatus: "COMPLETED",
    reviewStatus: "NOT_REVIEWED",
    objective: "Reduce estimated lateness",
    assumptions: "Eight active vehicles; current availability retained.",
    constraints: "Deadlines and vehicle capacities enforced.",
    createdBy: "Amara Bello",
  },
  {
    id: "SCN-002",
    name: "Rainfall response plan",
    operationId: operation.id,
    createdAt: "2026-12-03 08:51",
    baseline: "PLAN-v1.4",
    solverStatus: "INFEASIBLE",
    reviewStatus: "NOT_REVIEWED",
    objective: "Improve on-time completion",
    assumptions: "Oyo corridor capacity reduced.",
    constraints: "No vehicle can hold overlapping assignments.",
    createdBy: "Amara Bello",
  },
  {
    id: "SCN-003",
    name: "Minimum fleet assessment",
    operationId: operation.id,
    createdAt: "2026-12-02 16:10",
    baseline: "PLAN-v1.3",
    solverStatus: "COMPLETED",
    reviewStatus: "APPROVED",
    objective: "Reduce required vehicle usage",
    assumptions: "All hubs operational.",
    constraints: "All 75 deliveries remain scheduled.",
    createdBy: "Alex Morgan",
  },
  {
    id: "SCN-004",
    name: "North East corridor test",
    operationId: operation.id,
    createdAt: "2026-12-03 09:12",
    baseline: "PLAN-v1.4",
    solverStatus: "QUEUED",
    reviewStatus: "NOT_REVIEWED",
    objective: "Reduce estimated lateness",
    assumptions: "VEH-011 unavailable.",
    constraints: "High-priority deliveries unchanged.",
    createdBy: "Amara Bello",
  },
];

const initialAudits: AuditLog[] = [
  {
    id: "AUD-1048",
    timestamp: "2026-12-03 09:31:18 WAT",
    actor: "Alex Morgan",
    action: "ALERT_ACKNOWLEDGED",
    entityType: "Alert",
    entityId: "ALT-1029",
    detail: "Stale telemetry alert acknowledged for review.",
  },
  {
    id: "AUD-1047",
    timestamp: "2026-12-03 09:26:03 WAT",
    actor: "ETA model v0.1",
    action: "PREDICTION_UPDATED",
    entityType: "Delivery",
    entityId: "SIM-018",
    detail: "Predicted arrival updated to 10:58 WAT.",
  },
  {
    id: "AUD-1046",
    timestamp: "2026-12-03 09:18:41 WAT",
    actor: "Amara Bello",
    action: "SCENARIO_CREATED",
    entityType: "Scenario",
    entityId: "SCN-004",
    detail: "North East corridor test created against PLAN-v1.4.",
  },
  {
    id: "AUD-1045",
    timestamp: "2026-12-03 09:14:07 WAT",
    actor: "Operation service",
    action: "DISRUPTION_RECORDED",
    entityType: "Disruption",
    entityId: "DSP-009",
    detail: "rainfall event recorded for Oyo corridor.",
  },
  {
    id: "AUD-1044",
    timestamp: "2026-12-03 09:08:12 WAT",
    actor: "Maya Chen",
    action: "ASSIGNMENT_UPDATED",
    entityType: "Delivery",
    entityId: "SIM-041",
    detail: "Vehicle assignment changed to VEH-009.",
  },
];

const simulationEvents: SimulationEvent[] = [
  {
    id: "EVT-001",
    time: "09:31:42",
    type: "POSITION_RECORDED",
    delivery: "SIM-002",
    vehicle: "VEH-003",
    description: "position received in FCT corridor.",
  },
  {
    id: "EVT-002",
    time: "09:29:33",
    type: "POSITION_RECORDED",
    delivery: "SIM-041",
    vehicle: "VEH-009",
    description: "Movement update received near Enugu destination.",
  },
  {
    id: "EVT-003",
    time: "09:26:03",
    type: "PREDICTION_UPDATED",
    delivery: "SIM-018",
    vehicle: "VEH-005",
    description: "Estimated arrival moved 28 minutes beyond deadline.",
  },
  {
    id: "EVT-004",
    time: "09:14:07",
    type: "DISRUPTION_RECORDED",
    delivery: "SIM-018",
    vehicle: "VEH-005",
    description: "rainfall event associated with route.",
  },
];
const initialNotifications: Notification[] = [
  {
    id: "NTF-001",
    title: "Delivery deadline risk",
    message: "SIM-018 is predicted to arrive 28 minutes late.",
    timestamp: "6 min ago",
    severity: "warning",
    read: false,
    destination: ROUTES.INTELLIGENCE,
  },
  {
    id: "NTF-002",
    title: "Vehicle telemetry stale",
    message: "VEH-011 has not reported for 24 minutes.",
    timestamp: "12 min ago",
    severity: "critical",
    read: false,
    destination: ROUTES.MOVEMENT_MAP,
  },
  {
    id: "NTF-003",
    title: "Recorded disruption",
    message: "rainfall event verified in Oyo corridor.",
    timestamp: "18 min ago",
    severity: "info",
    read: false,
    destination: ROUTES.INTELLIGENCE,
  },
  {
    id: "NTF-004",
    title: "Optimisation completed",
    message: "SCN-001 is ready for human review.",
    timestamp: "28 min ago",
    severity: "success",
    read: true,
    destination: ROUTES.SCENARIOS,
  },
];

type DataContextValue = {
  currentUser: User;
  users: User[];
  operations: Operation[];
  vehicles: Vehicle[];
  personnel: Personnel[];
  deliveries: Delivery[];
  scenarios: PlanningScenario[];
  reviews: ReviewDecision[];
  audits: AuditLog[];
  simulationState: Operation["status"];
  simulationEvents: SimulationEvent[];
  timezone: string;
  dateFormat: string;
  toast: string;
  notifications: Notification[];
  addUser(user: Omit<User, "id" | "createdAt">): boolean;
  updateUser(id: string, patch: Partial<User>): void;
  addOperation(operation: Omit<Operation, "id" | "createdAt" | "totalDeliveries">): void;
  addVehicle(vehicle: Omit<Vehicle, "id" | "assignment" | "position">): boolean;
  addPersonnel(person: Omit<Personnel, "id" | "assignment">): void;
  addScenario(
    scenario: Omit<
      PlanningScenario,
      "id" | "createdAt" | "solverStatus" | "reviewStatus" | "createdBy"
    >,
  ): void;
  updateScenario(id: string, patch: Partial<PlanningScenario>): void;
  reviewScenario(id: string, decision: ReviewDecision["decision"], note: string): void;
  setSimulationState(state: Operation["status"]): void;
  setPreferences(timezone: string, dateFormat: string): void;
  clearToast(): void;
  markNotificationRead(id: string): void;
  markAllNotificationsRead(): void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user: authenticatedUser } = useAuth();
  const [users, setUsers] = useState(initialUsers);
  const [operations, setOperations] = useState([operation, operation2, operation3]);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [personnel, setPersonnel] = useState(initialPersonnel);
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [reviews, setReviews] = useState<ReviewDecision[]>([]);
  const [audits, setAudits] = useState(initialAudits);
  const [simulationState, setSimulationStateValue] = useState<Operation["status"]>("RUNNING");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [dateFormat, setDateFormat] = useState("DD MMM YYYY");
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(initialNotifications);
  const now = "2026-12-03 09:36 WAT";
  const actingUser = users.find((item) => item.email === authenticatedUser?.email) ?? users[0];
  const audit = (action: string, entityType: string, entityId: string, detail: string) =>
    setAudits((items) => [
      {
        id: `AUD-${1049 + items.length}`,
        timestamp: now,
        actor: actingUser.name,
        action,
        entityType,
        entityId,
        detail,
      },
      ...items,
    ]);

  const value = useMemo<DataContextValue>(
    () => ({
      currentUser: actingUser,
      users,
      operations,
      vehicles,
      personnel,
      deliveries: sharedDeliveries,
      scenarios,
      reviews,
      audits,
      simulationState,
      simulationEvents,
      timezone,
      dateFormat,
      toast,
      notifications,
      addUser: (record) => {
        if (users.some((user) => user.email.toLowerCase() === record.email.toLowerCase()))
          return false;
        const user = {
          ...record,
          id: `USR-${String(users.length + 1).padStart(3, "0")}`,
          createdAt: "2026-12-03",
        };
        setUsers((items) => [...items, user]);
        audit("USER_CREATED", "User", user.id, `Created account for ${user.name}.`);
        setToast("Team member created.");
        return true;
      },
      updateUser: (id, patch) => {
        const target = users.find((user) => user.id === id);
        if (target && patch.status) {
          authService.setAccountActive(target.email, patch.status === "ACTIVE");
        }
        if (target && patch.role) {
          authService.setAccountRole(target.email, patch.role);
        }
        setUsers((items) => items.map((user) => (user.id === id ? { ...user, ...patch } : user)));
        audit("USER_UPDATED", "User", id, "Role or account status updated.");
        setToast("Team member updated.");
      },
      addOperation: (record) => {
        const item = {
          ...record,
          id: `SIM-2026-${String(operations.length + 1).padStart(3, "0")}`,
          createdAt: "2026-12-03",
          totalDeliveries: 0,
        };
        setOperations((items) => [...items, item]);
        audit("OPERATION_CREATED", "Operation", item.id, `${item.name} created in the application.`);
        setToast("Operation created.");
      },
      addVehicle: (record) => {
        if (
          vehicles.some(
            (vehicle) => vehicle.code === record.code && vehicle.operationId === record.operationId,
          )
        )
          return false;
        const item = { ...record, id: `vehicle-${vehicles.length + 1}`, assignment: "—" };
        setVehicles((items) => [...items, item]);
        audit("VEHICLE_CREATED", "Vehicle", item.code, "vehicle created.");
        setToast("Vehicle created.");
        return true;
      },
      addPersonnel: (record) => {
        const item = { ...record, id: `staff-${personnel.length + 1}`, assignment: "—" };
        setPersonnel((items) => [...items, item]);
        audit("PERSONNEL_CREATED", "Personnel", item.code, "personnel record created.");
        setToast("Personnel record created.");
      },
      addScenario: (record) => {
        const item = {
          ...record,
          id: `SCN-${String(scenarios.length + 1).padStart(3, "0")}`,
          createdAt: now,
          solverStatus: "QUEUED" as const,
          reviewStatus: "NOT_REVIEWED" as const,
          createdBy: actingUser.name,
        };
        setScenarios((items) => [item, ...items]);
        audit(
          "SCENARIO_CREATED",
          "Scenario",
          item.id,
          `${item.name} created against ${item.baseline}.`,
        );
        setToast("Scenario created and queued.");
      },
      updateScenario: (id, patch) => {
        setScenarios((items) =>
          items.map((scenario) => (scenario.id === id ? { ...scenario, ...patch } : scenario)),
        );
        setToast("Scenario status updated.");
      },
      reviewScenario: (id, decision, note) => {
        const review = {
          scenarioId: id,
          decision,
          reviewer: actingUser.name,
          timestamp: now,
          note,
        };
        setReviews((items) => [...items, review]);
        setScenarios((items) =>
          items.map((scenario) =>
            scenario.id === id ? { ...scenario, reviewStatus: decision } : scenario,
          ),
        );
        audit(
          `SCENARIO_${decision}`,
          "Scenario",
          id,
          note || `Recommendation ${decision.toLowerCase()}. Baseline unchanged.`,
        );
        setToast(`Recommendation ${decision.toLowerCase()}; baseline unchanged.`);
      },
      setSimulationState: (state) => {
        setSimulationStateValue(state);
        audit(
          "OPERATION_STATE_CHANGED",
          "Operation",
          operation.id,
          `Operation moved to ${state}.`,
        );
        setToast(`Operation ${state.toLowerCase()}.`);
      },
      setPreferences: (nextTimezone, nextDateFormat) => {
        setTimezone(nextTimezone);
        setDateFormat(nextDateFormat);
        setToast("Preferences saved.");
      },
      clearToast: () => setToast(""),
      markNotificationRead: (id) =>
        setNotifications((items) =>
          items.map((item) => (item.id === id ? { ...item, read: true } : item)),
        ),
      markAllNotificationsRead: () =>
        setNotifications((items) => items.map((item) => ({ ...item, read: true }))),
    }),
    [
      audits,
      authenticatedUser,
      dateFormat,
      notifications,
      operations,
      personnel,
      reviews,
      scenarios,
      simulationState,
      timezone,
      toast,
      users,
      vehicles,
    ],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData must be used inside DataProvider");
  return value;
}

export const scenarioResults: Record<string, ScenarioResult> = {
  "SCN-001": {
    scenarioId: "SCN-001",
    baseline: [75, 63, 12, 8, 214],
    alternative: [75, 68, 7, 8, 126],
  },
  "SCN-003": {
    scenarioId: "SCN-003",
    baseline: [75, 63, 12, 8, 214],
    alternative: [75, 65, 10, 7, 168],
  },
};
