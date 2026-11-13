import { Sidebar } from "./components/layout/Sidebar";
import { applicationNavigation } from "./components/layout/navigation";
import { useModalFocus } from "./hooks/useModalFocus";
import { ROUTES, buildRoute, movementMapPath } from "./routes";

import {
  AlertTriangle,
  Bell,
  Boxes,
  Check,
  ChevronRight,
  Clock3,
  CloudRain,
  Expand,
  Filter,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  MoreHorizontal,
  Route,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useData } from "./data";
import { RoleOverviewPage } from "./features/dashboards/pages/RoleOverviewPage";
import { usePermissions } from "./hooks/usePermissions";

const MovementMap = lazy(() => import("./features/movement/pages/MovementMap"));
const Intelligence = lazy(
  () => import("./features/intelligence/pages/Intelligence"),
);
const ScenariosPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.ScenariosPage })),
);
const TeamPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.TeamPage })),
);
const SettingsPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.SettingsPage })),
);
const OperationsPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.OperationsPage })),
);
const ResourcesPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.ResourcesPage })),
);
const AnalyticsPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.AnalyticsPage })),
);
const AuditPage = lazy(() =>
  import("./Workspaces").then((module) => ({ default: module.AuditPage })),
);

const icons = {
  alert: AlertTriangle,
  bell: Bell,
  box: Boxes,
  check: Check,
  chevron: ChevronRight,
  clock: Clock3,
  cloud: CloudRain,
  dashboard: LayoutDashboard,
  delivery: Truck,
  expand: Expand,
  filter: Filter,
  map: MapIcon,
  menu: Menu,
  more: MoreHorizontal,
  route: Route,
  search: Search,
  settings: Settings,
  spark: Sparkles,
  trend: TrendingUp,
  truck: Truck,
  users: Users,
  x: X,
} satisfies Record<string, LucideIcon>;
type IconName = keyof typeof icons;

function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return (
    <Component
      className={className}
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}

const alerts = [
  {
    id: "SIM-018",
    title: "Predicted arrival later than deadline",
    detail: "ETA 10:58 · 28 minutes late",
    time: "6 min ago",
    type: "At risk",
    tone: "amber",
    icon: "trend" as IconName,
  },
  {
    id: "SIM-029",
    title: "Last movement update is stale",
    detail: "Last signal 24 minutes ago",
    time: "12 min ago",
    type: "Telemetry",
    tone: "amber",
    icon: "clock" as IconName,
  },
  {
    id: "SIM-041",
    title: "weather disruption reported",
    detail: "Heavy rainfall · Zone C",
    time: "18 min ago",
    type: "Review",
    tone: "purple",
    icon: "cloud" as IconName,
  },
];

const areas = [
  { name: "North district", done: 14, total: 18, color: "bg-blue-600" },
  { name: "Central district", done: 18, total: 27, color: "bg-emerald-600" },
  { name: "South district", done: 10, total: 19, color: "bg-teal-600" },
  { name: "Remote zones", done: 0, total: 11, color: "bg-slate-400" },
];

type Delivery = {
  id: string;
  destination: string;
  region: string;
  vehicle: string;
  status: "Completed" | "In transit" | "Assigned" | "Planned";
  risk: "On track" | "At risk" | "Overdue" | "Not assessed";
  deadline: string;
  eta: string;
  updated: string;
  origin: string;
  assignee: string;
};

const deliveries: Delivery[] = [
  {
    id: "SIM-001",
    destination: "Zone A-04",
    region: "North",
    vehicle: "VEH-003",
    status: "Completed",
    risk: "On track",
    deadline: "09:30",
    eta: "09:20",
    updated: "09:21",
    origin: "North Distribution Hub",
    assignee: "Jordan Lee",
  },
  {
    id: "SIM-002",
    destination: "Zone B-08",
    region: "Central",
    vehicle: "VEH-007",
    status: "In transit",
    risk: "On track",
    deadline: "11:00",
    eta: "10:45",
    updated: "09:29",
    origin: "Central Distribution Hub",
    assignee: "Sam Okafor",
  },
  {
    id: "SIM-018",
    destination: "Zone C-12",
    region: "South",
    vehicle: "VEH-005",
    status: "In transit",
    risk: "At risk",
    deadline: "10:30",
    eta: "10:58",
    updated: "09:26",
    origin: "South Distribution Hub",
    assignee: "Maya Chen",
  },
  {
    id: "SIM-024",
    destination: "Zone B-14",
    region: "Central",
    vehicle: "VEH-008",
    status: "In transit",
    risk: "At risk",
    deadline: "10:30",
    eta: "11:05",
    updated: "09:27",
    origin: "Central Distribution Hub",
    assignee: "Taylor Reed",
  },
  {
    id: "SIM-029",
    destination: "Zone D-03",
    region: "Remote",
    vehicle: "VEH-011",
    status: "In transit",
    risk: "At risk",
    deadline: "10:15",
    eta: "10:42",
    updated: "09:08",
    origin: "North Distribution Hub",
    assignee: "Amara Bello",
  },
  {
    id: "SIM-036",
    destination: "Zone A-11",
    region: "North",
    vehicle: "VEH-002",
    status: "Assigned",
    risk: "Not assessed",
    deadline: "12:10",
    eta: "—",
    updated: "08:54",
    origin: "North Distribution Hub",
    assignee: "Chris Morgan",
  },
  {
    id: "SIM-041",
    destination: "Zone C-06",
    region: "South",
    vehicle: "VEH-009",
    status: "In transit",
    risk: "Overdue",
    deadline: "09:20",
    eta: "09:51",
    updated: "09:30",
    origin: "South Distribution Hub",
    assignee: "Drew Patel",
  },
  {
    id: "SIM-052",
    destination: "Zone B-02",
    region: "Central",
    vehicle: "Unassigned",
    status: "Planned",
    risk: "Not assessed",
    deadline: "13:00",
    eta: "—",
    updated: "08:35",
    origin: "Central Distribution Hub",
    assignee: "Unassigned",
  },
];

const deliveryEvents = [
  {
    time: "08:45",
    title: "Delay prediction updated",
    detail: "Estimated arrival moved beyond the scheduled deadline.",
    tone: "amber",
  },
  {
    time: "08:15",
    title: "Progress update",
    detail: "position and delivery progress recorded.",
    tone: "blue",
  },
  {
    time: "07:30",
    title: "Dispatched",
    detail: "Journey started from the distribution hub.",
    tone: "blue",
  },
  {
    time: "07:00",
    title: "Assigned",
    detail: "Vehicle and delivery resources assigned.",
    tone: "slate",
  },
];

function DeliveriesPage({ externalQuery }: { externalQuery: string }) {
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [risk, setRisk] = useState("All risks");
  const [sort, setSort] = useState("Deadline");
  const [selected, setSelected] = useState<Delivery | null>(null);
  const deliveryPanel = useRef<HTMLElement>(null);
  useModalFocus(Boolean(selected), deliveryPanel, () => setSelected(null));

  const rows = useMemo(() => {
    const search = `${localQuery} ${externalQuery}`.trim().toLowerCase();
    return deliveries
      .filter(
        (delivery) =>
          !search ||
          `${delivery.id} ${delivery.destination} ${delivery.region} ${delivery.vehicle}`
            .toLowerCase()
            .includes(search),
      )
      .filter(
        (delivery) => status === "All statuses" || delivery.status === status,
      )
      .filter((delivery) => risk === "All risks" || delivery.risk === risk)
      .sort((a, b) =>
        sort === "Last update"
          ? b.updated.localeCompare(a.updated)
          : sort === "Predicted lateness"
            ? riskRank(b.risk) - riskRank(a.risk)
            : a.deadline.localeCompare(b.deadline),
      );
  }, [externalQuery, localQuery, risk, sort, status]);

  return (
    <div className="max-w-385 pt-7.75 pb-6.5 max-sm:py-5.75 px-8 max-sm:px-4 my-0 mx-auto">
      <div className="flex justify-between items-end max-sm:items-stretch max-sm:flex-col gap-6">
        <div>
          <div className="flex items-center text-slate-400 text-xs max-lg:text-xs font-bold tracking-wide gap-2">
            <span className="text-blue-600">OPERATIONS</span>
            <i className="w-0.75 h-0.75 rounded-full bg-slate-400" />
            75 SCHEDULED DELIVERIES
          </div>
          <h1 className="mt-2 mb-1 text-3xl font-bold tracking-tight">
            Deliveries
          </h1>
          <p className="text-slate-500 text-xs my-0 mx-0">
            Inspect lifecycle status, delay risk and recorded delivery events.
          </p>
        </div>
        <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-9.5 rounded-lg text-slate-700 bg-white text-xs max-lg:text-xs font-semibold border border-slate-300 hover:bg-slate-50 hover:border-slate-400 py-0 px-3.75">
          Export report
        </button>
      </div>

      <div className="min-h-13.5 mt-6 mb-3.25 flex items-center rounded-lg bg-white border border-slate-200 max-sm:flex-wrap max-sm:gap-y-3 max-sm:gap-x-4.5 gap-7 py-0 max-sm:py-3.25 px-4.5 max-sm:px-3.25 mx-0">
        <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-1.5">
          <span
            className="w-1.75 h-1.75 rounded-full bg-emerald-700"
            data-state="green"
          />
          <strong className="text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
            42
          </strong>
          <span>Completed</span>
        </div>
        <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-1.5">
          <span
            className="w-1.75 h-1.75 rounded-full bg-blue-600"
            data-state="blue"
          />
          <strong className="text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
            25
          </strong>
          <span>In transit</span>
        </div>
        <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-1.5">
          <span
            className="w-1.75 h-1.75 rounded-full bg-slate-400"
            data-state="slate"
          />
          <strong className="text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
            8
          </strong>
          <span>Not dispatched</span>
        </div>
        <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-1.5">
          <span
            className="w-1.75 h-1.75 rounded-full bg-amber-700"
            data-state="amber"
          />
          <strong className="text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
            6
          </strong>
          <span>At risk</span>
        </div>
        <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-1.5">
          <span
            className="w-1.75 h-1.75 rounded-full bg-red-600"
            data-state="red"
          />
          <strong className="text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
            4
          </strong>
          <span>Overdue</span>
        </div>
        <small className="ml-auto text-slate-400 text-xs max-lg:text-xs max-sm:w-full max-sm:my-0 max-sm:mx-0">
          Risk indicators overlap lifecycle status
        </small>
      </div>

      <section className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-visible">
        <div className="min-h-16.25 flex items-center justify-between border-b border-b-slate-200 max-xl:items-stretch max-xl:flex-col gap-4 py-3.25 px-3.75">
          <label className="w-72 max-w-full h-9.25 flex items-center rounded-lg text-slate-400 bg-slate-50 border border-slate-300 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 max-xl:w-full gap-2 py-0 px-2.75">
            <Icon name="search" size={17} />
            <input
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 w-full outline-none text-slate-800 bg-transparent text-xs border-0"
              value={localQuery}
              onChange={(event) => setLocalQuery(event.target.value)}
              placeholder="Search ID, destination or vehicle…"
            />
          </label>
          <div className="flex items-center max-xl:flex-wrap max-sm:grid max-sm:grid-cols-1 gap-1.75">
            <label className="h-9.25 flex items-center rounded-lg text-slate-500 bg-white border border-slate-300 max-sm:flex-1 max-sm:min-w-0 gap-0.75 py-0 px-2">
              <Icon name="filter" size={14} />
              <select
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 outline-none text-slate-600 bg-transparent text-xs font-medium border-0 max-sm:min-w-0 max-sm:w-full"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>All statuses</option>
                <option>Completed</option>
                <option>In transit</option>
                <option>Assigned</option>
                <option>Planned</option>
              </select>
            </label>
            <label className="h-9.25 flex items-center rounded-lg text-slate-500 bg-white border border-slate-300 max-sm:flex-1 max-sm:min-w-0 gap-0.75 py-0 px-2">
              <select
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 outline-none text-slate-600 bg-transparent text-xs font-medium border-0 max-sm:min-w-0 max-sm:w-full"
                value={risk}
                onChange={(event) => setRisk(event.target.value)}
              >
                <option>All risks</option>
                <option>On track</option>
                <option>At risk</option>
                <option>Overdue</option>
                <option>Not assessed</option>
              </select>
            </label>
            <label
              className="h-9.25 flex items-center rounded-lg text-slate-500 bg-slate-100 border border-slate-300 max-sm:flex-1 max-sm:min-w-0 gap-0.75 py-0 px-2 ml-1.25 border-0 max-sm:w-full max-sm:my-0 max-sm:mx-0"
              data-slot="sort-select"
            >
              <span className="text-slate-400 text-xs max-lg:text-xs">
                Sort:
              </span>
              <select
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 outline-none text-slate-600 bg-transparent text-xs font-medium border-0 max-sm:min-w-0 max-sm:w-full"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option>Deadline</option>
                <option>Predicted lateness</option>
                <option>Last update</option>
              </select>
            </label>
          </div>
        </div>
        <div className="grid gap-3 p-3 md:hidden" aria-label="Delivery list">
          {rows.map((delivery) => (
            <button
              key={delivery.id}
              type="button"
              aria-label={`View delivery ${delivery.id}`}
              onClick={() => setSelected(delivery)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-blue-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-slate-900">
                  {delivery.id}
                </strong>
                <span
                  className={[
                    "w-fit inline-flex items-center rounded-xl text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap gap-1.25 py-1 px-1.75",
                    String(delivery.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("completed")
                      ? "text-emerald-800 bg-emerald-50"
                      : "",
                    String(delivery.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("in-transit")
                      ? "text-blue-700 bg-blue-50"
                      : "",
                    String(delivery.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("assigned")
                      ? "text-slate-500 bg-slate-100"
                      : "",
                    String(delivery.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("planned")
                      ? "text-slate-500 bg-slate-100"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-state={delivery.status.toLowerCase().replace(" ", "-")}
                >
                  {delivery.status}
                </span>
              </div>
              <span className="mt-2 block text-sm text-slate-700">
                {delivery.destination} · {delivery.vehicle}
              </span>
              <span className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Deadline {delivery.deadline} · ETA {delivery.eta}
                </span>
                <span
                  className={[
                    "w-fit inline-flex items-center rounded-xl text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap gap-1.25 py-1 px-1.75",
                    String(delivery.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("on-track")
                      ? "text-emerald-700 bg-emerald-50"
                      : "",
                    String(delivery.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("at-risk")
                      ? "text-amber-700 bg-amber-100"
                      : "",
                    String(delivery.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("overdue")
                      ? "text-red-700 bg-red-50"
                      : "",
                    String(delivery.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("not-assessed")
                      ? "text-slate-500 bg-slate-100"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-state={delivery.risk.toLowerCase().replace(" ", "-")}
                >
                  {delivery.risk}
                </span>
              </span>
            </button>
          ))}
          {!rows.length && (
            <p className="p-5 text-center text-sm text-slate-500">
              No deliveries found. Change or clear the search and filters.
            </p>
          )}
        </div>
        <div className="hidden min-h-118.75 overflow-x-auto md:block">
          <table className="w-full border-collapse text-slate-600 text-xs max-lg:text-xs max-sm:min-w-232.5">
            <thead>
              <tr>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Delivery
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Destination
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Vehicle
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Lifecycle status
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Delay risk
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Deadline
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Expected arrival
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25">
                  Last update
                </th>
                <th className="h-10 text-slate-500 bg-slate-50 text-xs max-lg:text-xs font-bold text-left uppercase whitespace-nowrap tracking-wide py-0 px-3.25" />
              </tr>
            </thead>
            <tbody>
              {rows.map((delivery) => (
                <tr
                  className="cursor-pointer"
                  key={delivery.id}
                  data-state={selected?.id === delivery.id ? "selected" : ""}
                  onClick={() => setSelected(delivery)}
                >
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50 ring-2 ring-blue-600"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <strong className="block text-slate-700 text-xs max-lg:text-xs">
                      {delivery.id}
                    </strong>
                    <small className="block mt-0.75 text-slate-400 text-xs max-lg:text-xs">
                      {delivery.region} district
                    </small>
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {delivery.destination}
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="flex items-center gap-1.25">
                      <Icon className="text-slate-500" name="truck" size={14} />
                      {delivery.vehicle}
                    </span>
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span
                      className={[
                        "w-fit inline-flex items-center rounded-xl text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap gap-1.25 py-1 px-1.75",
                        String(delivery.status.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("completed")
                          ? "text-emerald-800 bg-emerald-50"
                          : "",
                        String(delivery.status.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("in-transit")
                          ? "text-blue-700 bg-blue-50"
                          : "",
                        String(delivery.status.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("assigned")
                          ? "text-slate-500 bg-slate-100"
                          : "",
                        String(delivery.status.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("planned")
                          ? "text-slate-500 bg-slate-100"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      data-state={delivery.status
                        .toLowerCase()
                        .replace(" ", "-")}
                    >
                      <i
                        className={[
                          "w-1.25 h-1.25 rounded-full",
                          String(
                            delivery.status.toLowerCase().replace(" ", "-"),
                          )
                            .split(" ")
                            .includes("completed")
                            ? "bg-emerald-700"
                            : "",
                          String(
                            delivery.status.toLowerCase().replace(" ", "-"),
                          )
                            .split(" ")
                            .includes("in-transit")
                            ? "bg-blue-600"
                            : "",
                          String(
                            delivery.status.toLowerCase().replace(" ", "-"),
                          )
                            .split(" ")
                            .includes("assigned")
                            ? "bg-slate-400"
                            : "",
                          String(
                            delivery.status.toLowerCase().replace(" ", "-"),
                          )
                            .split(" ")
                            .includes("planned")
                            ? "bg-slate-400"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      {delivery.status}
                    </span>
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span
                      className={[
                        "w-fit inline-flex items-center rounded-xl text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap gap-1.25 py-1 px-1.75",
                        String(delivery.risk.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("on-track")
                          ? "text-emerald-700 bg-emerald-50"
                          : "",
                        String(delivery.risk.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("at-risk")
                          ? "text-amber-700 bg-amber-100"
                          : "",
                        String(delivery.risk.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("overdue")
                          ? "text-red-700 bg-red-50"
                          : "",
                        String(delivery.risk.toLowerCase().replace(" ", "-"))
                          .split(" ")
                          .includes("not-assessed")
                          ? "text-slate-500 bg-slate-100"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      data-state={delivery.risk.toLowerCase().replace(" ", "-")}
                    >
                      {delivery.risk}
                    </span>
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {delivery.deadline}
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                      delivery.risk === "At risk" || delivery.risk === "Overdue"
                        ? "text-red-600 font-bold"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {delivery.eta}
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="block">
                      {delivery.updated}
                      <small className="block mt-0.75 text-slate-400 text-xs max-lg:text-xs">
                        {delivery.id === "SIM-029" ? "24 min ago" : "recent"}
                      </small>
                    </span>
                  </td>
                  <td
                    className={[
                      "h-13.5 border-t border-t-slate-200 whitespace-nowrap transition-colors duration-150 py-0 px-3.25",
                      String(selected?.id === delivery.id ? "selected" : "")
                        .split(" ")
                        .includes("selected")
                        ? "bg-blue-50"
                        : "bg-slate-50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <Icon name="chevron" size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="h-100 flex flex-col items-center justify-center text-slate-400">
              <Icon name="search" />
              <strong className="mt-2.5 text-slate-600 text-xs max-lg:text-xs">
                No deliveries found
              </strong>
              <span className="mt-1 text-xs max-lg:text-xs">
                Change or clear the active search and filters.
              </span>
            </div>
          )}
        </div>
        <div className="min-h-13.5 flex items-center justify-between max-sm:flex-col max-sm:gap-3 max-sm:py-3 border-t border-t-slate-200 text-slate-500 text-xs max-lg:text-xs py-0 px-3.75">
          <span>
            Showing <strong>{rows.length}</strong> of 75 deliveries
          </span>
          <div className="flex gap-1">
            <button
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 min-w-7 h-7 rounded-md text-slate-500 bg-white text-xs max-lg:text-xs border border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 py-0 px-2"
              disabled
            >
              Previous
            </button>
            <button
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 min-w-7 h-7 rounded-md text-white bg-blue-600 text-xs max-lg:text-xs border border-blue-600 disabled:text-slate-400 disabled:bg-slate-100 py-0 px-2"
              data-state="current"
            >
              1
            </button>
            <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 min-w-7 h-7 rounded-md text-slate-500 bg-white text-xs max-lg:text-xs border border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 max-sm:hidden py-0 px-2">
              2
            </button>
            <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 min-w-7 h-7 rounded-md text-slate-500 bg-white text-xs max-lg:text-xs border border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 max-sm:hidden py-0 px-2">
              3
            </button>
            <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 min-w-7 h-7 rounded-md text-slate-500 bg-white text-xs max-lg:text-xs border border-slate-200 disabled:text-slate-400 disabled:bg-slate-100 py-0 px-2">
              Next
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div
          className="fixed top-0 right-0 bottom-0 left-0 z-50 flex justify-end bg-slate-800/33 backdrop-blur-xs"
          onClick={() => setSelected(null)}
        >
          <aside
            ref={deliveryPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Delivery details"
            className="w-full max-w-lg h-dvh overflow-y-auto overscroll-contain bg-slate-50 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 min-h-28.75 pt-5.5 pb-4.5 flex justify-between border-b border-b-slate-200 bg-white px-6 max-sm:px-4.5">
              <div>
                <span className="text-blue-600 text-xs max-lg:text-xs font-bold tracking-wide">
                  DELIVERY DETAILS
                </span>
                <h2 className="mt-1.5 mb-1 text-slate-800 font-bold text-2xl leading-normal font-sans not-italic mx-0">
                  {selected.id}
                </h2>
                <p className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-0.75 my-0 mx-0">
                  {selected.origin} <Icon name="chevron" size={12} />{" "}
                  {selected.destination}
                </p>
              </div>
              <button
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 w-7.75 h-7.75 rounded-lg grid place-items-center text-slate-500 bg-white border border-slate-200 size-11 shrink-0"
                onClick={() => setSelected(null)}
                aria-label="Close details"
              >
                <Icon name="x" size={19} />
              </button>
            </div>
            <div className="flex border-b border-b-slate-200 bg-white gap-12.5 py-3.75 px-6 max-sm:px-4.5">
              <div>
                <span className="block mb-1.5 text-slate-400 text-xs max-lg:text-xs">
                  Lifecycle status
                </span>
                <strong
                  className={[
                    "inline-flex w-fit items-center rounded-xl text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap gap-1.25 py-1 px-1.75",
                    String(selected.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("completed")
                      ? "text-emerald-800 bg-emerald-50"
                      : "",
                    String(selected.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("in-transit")
                      ? "text-blue-700 bg-blue-50"
                      : "",
                    String(selected.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("assigned")
                      ? "text-slate-500 bg-slate-100"
                      : "",
                    String(selected.status.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("planned")
                      ? "text-slate-500 bg-slate-100"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-state={selected.status.toLowerCase().replace(" ", "-")}
                >
                  <i
                    className={[
                      "w-1.25 h-1.25 rounded-full",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("completed")
                        ? "bg-emerald-700"
                        : "",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("in-transit")
                        ? "bg-blue-600"
                        : "",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("assigned")
                        ? "bg-slate-400"
                        : "",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("planned")
                        ? "bg-slate-400"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  {selected.status}
                </strong>
              </div>
              <div>
                <span className="block mb-1.5 text-slate-400 text-xs max-lg:text-xs">
                  Prediction
                </span>
                <strong
                  className={[
                    "inline-flex w-fit items-center rounded-xl text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap gap-1.25 py-1 px-1.75",
                    String(selected.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("on-track")
                      ? "text-emerald-700 bg-emerald-50"
                      : "",
                    String(selected.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("at-risk")
                      ? "text-amber-700 bg-amber-100"
                      : "",
                    String(selected.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("overdue")
                      ? "text-red-700 bg-red-50"
                      : "",
                    String(selected.risk.toLowerCase().replace(" ", "-"))
                      .split(" ")
                      .includes("not-assessed")
                      ? "text-slate-500 bg-slate-100"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-state={selected.risk.toLowerCase().replace(" ", "-")}
                >
                  {selected.risk}
                </strong>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-4.5 gap-x-6.25 border-b border-b-slate-200 bg-white py-4.5 px-6 max-sm:px-4.5">
              <div>
                <span className="block mb-1.25 text-slate-400 text-xs max-lg:text-xs">
                  Assigned vehicle
                </span>
                <strong className="block text-slate-700 text-xs max-lg:text-xs">
                  {selected.vehicle}
                </strong>
              </div>
              <div>
                <span className="block mb-1.25 text-slate-400 text-xs max-lg:text-xs">
                  Coordinator
                </span>
                <strong className="block text-slate-700 text-xs max-lg:text-xs">
                  {selected.assignee}
                </strong>
              </div>
              <div>
                <span className="block mb-1.25 text-slate-400 text-xs max-lg:text-xs">
                  Scheduled deadline
                </span>
                <strong className="block text-slate-700 text-xs max-lg:text-xs">
                  03 Dec · {selected.deadline}
                </strong>
              </div>
              <div>
                <span className="block mb-1.25 text-slate-400 text-xs max-lg:text-xs">
                  Last movement update
                </span>
                <strong className="block text-slate-700 text-xs max-lg:text-xs">
                  03 Dec · {selected.updated}
                </strong>
              </div>
            </div>
            {(selected.risk === "At risk" || selected.risk === "Overdue") && (
              <section className="rounded-lg bg-amber-50 border border-red-200 py-3.75 px-3.75 my-3.5 mx-3.5">
                <div className="flex items-center text-amber-700 gap-1.75">
                  <Icon name="spark" size={18} />
                  <strong className="flex-1 text-amber-900 text-xs max-lg:text-xs">
                    AI-assisted arrival prediction
                  </strong>
                  <span className="rounded-lg text-slate-500 bg-slate-100 text-xs max-lg:text-xs font-bold py-0.75 px-1.5">
                    ETA v0.1
                  </span>
                </div>
                <div className="mt-3.5 mb-2.5 flex items-center max-sm:flex-col gap-3.75 max-sm:gap-2 mx-0">
                  <p className="my-0 mx-0">
                    <span className="block mb-0.75 text-slate-500 text-xs max-lg:text-xs">
                      Scheduled
                    </span>
                    <strong className="block text-amber-900 font-bold text-base leading-normal font-sans not-italic">
                      {selected.deadline}
                    </strong>
                  </p>
                  <Icon className="text-red-400" name="chevron" />
                  <p className="my-0 mx-0">
                    <span className="block mb-0.75 text-slate-500 text-xs max-lg:text-xs">
                      Predicted
                    </span>
                    <strong className="block text-amber-900 font-bold text-base leading-normal font-sans not-italic">
                      {selected.eta}
                    </strong>
                  </p>
                  <p
                    className="my-0 mx-0 ml-auto pl-3.5 border-l border-l-red-200"
                    data-state="lateness"
                  >
                    <span className="block mb-0.75 text-slate-500 text-xs max-lg:text-xs">
                      Estimated lateness
                    </span>
                    <strong className="block text-red-600 font-bold text-base leading-normal font-sans not-italic">
                      {minutesLate(selected.deadline, selected.eta)} min
                    </strong>
                  </p>
                </div>
                <small className="block pt-2.25 border-t border-t-amber-100 text-slate-500 text-xs max-lg:text-xs">
                  prediction · No operational decision automatically applied
                </small>
              </section>
            )}
            <section className="mt-3.5 border-t border-t-slate-200 border-b border-b-slate-200 bg-white py-5 px-6 max-sm:px-4.5">
              <div className="flex justify-between">
                <h3 className="text-slate-700 font-bold text-xs leading-normal font-sans not-italic my-0 mx-0">
                  Recorded event history
                </h3>
                <span className="text-slate-400 text-xs max-lg:text-xs">
                  4 events
                </span>
              </div>
              <p className="mt-1.25 mb-5 text-slate-400 text-xs max-lg:text-xs mx-0">
                Generated from recorded operation events
              </p>
              <div className="">
                {deliveryEvents.map((event, index) => (
                  <article
                    className="min-h-15.5 relative flex gap-2"
                    key={event.time}
                  >
                    <div
                      className={[
                        "w-6.25 h-6.25 z-1 grid place-items-center rounded-full ring-1 ring-slate-300 border-3 border-white",
                        String(event.tone).split(" ").includes("amber")
                          ? "text-amber-700 bg-amber-100"
                          : "",
                        String(event.tone).split(" ").includes("blue")
                          ? "text-blue-600 bg-blue-50"
                          : "",
                        String(event.tone).split(" ").includes("slate")
                          ? "text-slate-500 bg-slate-100"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      data-state={event.tone}
                    >
                      {index === 0 ? (
                        <Icon name="trend" size={13} />
                      ) : (
                        <Icon name="check" size={13} />
                      )}
                    </div>
                    <time className="pt-1.5 text-slate-400 text-xs max-lg:text-xs">
                      {event.time}
                    </time>
                    <div className="pt-1">
                      <strong className="text-slate-600 text-xs max-lg:text-xs">
                        {event.title}
                      </strong>
                      <p className="mt-1 mb-0 text-slate-400 text-xs max-lg:text-xs leading-normal mx-0">
                        {event.detail}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <div className="pt-4 pb-6.25 flex bg-white gap-2 px-6 max-sm:px-4.5">
              <button
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-9.5 flex-1 rounded-lg flex items-center justify-center text-xs max-lg:text-xs font-bold text-slate-600 bg-white border border-slate-300 gap-1.5"
                onClick={() =>
                  navigate(
                    movementMapPath({
                      deliveryId: selected.id,
                      vehicleId: selected.vehicle,
                    }),
                  )
                }
              >
                <Icon name="map" size={16} />
                View on map
              </button>
              <button
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-9.5 flex-1 rounded-lg flex items-center justify-center text-xs max-lg:text-xs font-bold text-white bg-blue-600 border border-blue-600 gap-1.5"
                onClick={() => setSelected(null)}
              >
                Open full record
                <Icon name="chevron" size={15} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function riskRank(risk: Delivery["risk"]) {
  return { "Not assessed": 0, "On track": 1, "At risk": 2, Overdue: 3 }[risk];
}

function minutesLate(deadline: string, eta: string) {
  const [deadlineHour, deadlineMinute] = deadline.split(":").map(Number);
  const [etaHour, etaMinute] = eta.split(":").map(Number);
  return etaHour * 60 + etaMinute - (deadlineHour * 60 + deadlineMinute);
}

function KpiCard({
  label,
  value,
  note,
  icon,
  tone,
  badge,
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: string;
  badge?: string;
}) {
  return (
    <article className="min-w-0 min-h-30.5 relative flex rounded-lg bg-white shadow-sm border border-slate-200 max-xl:min-h-26.25 max-sm:flex-col gap-2.75 max-sm:gap-2 py-4 max-sm:py-3.5 px-3.25 max-sm:px-2.5">
      <div
        className={[
          "w-7.75 h-7.75 flex-none grid place-items-center rounded-lg",
          String(tone).split(" ").includes("blue")
            ? "text-blue-600 bg-blue-50"
            : "",
          String(tone).split(" ").includes("green")
            ? "text-emerald-700 bg-emerald-50"
            : "",
          String(tone).split(" ").includes("slate")
            ? "text-slate-500 bg-slate-100"
            : "",
          String(tone).split(" ").includes("amber")
            ? "text-amber-700 bg-amber-100"
            : "",
          String(tone).split(" ").includes("red")
            ? "text-red-600 bg-red-50"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-state={tone}
      >
        <Icon name={icon} size={19} />
      </div>
      <div className="min-w-0">
        <div className="text-slate-500 text-xs max-lg:text-xs font-semibold whitespace-nowrap text-ellipsis max-sm:whitespace-normal overflow-hidden">
          {label}
        </div>
        <div className="mt-1.75 flex flex-wrap items-center gap-1.5">
          <strong className="text-slate-800 font-bold text-2xl leading-none font-sans not-italic tracking-tight">
            {value}
          </strong>
          {badge && (
            <span
              className={[
                "rounded-lg text-xs max-lg:text-xs font-bold py-0.5 px-1.25",
                String(tone).split(" ").includes("green")
                  ? "text-emerald-700 bg-emerald-50"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-state={tone}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="mt-2 text-slate-400 text-xs max-lg:text-xs whitespace-nowrap max-sm:whitespace-normal max-sm:leading-snug">
          {note}
        </div>
      </div>
      <button
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 grid place-items-center text-slate-500 bg-transparent w-4.5 h-4.5 absolute right-1.75 top-2 opacity-70 border-0 max-sm:hidden"
        aria-label={`More about ${label}`}
      >
        <Icon name="more" size={18} />
      </button>
    </article>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = usePermissions();
  const visibleNav = applicationNavigation.filter((item) =>
    canAccess(item.path),
  );
  const activeNav =
    visibleNav.find((item) => item.path === location.pathname)?.label ??
    "Overview";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  useEffect(() => {
    const dismissNotifications = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("keydown", dismissNotifications);
    return () => {
      document.removeEventListener("keydown", dismissNotifications);
    };
  }, []);
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const {
    currentUser,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useData();
  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        `${alert.id} ${alert.title} ${alert.type}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  const markReviewed = (id: string) => {
    setReviewed((current) =>
      current.includes(id) ? current : [...current, id],
    );
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        alertCount={alerts.length}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 ml-62 max-lg:w-full max-lg:ml-0 min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 min-w-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
          <button
            type="button"
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 hidden size-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 max-lg:grid"
            aria-controls="primary-navigation"
            aria-expanded={mobileOpen}
            aria-label="Open navigation"
            onClick={() => {
              setNotificationsOpen(false);
              setMobileOpen(true);
            }}
          >
            <Icon name="menu" />
          </button>
          <div className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-slate-400 sm:flex">
            <span>Operations</span>
            <Icon name="chevron" size={14} />
            <strong className="truncate font-semibold text-slate-600">
              {activeNav}
            </strong>
          </div>
          <div className="relative ml-auto flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400 sm:w-56 sm:flex-none">
              <Icon name="search" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deliveries"
                aria-label="Search deliveries"
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 min-w-0 w-full flex-1 border-0 bg-transparent text-base text-slate-800 outline-none sm:text-sm"
              />
              <kbd className="rounded-sm border border-slate-200 bg-white px-1 py-0.5 text-xs font-normal text-slate-400 hidden lg:block">
                ⌘ K
              </kbd>
            </label>
            <button
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 relative grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500"
              aria-label={`${unreadNotifications} unread notifications`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <Icon name="bell" size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full border border-white bg-red-600" />
              )}
            </button>
            {notificationsOpen && (
              <div className="pointer-events-none fixed inset-x-3 bottom-4 top-20 z-40 flex items-start justify-end">
                <div
                  role="region"
                  aria-label="Notifications"
                  className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-xl sm:w-80"
                >
                  <div className="min-h-14.5 flex items-center justify-between border-b border-b-slate-200 py-3 px-4">
                    <div>
                      <strong className="block text-slate-900 text-sm">
                        Notifications
                      </strong>
                      <span className="block mt-0.5 text-slate-500 text-xs max-lg:text-xs">
                        {unreadNotifications} unread
                      </span>
                    </div>
                    <button
                      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 text-blue-600 bg-transparent text-xs max-lg:text-xs font-semibold border-0"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="overflow-y-auto">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        className={[
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 w-full min-h-20 flex items-start border-t-0 border-r-0 border-b border-b-slate-100 border-l-0 text-inherit text-left hover:bg-slate-50 gap-2.5 py-3 px-3.5",
                          String(item.read ? "" : "unread")
                            .split(" ")
                            .includes("unread")
                            ? "bg-slate-50"
                            : "bg-white",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-state={item.read ? "" : "unread"}
                        onClick={() => {
                          markNotificationRead(item.id);
                          setNotificationsOpen(false);
                          navigate(buildRoute(item.destination));
                        }}
                      >
                        <i
                          className={[
                            "w-1.75 h-1.75 mt-1 rounded-full bg-slate-400",
                            String(item.severity).split(" ").includes("warning")
                              ? "bg-amber-500"
                              : "",
                            String(item.severity)
                              .split(" ")
                              .includes("critical")
                              ? "bg-red-500"
                              : "",
                            String(item.severity).split(" ").includes("info")
                              ? "bg-blue-500"
                              : "",
                            String(item.severity).split(" ").includes("success")
                              ? "bg-emerald-500"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          data-state={item.severity}
                        />
                        <span>
                          <strong className="block text-slate-800 text-xs">
                            {item.title}
                          </strong>
                          <small className="block mt-1 text-slate-600 text-xs max-lg:text-xs leading-snug">
                            {item.message}
                          </small>
                          <em className="block mt-1 text-slate-400 text-xs max-lg:text-xs not-italic">
                            {item.timestamp}
                          </em>
                        </span>
                        <Icon
                          className="mt-5 text-slate-400"
                          name="chevron"
                          size={14}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {activeNav === "Overview" &&
        currentUser.role !== "Operations Coordinator" ? (
          <RoleOverviewPage />
        ) : activeNav === "Overview" ? (
          <div className="max-w-360 pt-7.75 pb-6.5 max-sm:py-5.75 px-8 max-sm:px-4 my-0 mx-auto">
            <div className="flex justify-between items-end max-sm:items-stretch max-sm:flex-col gap-6">
              <div>
                <div className="flex items-center text-slate-400 text-xs max-lg:text-xs font-bold tracking-wide gap-2">
                  <span className="text-blue-600">OPERATIONS</span>
                  <i className="w-0.75 h-0.75 rounded-full bg-slate-400" />
                  THURSDAY, 3 DECEMBER 2026
                </div>
                <h1 className="mt-2 mb-1 text-3xl font-bold tracking-tight">
                  Operations overview
                </h1>
                <p className="text-slate-500 text-xs my-0 mx-0">
                  Monitor delivery progress, movement telemetry and operational
                  risks.
                </p>
              </div>
            </div>

            <div className="min-h-9.5 mt-6 mb-3.75 flex items-center justify-between rounded-lg bg-teal-50 text-slate-600 text-xs max-lg:text-xs border border-emerald-100 py-2 px-3.25 mx-0">
              <div className="flex items-center gap-2">
                <span className="w-1.75 h-1.75 rounded-full bg-emerald-600" />
                <strong className="text-teal-800">
                  All systems operational
                </strong>
                <span className="pl-2 border-l border-l-slate-300 max-sm:hidden">
                  Data refreshed just now
                </span>
              </div>
              <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 text-slate-500 bg-transparent text-xs max-lg:text-xs border-0 max-sm:hidden">
                Refreshes every 15 sec
              </button>
            </div>

            <section
              className="grid grid-cols-6 max-xl:grid-cols-3 max-sm:grid-cols-2 gap-2.75"
              aria-label="Key metrics"
            >
              <KpiCard
                label="Total deliveries"
                value="75"
                note="All scheduled deliveries"
                icon="box"
                tone="blue"
              />
              <KpiCard
                label="Completed"
                value="42"
                note="56% of total"
                icon="check"
                tone="green"
                badge="+8 today"
              />
              <KpiCard
                label="In transit"
                value="25"
                note="Across 8 active vehicles"
                icon="truck"
                tone="blue"
              />
              <KpiCard
                label="Not dispatched"
                value="8"
                note="Awaiting departure"
                icon="clock"
                tone="slate"
              />
              <KpiCard
                label="At risk"
                value="6"
                note="Prediction exceeds deadline"
                icon="trend"
                tone="amber"
              />
              <KpiCard
                label="Overdue"
                value="4"
                note="Deadline has passed"
                icon="alert"
                tone="red"
              />
            </section>

            <div className="mt-3.25 grid grid-cols-2 max-xl:grid-cols-1 gap-3.25">
              <section className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="min-h-16.25 flex items-center justify-between border-b border-b-slate-200 py-3.75 px-4.25">
                  <div>
                    <h2 className="text-slate-800 font-bold text-sm leading-normal font-sans not-italic tracking-tight my-0 mx-0">
                      Delivery progress
                    </h2>
                    <p className="mt-1 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                      Completion by operational district
                    </p>
                  </div>
                  <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 flex items-center text-blue-600 bg-transparent text-xs max-lg:text-xs font-semibold border-0 gap-0.75">
                    View deliveries <Icon name="chevron" size={15} />
                  </button>
                </div>
                <div className="min-h-49.75 pt-6.25 pb-5.25 flex items-center max-sm:flex-col gap-9.5 max-sm:gap-6 max-sm:py-5 px-6 max-sm:px-5">
                  <div
                    className="w-32.5 h-32.5 flex-none relative grid place-items-center rounded-full bg-emerald-50 border-8 border-emerald-200"
                    aria-label="56 percent completed"
                  >
                    <div className="z-1 text-center">
                      <strong className="block text-slate-800 font-bold text-2xl leading-normal font-sans not-italic tracking-tight">
                        56%
                      </strong>
                      <span className="block mt-px text-slate-400 text-xs max-lg:text-xs">
                        completed
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 max-sm:w-full">
                    {areas.map((area) => {
                      const percentage = Math.round(
                        (area.done / area.total) * 100,
                      );
                      return (
                        <div
                          className="mt-3.75"
                          data-slot="progress-item"
                          key={area.name}
                        >
                          <div className="mb-1.5 flex justify-between text-slate-600 text-xs max-lg:text-xs">
                            <span>{area.name}</span>
                            <strong className="text-slate-700 text-xs max-lg:text-xs">
                              {area.done}{" "}
                              <em className="text-slate-400 not-italic font-normal">
                                / {area.total}
                              </em>
                            </strong>
                          </div>
                          <div className="h-1 rounded-sm bg-slate-200 overflow-hidden">
                            <progress
                              aria-label={`Delivery completion for ${area.name}`}
                              value={percentage}
                              max={100}
                              className="h-2 w-full min-w-0 flex-1 accent-blue-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="h-10 flex items-center border-t border-t-slate-200 text-slate-500 text-xs max-lg:text-xs gap-5.5 max-sm:gap-2.5 py-0 max-sm:py-0 px-5 max-sm:px-3">
                  <div>
                    <span
                      className="w-1.5 h-1.5 mr-1.25 inline-block rounded-full bg-emerald-700"
                      data-state="green"
                    />
                    42 completed
                  </div>
                  <div>
                    <span
                      className="w-1.5 h-1.5 mr-1.25 inline-block rounded-full bg-blue-600"
                      data-state="blue"
                    />
                    25 in transit
                  </div>
                  <div>
                    <span
                      className="w-1.5 h-1.5 mr-1.25 inline-block rounded-full bg-slate-400"
                      data-state="slate"
                    />
                    8 not dispatched
                  </div>
                </div>
              </section>

              <section className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="min-h-16.25 flex items-center justify-between border-b border-b-slate-200 py-3.75 px-4.25">
                  <div>
                    <h2 className="text-slate-800 font-bold text-sm leading-normal font-sans not-italic tracking-tight my-0 mx-0">
                      Attention required
                    </h2>
                    <p className="mt-1 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                      {alerts.length - reviewed.length} unresolved alerts
                    </p>
                  </div>
                  <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 flex items-center text-blue-600 bg-transparent text-xs max-lg:text-xs font-semibold border-0 gap-0.75">
                    View all <Icon name="chevron" size={15} />
                  </button>
                </div>
                <div className="min-h-59.75">
                  {filteredAlerts.length ? (
                    filteredAlerts.map((alert) => (
                      <article
                        className={[
                          "min-h-20 flex items-start border-b border-b-slate-100 transition-all duration-200 last:border-b-0 hover:bg-slate-50 gap-2.75 py-3.25 px-4",
                          String(reviewed.includes(alert.id) ? "reviewed" : "")
                            .split(" ")
                            .includes("reviewed")
                            ? "opacity-58"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-state={
                          reviewed.includes(alert.id) ? "reviewed" : ""
                        }
                        key={alert.id}
                      >
                        <div
                          className={[
                            "w-7.75 h-7.75 flex-none grid place-items-center rounded-lg",
                            String(alert.tone).split(" ").includes("amber")
                              ? "text-amber-700 bg-amber-100"
                              : "",
                            String(alert.tone).split(" ").includes("purple")
                              ? "text-slate-500 bg-slate-100"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          data-state={alert.tone}
                        >
                          <Icon
                            name={
                              reviewed.includes(alert.id) ? "check" : alert.icon
                            }
                            size={18}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-700 text-xs max-lg:text-xs">
                              Delivery {alert.id}
                            </strong>
                            <span className="text-slate-400 text-xs max-lg:text-xs">
                              {alert.time}
                            </span>
                          </div>
                          <p className="mt-1 mb-0.75 text-slate-600 text-xs max-lg:text-xs whitespace-nowrap text-ellipsis max-sm:max-w-46.25 mx-0 overflow-hidden">
                            {reviewed.includes(alert.id)
                              ? "Marked as reviewed"
                              : alert.title}
                          </p>
                          <small className="text-slate-400 text-xs max-lg:text-xs">
                            {alert.detail}
                          </small>
                        </div>
                        <button
                          className={[
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 mt-0.75 rounded-xl text-xs max-lg:text-xs font-bold border-0 py-1 px-1.75",
                            String(alert.tone).split(" ").includes("amber")
                              ? "text-amber-700 bg-amber-100"
                              : "",
                            String(alert.tone).split(" ").includes("purple")
                              ? "text-slate-500 bg-slate-100"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          data-state={alert.tone}
                          onClick={() => markReviewed(alert.id)}
                        >
                          {reviewed.includes(alert.id)
                            ? "Reviewed"
                            : alert.type}
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="min-h-59.5 flex flex-col items-center justify-center text-slate-400">
                      <Icon name="search" />
                      <strong className="mt-2.25 text-slate-600 text-xs max-lg:text-xs">
                        No matching alerts
                      </strong>
                      <span className="mt-0.75 text-xs max-lg:text-xs">
                        Try another delivery ID or keyword.
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="mt-3.25 grid grid-cols-2 max-xl:grid-cols-1 gap-3.25">
              <section className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="min-h-16.25 flex items-center justify-between border-b border-b-slate-200 py-3.75 px-4.25">
                  <div>
                    <h2 className="text-slate-800 font-bold text-sm leading-normal font-sans not-italic tracking-tight my-0 mx-0">
                      Movement telemetry
                    </h2>
                    <p className="mt-1 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                      Coverage across active journeys
                    </p>
                  </div>
                  <button
                    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 grid place-items-center text-slate-500 bg-transparent w-7 h-7 rounded-md border border-slate-200"
                    aria-label="Expand map"
                  >
                    <Icon name="expand" size={17} />
                  </button>
                </div>
                <div className="h-37.5 relative bg-slate-50 overflow-hidden">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 680 200"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      className="fill-none stroke-slate-300 stroke-3 stroke-6"
                      data-state="muted"
                      d="M-20 45C80 15 105 75 180 65s125-62 213-24 112 92 305 26"
                    />
                    <path
                      className="fill-none stroke-slate-300 stroke-3"
                      d="M38 166c78-12 82-70 155-68s101 58 166 42 102-95 196-79 91 84 145 76"
                    />
                    <path
                      className="fill-none stroke-slate-300 stroke-3 stroke-6"
                      data-state="muted"
                      d="M118 210c15-68 74-83 129-117s114-76 200-63 100 78 154 185"
                    />
                  </svg>
                  <span
                    className="w-6.25 h-6.25 absolute grid place-items-center rounded-full text-white shadow-md left-22/100 top-47/100 border-2 border-white bg-blue-600"
                    data-state="fresh"
                  >
                    <Icon className="w-full h-full" name="truck" size={14} />
                  </span>
                  <span
                    className="w-6.25 h-6.25 absolute grid place-items-center rounded-full text-white shadow-md left-51/100 top-62/100 border-2 border-white bg-blue-600"
                    data-state="fresh"
                  >
                    <Icon className="w-full h-full" name="truck" size={14} />
                  </span>
                  <span
                    className="w-6.25 h-6.25 absolute grid place-items-center rounded-full text-white shadow-md right-17/100 top-27/100 border-2 border-white bg-amber-700"
                    data-state="stale"
                  >
                    <Icon className="w-full h-full" name="truck" size={14} />
                  </span>
                  <span
                    className="w-6.25 h-6.25 absolute grid place-items-center rounded-full text-white shadow-md right-31/100 top-18/100 border-2 border-white bg-blue-600"
                    data-state="fresh"
                  >
                    <Icon className="w-full h-full" name="truck" size={14} />
                  </span>
                  <div className="absolute left-2.5 bottom-2 rounded-sm text-slate-500 bg-white/85 text-xs max-lg:text-xs font-bold tracking-wide border border-slate-300 py-1 px-1.75">
                    VEHICLE POSITIONS
                  </div>
                </div>
                <div className="min-h-16.25 flex items-center border-t border-t-slate-200 max-sm:flex-wrap gap-6 max-sm:gap-4 py-2.5 px-4">
                  <div>
                    <strong className="block text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
                      8
                    </strong>
                    <span className="block mt-0.5 text-slate-400 text-xs max-lg:text-xs">
                      Active vehicles
                    </span>
                  </div>
                  <div>
                    <strong className="block text-slate-700 font-bold text-sm leading-normal font-sans not-italic">
                      7
                    </strong>
                    <span className="block mt-0.5 text-slate-400 text-xs max-lg:text-xs">
                      Fresh signals
                    </span>
                  </div>
                  <div data-state="warning">
                    <strong className="block text-amber-700 font-bold text-sm leading-normal font-sans not-italic">
                      1
                    </strong>
                    <span className="block mt-0.5 text-slate-400 text-xs max-lg:text-xs">
                      Stale signal
                    </span>
                  </div>
                  <div
                    className="min-w-37.5 ml-auto max-sm:w-full max-sm:my-0 max-sm:mx-0"
                    data-slot="coverage"
                  >
                    <span className="flex mt-0.5 text-slate-500 text-xs max-lg:text-xs justify-between">
                      <b className="text-emerald-700">88%</b> telemetry coverage
                    </span>
                    <div className="h-1 mt-1.75 rounded-sm bg-slate-200 overflow-hidden">
                      <i className="w-88/100 h-full block bg-emerald-700" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="min-h-16.25 flex items-center justify-between border-b border-b-slate-200 py-3.75 px-4.25">
                  <div>
                    <h2 className="text-slate-800 font-bold text-sm leading-normal font-sans not-italic tracking-tight my-0 mx-0">
                      Operational outlook
                    </h2>
                    <p className="mt-1 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                      AI-assisted forecast · next 3 hours
                    </p>
                  </div>
                  <div className="flex items-center rounded-xl text-slate-500 bg-slate-100 text-xs max-lg:text-xs font-bold gap-1 py-1 px-1.75">
                    <Icon name="spark" size={14} /> ETA v0.1
                  </div>
                </div>
                <div className="mt-4 mb-3.25 flex items-center rounded-lg bg-amber-50 gap-2.5 py-3 px-3 mx-4.25">
                  <div className="w-8.5 h-8.5 grid place-items-center rounded-lg text-amber-700 bg-amber-100">
                    <Icon name="trend" size={22} />
                  </div>
                  <div className="flex-1">
                    <strong className="block text-amber-900 text-xs max-lg:text-xs">
                      6 deliveries
                    </strong>
                    <span className="block mt-0.5 text-amber-700 text-xs max-lg:text-xs">
                      predicted at risk of delay
                    </span>
                  </div>
                  <b className="text-red-600 text-xs max-lg:text-xs">+2</b>
                </div>
                <div className="py-0 px-4.5">
                  <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-2 my-2.25 mx-0">
                    <span>High risk</span>
                    <div className="h-1.25 rounded-sm bg-slate-100 overflow-hidden">
                      <i className="h-full block rounded-sm bg-amber-700 w-17/100" />
                    </div>
                    <strong className="text-slate-600 text-xs max-lg:text-xs text-right">
                      1
                    </strong>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-2 my-2.25 mx-0">
                    <span>Medium risk</span>
                    <div className="h-1.25 rounded-sm bg-slate-100 overflow-hidden">
                      <i className="h-full block rounded-sm bg-amber-700 w-50/100" />
                    </div>
                    <strong className="text-slate-600 text-xs max-lg:text-xs text-right">
                      3
                    </strong>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-2 my-2.25 mx-0">
                    <span>Low risk</span>
                    <div className="h-1.25 rounded-sm bg-slate-100 overflow-hidden">
                      <i className="h-full block rounded-sm bg-amber-700 w-34/100" />
                    </div>
                    <strong className="text-slate-600 text-xs max-lg:text-xs text-right">
                      2
                    </strong>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center border-t border-t-slate-200 text-slate-400 text-xs max-lg:text-xs leading-normal gap-1.75 py-2.5 px-4.25">
                  <Icon
                    className="flex-none text-slate-500"
                    name="spark"
                    size={16}
                  />
                  <span>
                    Predictions require review before applying operational
                    changes.
                  </span>
                </div>
              </section>
            </div>
          </div>
        ) : activeNav === "Deliveries" ? (
          <DeliveriesPage externalQuery={query} />
        ) : activeNav === "Movement Map" ? (
          <Suspense
            fallback={
              <div className="min-h-dvh flex flex-col items-center justify-center text-slate-500">
                <span className="w-7.5 h-7.5 mb-3.5 border-t-blue-600 border-r-slate-200 border-b-slate-200 border-l-slate-200 rounded-full animate-spin border-3" />
                <strong className="text-slate-700 text-xs max-lg:text-xs">
                  Loading Nigeria movement map
                </strong>
                <p className="mt-1 mb-0 text-xs max-lg:text-xs mx-0">
                  Preparing vehicle telemetry…
                </p>
              </div>
            }
          >
            <MovementMap />
          </Suspense>
        ) : activeNav === "Intelligence" ? (
          <Suspense
            fallback={
              <div className="min-h-dvh flex flex-col items-center justify-center text-slate-500">
                <span className="w-7.5 h-7.5 mb-3.5 border-t-blue-600 border-r-slate-200 border-b-slate-200 border-l-slate-200 rounded-full animate-spin border-3" />
                <strong className="text-slate-700 text-xs max-lg:text-xs">
                  Loading intelligence workspace
                </strong>
                <p className="mt-1 mb-0 text-xs max-lg:text-xs mx-0">
                  Preparing the alert queue…
                </p>
              </div>
            }
          >
            <Intelligence />
          </Suspense>
        ) : activeNav === "Scenarios" ? (
          <ModuleLoader label="scenario comparison">
            <ScenariosPage />
          </ModuleLoader>
        ) : activeNav === "Team Access" ? (
          <ModuleLoader label="team access">
            <TeamPage />
          </ModuleLoader>
        ) : activeNav === "Settings" ? (
          <ModuleLoader label="settings">
            <SettingsPage
              onNavigate={(page) =>
                navigate(
                  buildRoute(
                    applicationNavigation.find((item) => item.label === page)
                      ?.path ?? ROUTES.DASHBOARD,
                  ),
                )
              }
            />
          </ModuleLoader>
        ) : activeNav === "Operations" ? (
          <ModuleLoader label="operations">
            <OperationsPage />
          </ModuleLoader>
        ) : activeNav === "Vehicles & Resources" ? (
          <ModuleLoader label="resources">
            <ResourcesPage />
          </ModuleLoader>
        ) : activeNav === "Performance Analytics" ? (
          <ModuleLoader label="performance analytics">
            <AnalyticsPage />
          </ModuleLoader>
        ) : activeNav === "Audit History" ? (
          <ModuleLoader label="audit history">
            <AuditPage />
          </ModuleLoader>
        ) : (
          <div className="max-w-360 pt-7.75 pb-6.5 min-h-dvh flex flex-col items-center justify-center text-center max-sm:py-5.75 px-8 max-sm:px-4 my-0 mx-auto">
            <div className="w-14.5 h-14.5 mb-4.25 grid place-items-center rounded-2xl text-blue-600 bg-blue-50">
              <Icon name="dashboard" size={28} />
            </div>
            <span className="text-blue-600 text-xs max-lg:text-xs font-bold tracking-widest">
              NEXT WORKSPACE
            </span>
            <h1 className="mt-2 mb-1 text-3xl font-bold tracking-tight">
              {activeNav}
            </h1>
            <p className="mt-1 mb-4.5 text-slate-500 text-xs max-lg:text-xs mx-0">
              This section is queued for the next implementation milestone.
            </p>
            <button
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-9.5 rounded-lg text-white bg-blue-600 text-xs max-lg:text-xs font-bold border-0 py-0 px-3.75"
              onClick={() => navigate(buildRoute(ROUTES.DELIVERIES))}
            >
              Return to deliveries
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ModuleLoader({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex flex-col items-center justify-center text-slate-500">
          <span className="w-7.5 h-7.5 mb-3.5 border-t-blue-600 border-r-slate-200 border-b-slate-200 border-l-slate-200 rounded-full animate-spin border-3" />
          <strong className="text-slate-700 text-xs max-lg:text-xs">
            Loading {label}
          </strong>
          <p className="mt-1 mb-0 text-xs max-lg:text-xs mx-0">
            Preparing shared records…
          </p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default App;
