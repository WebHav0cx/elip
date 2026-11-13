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
  LogOut,
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
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router";
import { useData } from "./data";
import { useAuth } from "./features/auth/hooks/useAuth";
import { RoleOverviewPage } from "./features/dashboards/pages/RoleOverviewPage";
import { usePermissions } from "./hooks/usePermissions";

const MovementMap = lazy(() => import("./features/movement/pages/MovementMap"));
const Intelligence = lazy(() => import("./features/intelligence/pages/Intelligence"));
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

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const nav = [
  { label: "Overview", path: ROUTES.DASHBOARD, icon: "dashboard" as IconName },
  { label: "Operations", path: ROUTES.OPERATIONS, icon: "box" as IconName },
  { label: "Deliveries", path: ROUTES.DELIVERIES, icon: "delivery" as IconName, count: 75 },
  { label: "Vehicles & Resources", path: ROUTES.RESOURCES, icon: "truck" as IconName },
  { label: "Movement Map", path: ROUTES.MOVEMENT_MAP, icon: "map" as IconName },
  { label: "Intelligence", path: ROUTES.INTELLIGENCE, icon: "spark" as IconName, count: 6 },
  { label: "Scenarios", path: ROUTES.SCENARIOS, icon: "route" as IconName },
  { label: "Performance Analytics", path: ROUTES.ANALYTICS, icon: "trend" as IconName },
];

const manageNav = [
  { label: "Team Access", path: ROUTES.TEAM, icon: "users" as IconName },
  { label: "Audit History", path: ROUTES.AUDIT, icon: "clock" as IconName },
  { label: "Settings", path: ROUTES.SETTINGS, icon: "settings" as IconName },
];
const allNav = [...nav, ...manageNav];

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
      .filter((delivery) => status === "All statuses" || delivery.status === status)
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
    <div className={`
  max-w-385! pt-7.75! pr-8! pb-6.5! pl-8! mt-0! mr-auto! mb-0! ml-auto!
  max-phone:pt-5.75! max-phone:pr-4! max-phone:pb-5.75! max-phone:pl-4!
`}>
      <div className={`
  flex! justify-between! items-end! gap-y-6! gap-x-6! [&_p]:mt-0! [&_p]:mr-0! [&_p]:mb-0!
  [&_p]:ml-0! [&_p]:text-slate-500! [&_p]:text-xs! max-phone:items-stretch! max-phone:flex-col!
`}>
        <div>
          <div className={`
  flex! items-center! gap-y-2! gap-x-2! text-slate-400! text-micro! max-lg:text-xs! font-bold! tracking-section!
  [&_span]:text-blue-600! [&_i]:w-0.75! [&_i]:h-0.75! [&_i]:rounded-full! [&_i]:bg-slate-400!
`}>
            <span>OPERATIONS</span>
            <i />
            75 SCHEDULED DELIVERIES
          </div>
          <h1>Deliveries</h1>
          <p>Inspect lifecycle status, delay risk and recorded delivery events.</p>
        </div>
        <button className={`
  h-9.5! pt-0! pr-3.75! pb-0! pl-3.75! rounded-control! text-slate-700! bg-white!
  text-caption! max-lg:text-xs! font-semibold! border! border-solid! border-slate-300! [&:hover]:bg-slate-50!
  [&:hover]:border-slate-400!
`}>Export report</button>
      </div>

      <div className={`
  min-h-13.5! mt-6! mr-0! mb-3.25! ml-0! pt-0! pr-4.5! pb-0! pl-4.5! flex!
  items-center! gap-y-7! gap-x-7! rounded-lg! bg-white! border! border-solid! border-slate-200!
  [&_>_div]:flex! [&_>_div]:items-center! [&_>_div]:gap-y-1.5! [&_>_div]:gap-x-1.5!
  [&_>_div]:text-slate-500! [&_>_div]:text-micro! max-lg:[&_>_div]:text-xs! [&_strong]:text-slate-700! [&_strong]:font-bold!
  [&_strong]:text-sm! [&_strong]:leading-default! [&_strong]:font-sans!
  [&_strong]:not-italic! [&_small]:ml-auto! [&_small]:text-slate-400! [&_small]:text-label! max-lg:[&_small]:text-xs!
  max-phone:pt-3.25! max-phone:pr-3.25! max-phone:pb-3.25! max-phone:pl-3.25!
  max-phone:flex-wrap! max-phone:gap-y-3! max-phone:gap-x-4.5! max-phone:[&_small]:w-full!
  max-phone:[&_small]:mt-0! max-phone:[&_small]:mr-0! max-phone:[&_small]:mb-0!
  max-phone:[&_small]:ml-0!
`}>
        <div>
          <span className={`
  w-1.75! h-1.75! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600!
  data-[state~=slate]:bg-slate-400! data-[state~=amber]:bg-amber-700! data-[state~=red]:bg-red-600!
`} data-state="green" />
          <strong>42</strong>
          <span>Completed</span>
        </div>
        <div>
          <span className={`
  w-1.75! h-1.75! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600!
  data-[state~=slate]:bg-slate-400! data-[state~=amber]:bg-amber-700! data-[state~=red]:bg-red-600!
`} data-state="blue" />
          <strong>25</strong>
          <span>In transit</span>
        </div>
        <div>
          <span className={`
  w-1.75! h-1.75! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600!
  data-[state~=slate]:bg-slate-400! data-[state~=amber]:bg-amber-700! data-[state~=red]:bg-red-600!
`} data-state="slate" />
          <strong>8</strong>
          <span>Not dispatched</span>
        </div>
        <div>
          <span className={`
  w-1.75! h-1.75! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600!
  data-[state~=slate]:bg-slate-400! data-[state~=amber]:bg-amber-700! data-[state~=red]:bg-red-600!
`} data-state="amber" />
          <strong>6</strong>
          <span>At risk</span>
        </div>
        <div>
          <span className={`
  w-1.75! h-1.75! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600!
  data-[state~=slate]:bg-slate-400! data-[state~=amber]:bg-amber-700! data-[state~=red]:bg-red-600!
`} data-state="red" />
          <strong>4</strong>
          <span>Overdue</span>
        </div>
        <small>Risk indicators overlap lifecycle status</small>
      </div>

      <section className={`
  rounded-lg! bg-white!
  shadow-subtle! overflow-x-visible!
  overflow-y-visible! border! border-solid! border-slate-200!
`}>
        <div className={`
  min-h-16.25! pt-3.25! pr-3.75! pb-3.25! pl-3.75! flex! items-center!
  justify-between! gap-y-4! gap-x-4! border-b! border-solid!
  border-b-slate-200! max-overview-compact:items-stretch! max-overview-compact:flex-col!
`}>
          <label className={`
  w-summary! h-9.25! pt-0! pr-2.75! pb-0! pl-2.75! flex! items-center! gap-y-2!
  gap-x-2! rounded-control! text-slate-400! bg-slate-50! border! border-solid! border-slate-300!
  focus-within:shadow-focus-soft!
  focus-within:border-blue-400! [&_input]:w-full! [&_input]:outline-none! [&_input]:text-slate-800!
  [&_input]:bg-transparent! [&_input]:text-caption! max-lg:[&_input]:text-base! [&_input]:border-0! 
  [&_input]:border-current! max-overview-compact:w-full!
`}>
            <Icon name="search" size={17} />
            <input
              value={localQuery}
              onChange={(event) => setLocalQuery(event.target.value)}
              placeholder="Search ID, destination or vehicle…"
            />
          </label>
          <div className={`
  flex! items-center! gap-y-1.75! gap-x-1.75! [&_label]:h-9.25! [&_label]:pt-0!
  [&_label]:pr-2! [&_label]:pb-0! [&_label]:pl-2! [&_label]:flex! [&_label]:items-center!
  [&_label]:gap-y-0.75! [&_label]:gap-x-0.75! [&_label]:rounded-control! [&_label]:text-slate-500!
  [&_label]:bg-white! [&_label]:border! [&_label]:border-solid! [&_label]:border-slate-300!
  [&_select]:outline-none! [&_select]:text-slate-600! [&_select]:bg-transparent! [&_select]:text-micro! max-lg:[&_select]:text-base!
  [&_select]:font-medium! [&_select]:border-0! 
  [&_select]:border-current! **:data-[slot~=sort-select]:ml-1.25! **:data-[slot~=sort-select]:bg-slate-100!
  **:data-[slot~=sort-select]:border-0!  **:data-[slot~=sort-select]:border-current!
  max-overview-compact:flex-wrap! max-phone:grid! max-phone:grid-cols-1! max-phone:[&_label]:flex-1! max-phone:[&_label]:min-w-0! max-phone:[&_select]:min-w-0! max-phone:[&_select]:w-full! max-phone:**:data-[slot~=sort-select]:w-full!
  max-phone:**:data-[slot~=sort-select]:mt-0! max-phone:**:data-[slot~=sort-select]:mr-0! max-phone:**:data-[slot~=sort-select]:mb-0!
  max-phone:**:data-[slot~=sort-select]:ml-0!
`}>
            <label>
              <Icon name="filter" size={14} />
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>All statuses</option>
                <option>Completed</option>
                <option>In transit</option>
                <option>Assigned</option>
                <option>Planned</option>
              </select>
            </label>
            <label>
              <select value={risk} onChange={(event) => setRisk(event.target.value)}>
                <option>All risks</option>
                <option>On track</option>
                <option>At risk</option>
                <option>Overdue</option>
                <option>Not assessed</option>
              </select>
            </label>
            <label className={"[&_span]:text-slate-400! [&_span]:text-label! max-lg:[&_span]:text-xs!"} data-slot="sort-select">
              <span>Sort:</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>Deadline</option>
                <option>Predicted lateness</option>
                <option>Last update</option>
              </select>
            </label>
          </div>
        </div>
        <div className="grid gap-3 p-3 md:hidden" aria-label="Delivery list">
          {rows.map(delivery => <button key={delivery.id} type="button" aria-label={`View delivery ${delivery.id}`} onClick={() => setSelected(delivery)} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-blue-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-slate-900">{delivery.id}</strong>
              <span className={`
  w-fit! pt-1! pr-1.75! pb-1! pl-1.75! inline-flex! items-center! gap-y-1.25!
  gap-x-1.25! rounded-card! text-fine! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! [&_i]:w-1.25!
  [&_i]:h-1.25! [&_i]:rounded-full! data-[state~=completed]:text-emerald-800! data-[state~=completed]:bg-emerald-50!
  [&[data-state~=completed]_i]:bg-emerald-700! data-[state~=in-transit]:text-blue-700! data-[state~=in-transit]:bg-blue-50!
  [&[data-state~=in-transit]_i]:bg-blue-600! data-[state~=assigned]:text-slate-500! data-[state~=assigned]:bg-slate-100!
  data-[state~=planned]:text-slate-500! data-[state~=planned]:bg-slate-100! [&[data-state~=assigned]_i]:bg-slate-400!
  [&[data-state~=planned]_i]:bg-slate-400!
`} data-state={delivery.status.toLowerCase().replace(" ", "-")}>{delivery.status}</span>
            </div>
            <span className="mt-2 block text-sm text-slate-700">{delivery.destination} · {delivery.vehicle}</span>
            <span className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Deadline {delivery.deadline} · ETA {delivery.eta}</span>
              <span className={`
  w-fit! pt-1! pr-1.75! pb-1! pl-1.75! inline-flex! items-center! gap-y-1.25!
  gap-x-1.25! rounded-card! text-fine! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap!
  data-[state~=on-track]:text-emerald-700! data-[state~=on-track]:bg-emerald-50! data-[state~=at-risk]:text-amber-700!
  data-[state~=at-risk]:bg-amber-100! data-[state~=overdue]:text-red-700! data-[state~=overdue]:bg-red-50!
  data-[state~=not-assessed]:text-slate-500! data-[state~=not-assessed]:bg-slate-100!
`} data-state={delivery.risk.toLowerCase().replace(" ", "-")}>{delivery.risk}</span>
            </span>
          </button>)}
          {!rows.length && <p className="p-5 text-center text-sm text-slate-500">No deliveries found. Change or clear the search and filters.</p>}
        </div>
        <div className={"hidden! min-h-118.75! overflow-x-auto! md:block!"}>
          <table className={`
  w-full! border-collapse! text-slate-600! text-micro! max-lg:text-xs! [&_th]:h-10! [&_th]:pt-0!
  [&_th]:pr-3.25! [&_th]:pb-0! [&_th]:pl-3.25! [&_th]:text-slate-500! [&_th]:bg-slate-50!
  [&_th]:text-label! max-lg:[&_th]:text-xs! [&_th]:font-bold! [&_th]:text-left! [&_th]:uppercase! [&_th]:whitespace-nowrap!
  [&_th]:tracking-wide! [&_td]:h-13.5! [&_td]:pt-0! [&_td]:pr-3.25! [&_td]:pb-0! [&_td]:pl-3.25!
  [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_td]:transition-colors! [&_td]:duration-150! [&_tbody_tr]:cursor-pointer! [&_tbody_tr:hover_td]:bg-slate-50!
  [&_tbody_tr[data-state~=selected]_td]:bg-blue-50!
  [&_tbody_tr[data-state~=selected]_td:first-child]:shadow-active-nav!
  [&_td_>_strong]:block! [&_td_>_strong]:text-slate-700! [&_td_>_strong]:text-caption! max-lg:[&_td_>_strong]:text-xs! [&_td_>_small]:block!
  [&_td_>_small]:mt-0.75! [&_td_>_small]:text-slate-400! [&_td_>_small]:text-fine! max-lg:[&_td_>_small]:text-xs!
  max-phone:min-w-232.5!
`}>
            <thead>
              <tr>
                <th>Delivery</th>
                <th>Destination</th>
                <th>Vehicle</th>
                <th>Lifecycle status</th>
                <th>Delay risk</th>
                <th>Deadline</th>
                <th>Expected arrival</th>
                <th>Last update</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((delivery) => (
                <tr
                  key={delivery.id}
                  data-state={selected?.id === delivery.id ? "selected" : ""}
                  onClick={() => setSelected(delivery)}
                >
                  <td>
                    <strong>{delivery.id}</strong>
                    <small>{delivery.region} district</small>
                  </td>
                  <td>{delivery.destination}</td>
                  <td>
                    <span className={"flex! items-center! gap-y-1.25! gap-x-1.25! [&_svg]:text-slate-500!"}>
                      <Icon name="truck" size={14} />
                      {delivery.vehicle}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`
  w-fit! pt-1! pr-1.75! pb-1! pl-1.75! inline-flex! items-center! gap-y-1.25!
  gap-x-1.25! rounded-card! text-fine! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! [&_i]:w-1.25!
  [&_i]:h-1.25! [&_i]:rounded-full! data-[state~=completed]:text-emerald-800! data-[state~=completed]:bg-emerald-50!
  [&[data-state~=completed]_i]:bg-emerald-700! data-[state~=in-transit]:text-blue-700! data-[state~=in-transit]:bg-blue-50!
  [&[data-state~=in-transit]_i]:bg-blue-600! data-[state~=assigned]:text-slate-500! data-[state~=assigned]:bg-slate-100!
  data-[state~=planned]:text-slate-500! data-[state~=planned]:bg-slate-100! [&[data-state~=assigned]_i]:bg-slate-400!
  [&[data-state~=planned]_i]:bg-slate-400!
`} data-state={delivery.status.toLowerCase().replace(" ", "-")}
                    >
                      <i />
                      {delivery.status}
                    </span>
                  </td>
                  <td>
                    <span className={`
  w-fit! pt-1! pr-1.75! pb-1! pl-1.75! inline-flex! items-center! gap-y-1.25!
  gap-x-1.25! rounded-card! text-fine! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap!
  data-[state~=on-track]:text-emerald-700! data-[state~=on-track]:bg-emerald-50! data-[state~=at-risk]:text-amber-700!
  data-[state~=at-risk]:bg-amber-100! data-[state~=overdue]:text-red-700! data-[state~=overdue]:bg-red-50!
  data-[state~=not-assessed]:text-slate-500! data-[state~=not-assessed]:bg-slate-100!
`} data-state={delivery.risk.toLowerCase().replace(" ", "-")}>
                      {delivery.risk}
                    </span>
                  </td>
                  <td>{delivery.deadline}</td>
                  <td
                    className={delivery.risk === "At risk" || delivery.risk === "Overdue" ? " text-red-600! font-bold!" : ""}
                  >
                    {delivery.eta}
                  </td>
                  <td>
                    <span className={"block! [&_small]:block! [&_small]:mt-0.75! [&_small]:text-slate-400! [&_small]:text-fine! max-lg:[&_small]:text-xs!"}>
                      {delivery.updated}
                      <small>{delivery.id === "SIM-029" ? "24 min ago" : "recent"}</small>
                    </span>
                  </td>
                  <td>
                    <Icon name="chevron" size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className={`
  h-100! flex! flex-col! items-center! justify-center! text-slate-400! [&_strong]:mt-2.5!
  [&_strong]:text-slate-600! [&_strong]:text-detail! max-lg:[&_strong]:text-xs! [&_span]:mt-1! [&_span]:text-micro! max-lg:[&_span]:text-xs!
`}>
              <Icon name="search" />
              <strong>No deliveries found</strong>
              <span>Change or clear the active search and filters.</span>
            </div>
          )}
        </div>
        <div className={`
  min-h-13.5! pt-0! pr-3.75! pb-0! pl-3.75! flex! items-center! justify-between! max-phone:flex-col! max-phone:gap-3! max-phone:py-3!
  border-t! border-solid! border-t-slate-200!
  text-slate-500! text-micro! max-lg:text-xs! [&_>_div]:flex! [&_>_div]:gap-y-1! [&_>_div]:gap-x-1! [&_button]:min-w-7!
  [&_button]:h-7! [&_button]:pt-0! [&_button]:pr-2! [&_button]:pb-0! [&_button]:pl-2!
  [&_button]:rounded-field! [&_button]:text-slate-500! [&_button]:bg-white! [&_button]:text-label! max-lg:[&_button]:text-xs!
  [&_button]:border! [&_button]:border-solid! [&_button]:border-slate-200! [&_button[data-state~=current]]:text-white!
  [&_button[data-state~=current]]:bg-blue-600! [&_button[data-state~=current]]:border-blue-600! [&_button:disabled]:text-slate-400!
  [&_button:disabled]:bg-slate-100! max-phone:[&_>_div_button:nth-child(3)]:hidden!
  max-phone:[&_>_div_button:nth-child(4)]:hidden!
`}>
          <span>
            Showing <strong>{rows.length}</strong> of 75 deliveries
          </span>
          <div>
            <button disabled>Previous</button>
            <button data-state="current">1</button>
            <button>2</button>
            <button>3</button>
            <button>Next</button>
          </div>
        </div>
      </section>

      {selected && (
        <div className={`
  fixed! top-0! right-0! bottom-0! left-0! z-50! flex! justify-end!
  bg-slate-800/33! backdrop-blur-xs!
  animate-fade-in!
`} onClick={() => setSelected(null)}>
          <aside ref={deliveryPanel} role="dialog" aria-modal="true" aria-label="Delivery details" className={`
  w-full! max-w-lg! h-dvh! overflow-y-auto! overscroll-contain! bg-slate-50!
  shadow-drawer! animate-slide-in!
`} onClick={(event) => event.stopPropagation()}>
            <div className={`
  sticky! top-0! z-10! min-h-28.75! pt-5.5! pr-6! pb-4.5! pl-6! flex! justify-between!
  border-b! border-solid! border-b-slate-200!
  bg-white! [&_h2]:mt-1.5! [&_h2]:mr-0! [&_h2]:mb-1! [&_h2]:ml-0! [&_h2]:text-slate-800! [&_h2]:font-bold!
  [&_h2]:text-title! [&_h2]:leading-default! [&_h2]:font-sans! [&_h2]:not-italic! [&_p]:mt-0!
  [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0! [&_p]:flex! [&_p]:items-center! [&_p]:gap-y-0.75! [&_p]:gap-x-0.75!
  [&_p]:text-slate-500! [&_p]:text-micro! max-lg:[&_p]:text-xs! [&_button]:w-7.75! [&_button]:h-7.75!
  [&_button]:rounded-md! [&_button]:grid! [&_button]:place-items-center! [&_button]:text-slate-500!
  [&_button]:bg-white! [&_button]:border! [&_button]:border-solid! [&_button]:border-slate-200!
  max-phone:pr-4.5! max-phone:pl-4.5!
`}>
              <div>
                <span className={"text-blue-600! text-label! max-lg:text-xs! font-bold! tracking-wide-label!"}>DELIVERY DETAILS</span>
                <h2>{selected.id}</h2>
                <p>
                  {selected.origin} <Icon name="chevron" size={12} /> {selected.destination}
                </p>
              </div>
              <button className="grid! size-11! shrink-0! place-items-center! rounded-lg!" onClick={() => setSelected(null)} aria-label="Close details">
                <Icon name="x" size={19} />
              </button>
            </div>
            <div className={`
  pt-3.75! pr-6! pb-3.75! pl-6! flex! gap-y-12.5! gap-x-12.5!
  border-b! border-solid! border-b-slate-200!
  bg-white! [&_>_div_>_span]:block! [&_>_div_>_span]:mb-1.5! [&_>_div_>_span]:text-slate-400!
  [&_>_div_>_span]:text-label! max-lg:[&_>_div_>_span]:text-xs! [&_>_div_>_strong]:block! max-phone:pr-4.5! max-phone:pl-4.5!
`}>
              <div>
                <span>Lifecycle status</span>
                <strong
                  className={`
  w-fit! pt-1! pr-1.75! pb-1! pl-1.75! inline-flex! items-center! gap-y-1.25!
  gap-x-1.25! rounded-card! text-fine! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! [&_i]:w-1.25!
  [&_i]:h-1.25! [&_i]:rounded-full! data-[state~=completed]:text-emerald-800! data-[state~=completed]:bg-emerald-50!
  [&[data-state~=completed]_i]:bg-emerald-700! data-[state~=in-transit]:text-blue-700! data-[state~=in-transit]:bg-blue-50!
  [&[data-state~=in-transit]_i]:bg-blue-600! data-[state~=assigned]:text-slate-500! data-[state~=assigned]:bg-slate-100!
  data-[state~=planned]:text-slate-500! data-[state~=planned]:bg-slate-100! [&[data-state~=assigned]_i]:bg-slate-400!
  [&[data-state~=planned]_i]:bg-slate-400!
`} data-state={selected.status.toLowerCase().replace(" ", "-")}
                >
                  <i />
                  {selected.status}
                </strong>
              </div>
              <div>
                <span>Prediction</span>
                <strong className={`
  w-fit! pt-1! pr-1.75! pb-1! pl-1.75! inline-flex! items-center! gap-y-1.25!
  gap-x-1.25! rounded-card! text-fine! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap!
  data-[state~=on-track]:text-emerald-700! data-[state~=on-track]:bg-emerald-50! data-[state~=at-risk]:text-amber-700!
  data-[state~=at-risk]:bg-amber-100! data-[state~=overdue]:text-red-700! data-[state~=overdue]:bg-red-50!
  data-[state~=not-assessed]:text-slate-500! data-[state~=not-assessed]:bg-slate-100!
`} data-state={selected.risk.toLowerCase().replace(" ", "-")}>
                  {selected.risk}
                </strong>
              </div>
            </div>
            <div className={`
  pt-4.5! pr-6! pb-4.5! pl-6! grid! grid-cols-2! gap-y-4.5!
  gap-x-6.25! border-b! border-solid!
  border-b-slate-200! bg-white! [&_span]:block! [&_span]:mb-1.25!
  [&_span]:text-slate-400! [&_span]:text-label! max-lg:[&_span]:text-xs! [&_strong]:block! [&_strong]:text-slate-700!
  [&_strong]:text-caption! max-lg:[&_strong]:text-xs! max-phone:pr-4.5! max-phone:pl-4.5!
`}>
              <div>
                <span>Assigned vehicle</span>
                <strong>{selected.vehicle}</strong>
              </div>
              <div>
                <span>Coordinator</span>
                <strong>{selected.assignee}</strong>
              </div>
              <div>
                <span>Scheduled deadline</span>
                <strong>03 Dec · {selected.deadline}</strong>
              </div>
              <div>
                <span>Last movement update</span>
                <strong>03 Dec · {selected.updated}</strong>
              </div>
            </div>
            {(selected.risk === "At risk" || selected.risk === "Overdue") && (
              <section className={`
  mt-3.5! mr-3.5! mb-3.5! ml-3.5! pt-3.75! pr-3.75! pb-3.75! pl-3.75!
  rounded-lg! bg-amber-50! border! border-solid! border-red-200! [&_>_div:first-child]:flex!
  [&_>_div:first-child]:items-center! [&_>_div:first-child]:gap-y-1.75! [&_>_div:first-child]:gap-x-1.75!
  [&_>_div:first-child]:text-amber-700! [&_>_div:first-child_strong]:flex-1!
  [&_>_div:first-child_strong]:text-amber-900! [&_>_div:first-child_strong]:text-micro! max-lg:[&_>_div:first-child_strong]:text-xs!
  [&_>_div:first-child_span]:pt-0.75! [&_>_div:first-child_span]:pr-1.5!
  [&_>_div:first-child_span]:pb-0.75! [&_>_div:first-child_span]:pl-1.5!
  [&_>_div:first-child_span]:rounded-lg! [&_>_div:first-child_span]:text-slate-500!
  [&_>_div:first-child_span]:bg-slate-100! [&_>_div:first-child_span]:text-fine! max-lg:[&_>_div:first-child_span]:text-xs!
  [&_>_div:first-child_span]:font-bold! [&_>_small]:block! [&_>_small]:pt-2.25!
  [&_>_small]:border-t! [&_>_small]:border-solid!
  [&_>_small]:border-t-amber-100! [&_>_small]:text-slate-500! [&_>_small]:text-fine! max-lg:[&_>_small]:text-xs!
`}>
                <div>
                  <Icon name="spark" size={18} />
                  <strong>AI-assisted arrival prediction</strong>
                  <span>ETA v0.1</span>
                </div>
                <div className={`
  mt-3.5! mr-0! mb-2.5! ml-0! flex! items-center! gap-y-3.75! gap-x-3.75!
  [&_p]:mt-0! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0! [&_p_span]:block! [&_p_span]:mb-0.75!
  [&_p_span]:text-slate-500! [&_p_span]:text-fine! max-lg:[&_p_span]:text-xs! [&_p_strong]:block! [&_p_strong]:text-amber-900!
  [&_p_strong]:font-bold! [&_p_strong]:text-body! [&_p_strong]:leading-default!
  [&_p_strong]:font-sans! [&_p_strong]:not-italic! [&_>_svg]:text-red-400! **:data-[state~=lateness]:ml-auto!
  **:data-[state~=lateness]:pl-3.5! **:data-[state~=lateness]:border-l! **:data-[state~=lateness]:border-solid!
  **:data-[state~=lateness]:border-l-red-200! [&_[data-state~=lateness]_strong]:text-red-600!
  max-phone:gap-y-2! max-phone:gap-x-2! max-phone:flex-col!
`}>
                  <p>
                    <span>Scheduled</span>
                    <strong>{selected.deadline}</strong>
                  </p>
                  <Icon name="chevron" />
                  <p>
                    <span>Predicted</span>
                    <strong>{selected.eta}</strong>
                  </p>
                  <p data-state="lateness">
                    <span>Estimated lateness</span>
                    <strong>{minutesLate(selected.deadline, selected.eta)} min</strong>
                  </p>
                </div>
                <small>prediction · No operational decision automatically applied</small>
              </section>
            )}
            <section className={`
  mt-3.5! pt-5! pr-6! pb-5! pl-6! border-t! border-solid!
  border-t-slate-200! border-b! border-solid!
  border-b-slate-200! bg-white! max-phone:pr-4.5! max-phone:pl-4.5!
`}>
              <div className={`
  flex! justify-between! [&_h3]:mt-0! [&_h3]:mr-0! [&_h3]:mb-0! [&_h3]:ml-0!
  [&_h3]:text-slate-700! [&_h3]:font-bold! [&_h3]:text-xs! [&_h3]:leading-default!
  [&_h3]:font-sans! [&_h3]:not-italic! [&_span]:text-slate-400! [&_span]:text-label! max-lg:[&_span]:text-xs!
`}>
                <h3>Recorded event history</h3>
                <span>4 events</span>
              </div>
              <p className={"mt-1.25! mr-0! mb-5! ml-0! text-slate-400! text-label! max-lg:text-xs!"}>Generated from recorded operation events</p>
              <div className={`
  [&_article]:min-h-15.5! [&_article]:relative! [&_article]:grid!
  [&_article]:grid-cols-delivery-row! [&_article]:gap-y-2! [&_article]:gap-x-2!
  [&_article:not(:last-child)::before]:content-empty! [&_article:not(:last-child)::before]:w-px!
  [&_article:not(:last-child)::before]:absolute! [&_article:not(:last-child)::before]:left-3!
  [&_article:not(:last-child)::before]:top-6.25! [&_article:not(:last-child)::before]:bottom-0!
  [&_article:not(:last-child)::before]:bg-slate-200! [&_time]:pt-1.5! [&_time]:text-slate-400!
  [&_time]:text-label! max-lg:[&_time]:text-xs! [&_article_>_div:last-child]:pt-1! [&_article_strong]:text-slate-600!
  [&_article_strong]:text-micro! max-lg:[&_article_strong]:text-xs! [&_article_p]:mt-1! [&_article_p]:mr-0! [&_article_p]:mb-0!
  [&_article_p]:ml-0! [&_article_p]:text-slate-400! [&_article_p]:text-label! max-lg:[&_article_p]:text-xs! [&_article_p]:leading-body!
`}>
                {deliveryEvents.map((event, index) => (
                  <article key={event.time}>
                    <div className={`
  w-6.25! h-6.25! z-1! grid! place-items-center! rounded-full!
  shadow-outline! border-3! border-solid! border-white!
  data-[state~=amber]:text-amber-700! data-[state~=amber]:bg-amber-100! data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50!
  data-[state~=slate]:text-slate-500! data-[state~=slate]:bg-slate-100!
`} data-state={event.tone}>
                      {index === 0 ? (
                        <Icon name="trend" size={13} />
                      ) : (
                        <Icon name="check" size={13} />
                      )}
                    </div>
                    <time>{event.time}</time>
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <div className={`
  pt-4! pr-6! pb-6.25! pl-6! flex! gap-y-2! gap-x-2! bg-white! [&_button]:h-9.5!
  [&_button]:flex-1! [&_button]:rounded-control! [&_button]:flex! [&_button]:items-center!
  [&_button]:justify-center! [&_button]:gap-y-1.5! [&_button]:gap-x-1.5! [&_button]:text-micro! max-lg:[&_button]:text-xs!
  [&_button]:font-bold! max-phone:pr-4.5! max-phone:pl-4.5!
`}>
              <button className={"text-slate-600! bg-white! border! border-solid! border-slate-300!"} onClick={() => navigate(movementMapPath({ deliveryId: selected.id, vehicleId: selected.vehicle }))}>
                <Icon name="map" size={16} />
                View on map
              </button>
              <button className={"text-white! bg-blue-600! border! border-solid! border-blue-600!"} onClick={() => setSelected(null)}>
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
    <article className={`
  min-w-0! min-h-30.5! pt-4! pr-3.25! pb-4! pl-3.25! relative! flex! gap-y-2.75!
  gap-x-2.75! rounded-lg! bg-white!
  shadow-subtle! border! border-solid!
  border-slate-200! max-overview-compact:min-h-26.25! max-phone:pt-3.5! max-phone:pr-2.5!
  max-phone:pb-3.5! max-phone:pl-2.5! max-phone:gap-y-2! max-phone:gap-x-2! max-phone:flex-col!
`}>
      <div className={`
  w-7.75! h-7.75! flex-none! grid! place-items-center! rounded-control!
  data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50! data-[state~=green]:text-emerald-700! data-[state~=green]:bg-emerald-50!
  data-[state~=slate]:text-slate-500! data-[state~=slate]:bg-slate-100! data-[state~=amber]:text-amber-700! data-[state~=amber]:bg-amber-100!
  data-[state~=red]:text-red-600! data-[state~=red]:bg-red-50!
`} data-state={tone}>
        <Icon name={icon} size={19} />
      </div>
      <div className={"min-w-0!"}>
        <div className={"overflow-x-hidden! overflow-y-hidden! text-slate-500! text-micro! max-lg:text-xs! font-semibold! whitespace-nowrap! text-ellipsis! max-phone:whitespace-normal!"}>{label}</div>
        <div className={`
  mt-1.75! flex! flex-wrap! items-center! gap-y-1.5! gap-x-1.5! [&_strong]:text-slate-800!
  [&_strong]:font-bold! [&_strong]:text-2xl! [&_strong]:leading-none! [&_strong]:font-sans!
  [&_strong]:not-italic! [&_strong]:tracking-display!
`}>
          <strong>{value}</strong>
          {badge && <span className={` pt-0.5! pr-1.25! pb-0.5! pl-1.25! rounded-lg! text-fine! max-lg:text-xs! font-bold! data-[state~=green]:text-emerald-700! data-[state~=green]:bg-emerald-50! `} data-state={tone}>{badge}</span>}
        </div>
        <div className={"mt-2! text-slate-400! text-label! max-lg:text-xs! whitespace-nowrap! max-phone:whitespace-normal! max-phone:leading-heading!"}>{note}</div>
      </div>
      <button className={`
  grid! place-items-center! text-slate-500! bg-transparent! w-4.5! h-4.5! absolute!
  right-1.75! top-2! opacity-70! border-0! max-phone:hidden!  border-current!
`} aria-label={`More about ${label}`}>
        <Icon name="more" size={18} />
      </button>
    </article>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = usePermissions();
  const { logout } = useAuth();
  const workspaceNav = nav.filter((item) => canAccess(item.path));
  const workspaceManageNav = manageNav.filter((item) => canAccess(item.path));
  const visibleNav = [...workspaceNav, ...workspaceManageNav];
  const activeNav = visibleNav.find((item) => item.path === location.pathname)?.label ?? "Overview";
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigationPanel = useRef<HTMLElement>(null);
  useModalFocus(mobileOpen, navigationPanel, () => setMobileOpen(false));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeMobileMenu = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    const dismissNotifications = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    desktop.addEventListener("change", closeMobileMenu);
    document.addEventListener("keydown", dismissNotifications);
    return () => {
      desktop.removeEventListener("change", closeMobileMenu);
      document.removeEventListener("keydown", dismissNotifications);
    };
  }, []);
  const [operation, setOperation] = useState("Demo Operation");
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        `${alert.id} ${alert.title} ${alert.type}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const markReviewed = (id: string) => {
    setReviewed((current) => (current.includes(id) ? current : [...current, id]));
  };

  return (
    <div className={"min-h-screen! flex! [&_>_main]:w-main! [&_>_main]:ml-62! max-lg:[&_>_main]:w-full! max-lg:[&_>_main]:ml-0!"}>
      {mobileOpen && (
        <button
          className={`
  hidden! max-lg:block! max-lg:fixed! max-lg:top-0! max-lg:right-0!
  max-lg:bottom-0! max-lg:left-0! max-lg:z-25!
  max-lg:bg-slate-800/40!
  max-lg:backdrop-blur-xs! max-lg:border-0! 
  max-lg:border-current!
`}
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside id="primary-navigation" ref={navigationPanel} aria-label="Primary navigation" role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen || undefined} className={`
  w-62! fixed! top-0! right-auto! bottom-0! left-0! z-30! flex! flex-col! pt-6! pr-3.5! pb-4!
  pl-3.5! text-slate-200! max-lg:pb-6!
  bg-sidebar!
  overflow-x-hidden! overflow-y-hidden! max-lg:-translate-x-full! max-lg:invisible!
  max-lg:transition-transform! max-lg:duration-250! max-lg:ease-in-out!
  max-lg:data-[state~=open]:translate-x-0! max-lg:data-[state~=open]:visible!
  max-lg:data-[state~=open]:shadow-mobile-nav!
`} data-state={mobileOpen ? "open" : ""}>
        <div className={`
  flex! flex-1! flex-col! min-h-0! overflow-y-auto! pb-4.5! *:shrink-0!
`}>
          <div className={`
  h-12.5! flex! gap-y-2.75! gap-x-2.75! items-center! pt-0! pr-2.25! pb-0! pl-2.25!
  [&_strong]:block! [&_strong]:text-white! [&_strong]:font-bold! [&_strong]:text-body-sm!
  [&_strong]:leading-title! [&_strong]:font-sans! [&_strong]:not-italic!
  [&_strong]:tracking-badge! [&_span]:block! [&_span]:mt-1! [&_span]:text-slate-400! [&_span]:text-label! max-lg:[&_span]:text-xs!
  [&_span]:tracking-spaced!
`}>
            <div className={`
  w-9.25! h-9.25! rounded-panel! grid! place-items-center! text-white! bg-blue-600!
  shadow-inset-border!
`}>
              <Icon name="route" size={23} />
            </div>
            <div>
              <strong>LOGISTICS</strong>
              <span>COMMAND CENTRE</span>
            </div>
            <button type="button" aria-label="Close menu" className="ml-auto hidden size-11 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-white/10 max-lg:grid" onClick={() => setMobileOpen(false)}><Icon name="x" /></button>
          </div>

          <div className={"mt-8.5!"}>
            <div className={"pt-0! pr-3! pb-2.5! pl-3! text-slate-400! text-caption! max-lg:text-xs! font-bold! tracking-wide-badge! uppercase!"}>Workspace</div>
            <nav>
              {workspaceNav.map((item) => (
                <button
                  key={item.label}
                  className={`
  w-full! h-11! rounded-control! pt-0! pr-3! pb-0! pl-3! flex! items-center! gap-y-3! gap-x-3!
  text-slate-400! bg-transparent! text-body-sm! text-left! transition-all! duration-180! ease-in-out! border-0! 
  border-current! [&:hover]:text-white!
  [&:hover]:bg-white/5! data-[state~=active]:text-white!
  data-[state~=active]:bg-white/7!
  data-[state~=active]:shadow-active-nav-mobile! [&_span]:flex-1! [&_b]:min-w-6!
  [&_b]:pt-0.5! [&_b]:pr-1.5! [&_b]:pb-0.5! [&_b]:pl-1.5! [&_b]:rounded-card!
  [&_b]:text-slate-300! [&_b]:bg-white/7!
  [&_b]:text-caption! max-lg:[&_b]:text-xs! [&_b]:text-center!
`} data-state={activeNav === item.label ? "active" : ""}
                  onClick={() => {
                    navigate(buildRoute(item.path));
                    setMobileOpen(false);
                  }}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.count && <b>{item.count}</b>}
                </button>
              ))}
            </nav>
          </div>

          <div className={"mt-6.25!"}>
            <div className={"pt-0! pr-3! pb-2.5! pl-3! text-slate-400! text-caption! max-lg:text-xs! font-bold! tracking-wide-badge! uppercase!"}>Manage</div>
            {workspaceManageNav.map((item) => (
              <button
                key={item.label}
                className={`
  w-full! h-11! rounded-control! pt-0! pr-3! pb-0! pl-3! flex! items-center! gap-y-3! gap-x-3!
  text-slate-400! bg-transparent! text-body-sm! text-left! transition-all! duration-180! ease-in-out! border-0! 
  border-current! [&:hover]:text-white!
  [&:hover]:bg-white/5! data-[state~=active]:text-white!
  data-[state~=active]:bg-white/7!
  data-[state~=active]:shadow-active-nav-mobile! [&_span]:flex-1! [&_b]:min-w-6!
  [&_b]:pt-0.5! [&_b]:pr-1.5! [&_b]:pb-0.5! [&_b]:pl-1.5! [&_b]:rounded-card!
  [&_b]:text-slate-300! [&_b]:bg-white/7!
  [&_b]:text-caption! max-lg:[&_b]:text-xs! [&_b]:text-center!
`} data-state={activeNav === item.label ? "active" : ""}
                onClick={() => {
                  navigate(buildRoute(item.path));
                  setMobileOpen(false);
                }}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

        </div>

        <div className={`
  shrink-0! pt-3.5! pr-1.75! pb-0.5! pl-1.75! border-t!
  border-solid! border-t-white/7! flex!
  items-center! gap-y-2.5! gap-x-2.5! [&_>_div:nth-child(2)]:min-w-0! [&_>_div:nth-child(2)]:flex-1!
  [&_strong]:block! [&_strong]:whitespace-nowrap! [&_strong]:text-slate-100! [&_strong]:text-detail! max-lg:[&_strong]:text-xs!
  [&_span]:block! [&_span]:whitespace-nowrap! [&_span]:mt-0.75! [&_span]:overflow-x-hidden!
  [&_span]:overflow-y-hidden! [&_span]:text-slate-400! [&_span]:text-label! max-lg:[&_span]:text-xs! [&_span]:text-ellipsis!
`}>
          <div className={"w-8.5! h-8.5! flex-none! grid! place-items-center! rounded-full! text-blue-100! bg-blue-900! text-caption! max-lg:text-xs! font-bold!"}>
            {currentUser.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
          <button type="button" className={`
  grid! place-items-center! basis-8.5! shrink-0! grow-0! w-8.5! h-8.5! pt-0! pr-0! pb-0! pl-0!
  rounded-md! text-slate-400! bg-transparent! border-0!  border-current!
  [&:hover]:text-white! [&:hover]:bg-white/7!
`} onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="min-w-0!">
        <header className="sticky top-0 z-20 flex min-h-16 min-w-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
          <button
            type="button" className="hidden size-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 max-lg:grid" aria-controls="primary-navigation" aria-expanded={mobileOpen}
            aria-label="Open navigation"
            onClick={() => { setNotificationsOpen(false); setMobileOpen(true); }}
          >
            <Icon name="menu" />
          </button>
          <div className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-slate-400 sm:flex">
            <span>Operations</span>
            <Icon name="chevron" size={14} />
            <strong className="truncate font-semibold text-slate-600">{activeNav}</strong>
          </div>
          <div className="relative ml-auto flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400 sm:w-56 sm:flex-none">
              <Icon name="search" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deliveries"
                aria-label="Search deliveries"
                className="min-w-0 w-full flex-1 border-0 bg-transparent text-base text-slate-800 outline-none sm:text-sm"
              />
              <kbd className="hidden lg:block">⌘ K</kbd>
            </label>
            <button
              className="relative grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500"
              aria-label={`${unreadNotifications} unread notifications`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <Icon name="bell" size={20} />
              {unreadNotifications > 0 && <span className="absolute right-2 top-2 size-2 rounded-full border border-white bg-red-600" />}
            </button>
            {notificationsOpen && (
              <div className="pointer-events-none fixed inset-x-3 bottom-4 top-20 z-40 flex items-start justify-end">
              <div role="region" aria-label="Notifications" className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-xl sm:w-80">
                <div className={`
  min-h-14.5! pt-3! pr-4! pb-3! pl-4! flex! items-center!
  justify-between! border-b! border-solid!
  border-b-slate-200! [&_strong]:block! [&_strong]:text-slate-900!
  [&_strong]:text-body-sm! [&_span]:block! [&_span]:mt-fine-0-6! [&_span]:text-slate-500!
  [&_span]:text-detail! max-lg:[&_span]:text-xs! [&_button]:text-blue-600! [&_button]:bg-transparent!
  [&_button]:text-detail! max-lg:[&_button]:text-xs! [&_button]:font-semibold! [&_button]:border-0! 
  [&_button]:border-current!
`}>
                  <div>
                    <strong>Notifications</strong>
                    <span>{unreadNotifications} unread</span>
                  </div>
                  <button onClick={markAllNotificationsRead}>Mark all read</button>
                </div>
                <div className={"overflow-y-auto!"}>
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      className={`
  w-full! min-h-20! pt-3! pr-fine-3-4! pb-3! pl-fine-3-4! grid!
  grid-cols-nav-item! items-start! gap-y-fine-2-6! gap-x-fine-2-6! border-t-0!
   border-t-current! border-r-0!
   border-r-current! border-b!
  border-solid! border-b-slate-100! border-l-0!
   border-l-current! text-inherit! bg-white! text-left!
  [&:hover]:bg-slate-50! data-[state~=unread]:bg-slate-50! [&_>_i]:w-1.75! [&_>_i]:h-1.75! [&_>_i]:mt-fine-1-2!
  [&_>_i]:rounded-full! [&_>_i]:bg-slate-400! [&_>_i[data-state~=warning]]:bg-amber-500! [&_>_i[data-state~=critical]]:bg-red-500!
  [&_>_i[data-state~=info]]:bg-blue-500! [&_>_i[data-state~=success]]:bg-emerald-500! [&_strong]:block! [&_strong]:text-slate-800!
  [&_strong]:text-xs! [&_small]:block! [&_small]:mt-fine-0-8! [&_small]:text-slate-600!
  [&_small]:text-detail! max-lg:[&_small]:text-xs! [&_small]:leading-compact! [&_em]:block! [&_em]:mt-fine-1-2!
  [&_em]:text-slate-400! [&_em]:text-caption! max-lg:[&_em]:text-xs! [&_em]:not-italic! [&_>_svg]:mt-fine-4-8!
  [&_>_svg]:text-slate-400!
`} data-state={item.read ? "" : "unread"}
                      onClick={() => {
                        markNotificationRead(item.id);
                        setNotificationsOpen(false);
                        navigate(buildRoute(item.destination));
                      }}
                    >
                      <i data-state={item.severity} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                        <em>{item.timestamp}</em>
                      </span>
                      <Icon name="chevron" size={14} />
                    </button>
                  ))}
                </div>
              </div>
              </div>
            )}
          </div>
        </header>

        {activeNav === "Overview" && currentUser.role !== "Operations Coordinator" ? (
          <RoleOverviewPage />
        ) : activeNav === "Overview" ? (
          <div className={`
  max-w-360! pt-7.75! pr-8! pb-6.5! pl-8! mt-0! mr-auto! mb-0! ml-auto! max-phone:pt-5.75!
  max-phone:pr-4! max-phone:pb-5.75! max-phone:pl-4!
`}>
            <div className={`
  flex! justify-between! items-end! gap-y-6! gap-x-6! [&_p]:mt-0! [&_p]:mr-0! [&_p]:mb-0!
  [&_p]:ml-0! [&_p]:text-slate-500! [&_p]:text-xs! max-phone:items-stretch! max-phone:flex-col!
`}>
              <div>
                <div className={`
  flex! items-center! gap-y-2! gap-x-2! text-slate-400! text-micro! max-lg:text-xs! font-bold! tracking-section!
  [&_span]:text-blue-600! [&_i]:w-0.75! [&_i]:h-0.75! [&_i]:rounded-full! [&_i]:bg-slate-400!
`}>
                  <span>OPERATIONS</span>
                  <i />
                  THURSDAY, 3 DECEMBER 2026
                </div>
                <h1>Operations overview</h1>
                <p>Monitor delivery progress, movement telemetry and operational risks.</p>
              </div>
              <label className={`
  w-47! [&_span]:block! [&_span]:mb-1.25! [&_span]:text-slate-400! [&_span]:text-micro! max-lg:[&_span]:text-xs!
  [&_span]:font-semibold! [&_select]:w-full! [&_select]:h-9.5! [&_select]:pt-0! [&_select]:pr-8!
  [&_select]:pb-0! [&_select]:pl-2.75! [&_select]:rounded-control! [&_select]:text-slate-700!
  [&_select]:outline-none! [&_select]:bg-white! [&_select]:text-detail! max-lg:[&_select]:text-base! [&_select]:font-semibold!
  [&_select]:border! [&_select]:border-solid! [&_select]:border-slate-300! max-phone:w-full!
`}>
                <span>Selected operation</span>
                <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                  <option>Demo Operation</option>
                  <option>Readiness Exercise 02</option>
                </select>
              </label>
            </div>

            <div className={`
  min-h-9.5! mt-6! mr-0! mb-3.75! ml-0! pt-2! pr-3.25! pb-2! pl-3.25! flex!
  items-center! justify-between! rounded-control! bg-teal-50! text-slate-600! text-micro! max-lg:text-xs! border!
  border-solid! border-emerald-100! [&_>_div]:flex! [&_>_div]:items-center! [&_>_div]:gap-y-2!
  [&_>_div]:gap-x-2! [&_strong]:text-teal-800! [&_>_div_span:last-child]:pl-2!
  [&_>_div_span:last-child]:border-l! [&_>_div_span:last-child]:border-solid!
  [&_>_div_span:last-child]:border-l-slate-300! [&_button]:text-slate-500!
  [&_button]:bg-transparent! [&_button]:text-micro! max-lg:[&_button]:text-xs! [&_button]:border-0! 
  [&_button]:border-current! max-phone:[&_>_div_span:last-child]:hidden!
  max-phone:[&_button]:hidden!
`}>
              <div>
                <span className={"w-1.75! h-1.75! rounded-full! bg-emerald-600!"} />
                <strong>All systems operational</strong>
                <span>Data refreshed just now</span>
              </div>
              <button>Refreshes every 15 sec</button>
            </div>

            <section className={`
  grid! grid-cols-6! gap-y-2.75! gap-x-2.75!
  max-overview-compact:grid-cols-3! max-phone:grid-cols-2!
`} aria-label="Key metrics">
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

            <div className={"mt-3.25! grid! grid-cols-balanced! gap-y-3.25! gap-x-3.25! max-overview-compact:grid-cols-1!"}>
              <section className={`
  rounded-lg! bg-white!
  shadow-subtle! overflow-x-hidden!
  overflow-y-hidden! border! border-solid! border-slate-200!
`}>
                <div className={`
  min-h-16.25! pt-3.75! pr-4.25! pb-3.75! pl-4.25! flex! items-center!
  justify-between! border-b! border-solid!
  border-b-slate-200! [&_h2]:mt-0! [&_h2]:mr-0! [&_h2]:mb-0! [&_h2]:ml-0!
  [&_h2]:text-slate-800! [&_h2]:font-bold! [&_h2]:text-body-sm! [&_h2]:leading-default!
  [&_h2]:font-sans! [&_h2]:not-italic! [&_h2]:tracking-body! [&_p]:mt-1! [&_p]:mr-0!
  [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-slate-400! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
                  <div>
                    <h2>Delivery progress</h2>
                    <p>Completion by operational district</p>
                  </div>
                  <button className={`
  flex! items-center! gap-y-0.75! gap-x-0.75! text-blue-600! bg-transparent! text-micro! max-lg:text-xs!
  font-semibold! border-0!  border-current!
`}>
                    View deliveries <Icon name="chevron" size={15} />
                  </button>
                </div>
                <div className={`
  min-h-49.75! pt-6.25! pr-6! pb-5.25! pl-6! flex! items-center! gap-y-9.5!
  gap-x-9.5! max-phone:pt-5! max-phone:pr-5! max-phone:pb-5! max-phone:pl-5!
  max-phone:flex-col! max-phone:gap-y-6! max-phone:gap-x-6!
`}>
                  <div className={`
  w-32.5! h-32.5! flex-none! relative! grid! place-items-center! rounded-full!
  bg-delivery-progress!
  [&::before]:content-empty! [&::before]:absolute! [&::before]:top-3.25! [&::before]:right-3.25!
  [&::before]:bottom-3.25! [&::before]:left-3.25! [&::before]:rounded-full! [&::before]:bg-white!
  [&_div]:z-1! [&_div]:text-center! [&_strong]:block! [&_strong]:text-slate-800! [&_strong]:font-bold!
  [&_strong]:text-display-sm! [&_strong]:leading-default! [&_strong]:font-sans!
  [&_strong]:not-italic! [&_strong]:tracking-display! [&_span]:block! [&_span]:mt-px!
  [&_span]:text-slate-400! [&_span]:text-label! max-lg:[&_span]:text-xs!
`} aria-label="56 percent completed">
                    <div>
                      <strong>56%</strong>
                      <span>completed</span>
                    </div>
                  </div>
                  <div className={"flex-1! max-phone:w-full!"}>
                    {areas.map((area) => {
                      const percentage = Math.round((area.done / area.total) * 100);
                      return (
                        <div className={`
  [&+[data-slot~=progress-item]]:mt-3.75! [&_>_div:first-child]:mb-1.5! [&_>_div:first-child]:flex!
  [&_>_div:first-child]:justify-between! [&_>_div:first-child]:text-slate-600!
  [&_>_div:first-child]:text-micro! max-lg:[&_>_div:first-child]:text-xs! [&_strong]:text-slate-700! [&_strong]:text-micro! max-lg:[&_strong]:text-xs! [&_em]:text-slate-400!
  [&_em]:not-italic! [&_em]:font-normal!
`} data-slot="progress-item" key={area.name}>
                          <div>
                            <span>{area.name}</span>
                            <strong>
                              {area.done} <em>/ {area.total}</em>
                            </strong>
                          </div>
                          <div className={"h-1! overflow-x-hidden! overflow-y-hidden! rounded-compact! bg-slate-200! [&_i]:h-full! [&_i]:block! [&_i]:rounded-compact!"}>
                            <i className={`${area.color} w-(--progress)`} style={{ "--progress": `${percentage}%` } as CSSProperties} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={`
  h-10! pt-0! pr-5! pb-0! pl-5! flex! items-center! gap-y-5.5! gap-x-5.5!
  border-t! border-solid! border-t-slate-200!
  text-slate-500! text-label! max-lg:text-xs! max-phone:pt-0! max-phone:pr-3! max-phone:pb-0! max-phone:pl-3!
  max-phone:gap-y-2.5! max-phone:gap-x-2.5!
`}>
                  <div>
                    <span className={"w-1.5! h-1.5! mr-1.25! inline-block! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600! data-[state~=slate]:bg-slate-400!"} data-state="green" />
                    42 completed
                  </div>
                  <div>
                    <span className={"w-1.5! h-1.5! mr-1.25! inline-block! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600! data-[state~=slate]:bg-slate-400!"} data-state="blue" />
                    25 in transit
                  </div>
                  <div>
                    <span className={"w-1.5! h-1.5! mr-1.25! inline-block! rounded-full! data-[state~=green]:bg-emerald-700! data-[state~=blue]:bg-blue-600! data-[state~=slate]:bg-slate-400!"} data-state="slate" />8 not dispatched
                  </div>
                </div>
              </section>

              <section className={`
  rounded-lg! bg-white!
  shadow-subtle! overflow-x-hidden!
  overflow-y-hidden! border! border-solid! border-slate-200!
`}>
                <div className={`
  min-h-16.25! pt-3.75! pr-4.25! pb-3.75! pl-4.25! flex! items-center!
  justify-between! border-b! border-solid!
  border-b-slate-200! [&_h2]:mt-0! [&_h2]:mr-0! [&_h2]:mb-0! [&_h2]:ml-0!
  [&_h2]:text-slate-800! [&_h2]:font-bold! [&_h2]:text-body-sm! [&_h2]:leading-default!
  [&_h2]:font-sans! [&_h2]:not-italic! [&_h2]:tracking-body! [&_p]:mt-1! [&_p]:mr-0!
  [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-slate-400! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
                  <div>
                    <h2>Attention required</h2>
                    <p>{alerts.length - reviewed.length} unresolved alerts</p>
                  </div>
                  <button className={`
  flex! items-center! gap-y-0.75! gap-x-0.75! text-blue-600! bg-transparent! text-micro! max-lg:text-xs!
  font-semibold! border-0!  border-current!
`}>
                    View all <Icon name="chevron" size={15} />
                  </button>
                </div>
                <div className={"min-h-59.75!"}>
                  {filteredAlerts.length ? (
                    filteredAlerts.map((alert) => (
                      <article
                        className={`
  min-h-20! pt-3.25! pr-4! pb-3.25! pl-4! flex! items-start! gap-y-2.75! gap-x-2.75!
  border-b! border-solid! border-b-slate-100!
  transition-all! duration-200! last:border-b-0! 
  last:border-b-current! [&:hover]:bg-slate-50! data-[state~=reviewed]:opacity-58!
`} data-state={reviewed.includes(alert.id) ? "reviewed" : ""}
                        key={alert.id}
                      >
                        <div className={` w-7.75! h-7.75! flex-none! grid! place-items-center! rounded-control! data-[state~=amber]:text-amber-700! data-[state~=amber]:bg-amber-100! data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100! `} data-state={alert.tone}>
                          <Icon
                            name={reviewed.includes(alert.id) ? "check" : alert.icon}
                            size={18}
                          />
                        </div>
                        <div className={`
  min-w-0! flex-1! [&_>_div]:flex! [&_>_div]:items-center! [&_>_div]:gap-y-2!
  [&_>_div]:gap-x-2! [&_strong]:text-slate-700! [&_strong]:text-micro! max-lg:[&_strong]:text-xs! [&_>_div_span]:text-slate-400!
  [&_>_div_span]:text-fine! max-lg:[&_>_div_span]:text-xs! [&_p]:mt-1! [&_p]:mr-0! [&_p]:mb-0.75! [&_p]:ml-0! [&_p]:overflow-x-hidden!
  [&_p]:overflow-y-hidden! [&_p]:text-slate-600! [&_p]:text-micro! max-lg:[&_p]:text-xs! [&_p]:whitespace-nowrap!
  [&_p]:text-ellipsis! [&_small]:text-slate-400! [&_small]:text-fine! max-lg:[&_small]:text-xs! max-phone:[&_p]:max-w-46.25!
`}>
                          <div>
                            <strong>Delivery {alert.id}</strong>
                            <span>{alert.time}</span>
                          </div>
                          <p>{reviewed.includes(alert.id) ? "Marked as reviewed" : alert.title}</p>
                          <small>{alert.detail}</small>
                        </div>
                        <button
                          className={`
  mt-0.75! pt-1! pr-1.75! pb-1! pl-1.75! rounded-card! text-fine! max-lg:text-xs! font-bold! border-0!
   border-current! data-[state~=amber]:text-amber-700! data-[state~=amber]:bg-amber-100!
  data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100!
`} data-state={alert.tone}
                          onClick={() => markReviewed(alert.id)}
                        >
                          {reviewed.includes(alert.id) ? "Reviewed" : alert.type}
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className={`
  min-h-59.5! flex! flex-col! items-center! justify-center! text-slate-400!
  [&_strong]:mt-2.25! [&_strong]:text-slate-600! [&_strong]:text-detail! max-lg:[&_strong]:text-xs! [&_span]:mt-0.75!
  [&_span]:text-micro! max-lg:[&_span]:text-xs!
`}>
                      <Icon name="search" />
                      <strong>No matching alerts</strong>
                      <span>Try another delivery ID or keyword.</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className={"mt-3.25! grid! grid-cols-overview! gap-y-3.25! gap-x-3.25! max-overview-compact:grid-cols-1!"}>
              <section className={`
  rounded-lg! bg-white!
  shadow-subtle! overflow-x-hidden!
  overflow-y-hidden! border! border-solid! border-slate-200!
`}>
                <div className={`
  min-h-16.25! pt-3.75! pr-4.25! pb-3.75! pl-4.25! flex! items-center!
  justify-between! border-b! border-solid!
  border-b-slate-200! [&_h2]:mt-0! [&_h2]:mr-0! [&_h2]:mb-0! [&_h2]:ml-0!
  [&_h2]:text-slate-800! [&_h2]:font-bold! [&_h2]:text-body-sm! [&_h2]:leading-default!
  [&_h2]:font-sans! [&_h2]:not-italic! [&_h2]:tracking-body! [&_p]:mt-1! [&_p]:mr-0!
  [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-slate-400! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
                  <div>
                    <h2>Movement telemetry</h2>
                    <p>Coverage across active journeys</p>
                  </div>
                  <button className={"grid! place-items-center! text-slate-500! bg-transparent! w-7! h-7! rounded-md! border! border-solid! border-slate-200!"} aria-label="Expand map">
                    <Icon name="expand" size={17} />
                  </button>
                </div>
                <div className={`
  h-37.5! relative! overflow-x-hidden! overflow-y-hidden! bg-slate-100!
  bg-map-grid!
  bg-size-map! [&_svg]:w-full! [&_svg]:h-full!
`}>
                  <svg viewBox="0 0 680 200" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      className={`
  fill-none! stroke-slate-300! stroke-3! stroke-linecap-round!
  stroke-dash-route! data-[state~=muted]:stroke-slate-300! data-[state~=muted]:stroke-6!
  data-[state~=muted]:stroke-dash-none!
`} data-state="muted"
                      d="M-20 45C80 15 105 75 180 65s125-62 213-24 112 92 305 26"
                    />
                    <path
                      className={`
  fill-none! stroke-slate-300! stroke-3! stroke-linecap-round!
  stroke-dash-route! data-[state~=muted]:stroke-slate-300! data-[state~=muted]:stroke-6!
  data-[state~=muted]:stroke-dash-none!
`}
                      d="M38 166c78-12 82-70 155-68s101 58 166 42 102-95 196-79 91 84 145 76"
                    />
                    <path
                      className={`
  fill-none! stroke-slate-300! stroke-3! stroke-linecap-round!
  stroke-dash-route! data-[state~=muted]:stroke-slate-300! data-[state~=muted]:stroke-6!
  data-[state~=muted]:stroke-dash-none!
`} data-state="muted"
                      d="M118 210c15-68 74-83 129-117s114-76 200-63 100 78 154 185"
                    />
                  </svg>
                  <span className={`
  w-6.25! h-6.25! absolute! grid! place-items-center! rounded-full! text-white!
  shadow-map-pin! left-22/100! top-47/100!
  border-2! border-solid! border-white! data-[state~=fresh]:bg-blue-600! data-[state~=stale]:bg-amber-700!
`} data-state="fresh">
                    <Icon name="truck" size={14} />
                  </span>
                  <span className={`
  w-6.25! h-6.25! absolute! grid! place-items-center! rounded-full! text-white!
  shadow-map-pin! left-51/100! top-62/100!
  border-2! border-solid! border-white! data-[state~=fresh]:bg-blue-600! data-[state~=stale]:bg-amber-700!
`} data-state="fresh">
                    <Icon name="truck" size={14} />
                  </span>
                  <span className={`
  w-6.25! h-6.25! absolute! grid! place-items-center! rounded-full! text-white!
  shadow-map-pin! right-17/100!
  top-27/100! border-2! border-solid! border-white! data-[state~=fresh]:bg-blue-600!
  data-[state~=stale]:bg-amber-700!
`} data-state="stale">
                    <Icon name="truck" size={14} />
                  </span>
                  <span className={`
  w-6.25! h-6.25! absolute! grid! place-items-center! rounded-full! text-white!
  shadow-map-pin! right-31/100!
  top-18/100! border-2! border-solid! border-white! data-[state~=fresh]:bg-blue-600!
  data-[state~=stale]:bg-amber-700!
`} data-state="fresh">
                    <Icon name="truck" size={14} />
                  </span>
                  <div className={`
  absolute! left-2.5! bottom-2! pt-1! pr-1.75! pb-1! pl-1.75! rounded-sm! text-slate-500!
  bg-white/85! text-fine! max-lg:text-xs! font-bold!
  tracking-caption! border! border-solid! border-slate-300!
`}>VEHICLE POSITIONS</div>
                </div>
                <div className={`
  min-h-16.25! pt-2.5! pr-4! pb-2.5! pl-4! flex! items-center! gap-y-6! gap-x-6!
  border-t! border-solid! border-t-slate-200!
  [&_>_div:not([data-slot~=coverage])]:min-w-15.75! [&_strong]:block! [&_strong]:text-slate-700! [&_strong]:font-bold!
  [&_strong]:text-sm! [&_strong]:leading-default! [&_strong]:font-sans!
  [&_strong]:not-italic! [&_span]:block! [&_span]:mt-0.5! [&_span]:text-slate-400! [&_span]:text-fine! max-lg:[&_span]:text-xs!
  [&_[data-state~=warning]_strong]:text-amber-700! max-phone:flex-wrap! max-phone:gap-y-4! max-phone:gap-x-4!
`}>
                  <div>
                    <strong>8</strong>
                    <span>Active vehicles</span>
                  </div>
                  <div>
                    <strong>7</strong>
                    <span>Fresh signals</span>
                  </div>
                  <div data-state="warning">
                    <strong>1</strong>
                    <span>Stale signal</span>
                  </div>
                  <div className={`
  min-w-37.5! ml-auto! [&_span]:flex! [&_span]:justify-between! [&_span]:text-slate-500!
  [&_b]:text-emerald-700! [&_div]:h-1! [&_div]:mt-1.75! [&_div]:overflow-x-hidden!
  [&_div]:overflow-y-hidden! [&_div]:rounded-compact! [&_div]:bg-slate-200! [&_i]:w-88/100! [&_i]:h-full!
  [&_i]:block! [&_i]:bg-emerald-700! max-phone:w-full! max-phone:mt-0! max-phone:mr-0!
  max-phone:mb-0! max-phone:ml-0!
`} data-slot="coverage">
                    <span>
                      <b>88%</b> telemetry coverage
                    </span>
                    <div>
                      <i />
                    </div>
                  </div>
                </div>
              </section>

              <section className={`
  rounded-lg! bg-white!
  shadow-subtle! overflow-x-hidden!
  overflow-y-hidden! border! border-solid! border-slate-200!
`}>
                <div className={`
  min-h-16.25! pt-3.75! pr-4.25! pb-3.75! pl-4.25! flex! items-center!
  justify-between! border-b! border-solid!
  border-b-slate-200! [&_h2]:mt-0! [&_h2]:mr-0! [&_h2]:mb-0! [&_h2]:ml-0!
  [&_h2]:text-slate-800! [&_h2]:font-bold! [&_h2]:text-body-sm! [&_h2]:leading-default!
  [&_h2]:font-sans! [&_h2]:not-italic! [&_h2]:tracking-body! [&_p]:mt-1! [&_p]:mr-0!
  [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-slate-400! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
                  <div>
                    <h2>Operational outlook</h2>
                    <p>AI-assisted forecast · next 3 hours</p>
                  </div>
                  <div className={"pt-1! pr-1.75! pb-1! pl-1.75! flex! items-center! gap-y-1! gap-x-1! rounded-card! text-slate-500! bg-slate-100! text-fine! max-lg:text-xs! font-bold!"}>
                    <Icon name="spark" size={14} /> ETA v0.1
                  </div>
                </div>
                <div className={`
  mt-4! mr-4.25! mb-3.25! ml-4.25! pt-3! pr-3! pb-3! pl-3! flex! items-center!
  gap-y-2.5! gap-x-2.5! rounded-control! bg-amber-50! [&_>_div:nth-child(2)]:flex-1! [&_strong]:block!
  [&_strong]:text-amber-900! [&_strong]:text-detail! max-lg:[&_strong]:text-xs! [&_span]:block! [&_span]:mt-0.5!
  [&_span]:text-amber-700! [&_span]:text-label! max-lg:[&_span]:text-xs! [&_>_b]:text-red-600! [&_>_b]:text-micro! max-lg:[&_>_b]:text-xs!
`}>
                  <div className={"w-8.5! h-8.5! grid! place-items-center! rounded-control! text-amber-700! bg-amber-100!"}>
                    <Icon name="trend" size={22} />
                  </div>
                  <div>
                    <strong>6 deliveries</strong>
                    <span>predicted at risk of delay</span>
                  </div>
                  <b>+2</b>
                </div>
                <div className={`
  pt-0! pr-4.5! pb-0! pl-4.5! [&_>_div]:mt-2.25! [&_>_div]:mr-0! [&_>_div]:mb-2.25!
  [&_>_div]:ml-0! [&_>_div]:grid! [&_>_div]:grid-cols-route-row! [&_>_div]:items-center!
  [&_>_div]:gap-y-2! [&_>_div]:gap-x-2! [&_>_div]:text-slate-500! [&_>_div]:text-label! max-lg:[&_>_div]:text-xs!
  [&_>_div_>_div]:h-1.25! [&_>_div_>_div]:overflow-x-hidden! [&_>_div_>_div]:overflow-y-hidden!
  [&_>_div_>_div]:rounded-compact! [&_>_div_>_div]:bg-slate-100! [&_i]:h-full! [&_i]:block!
  [&_i]:rounded-compact! [&_i]:bg-amber-700! [&_strong]:text-slate-600! [&_strong]:text-label! max-lg:[&_strong]:text-xs!
  [&_strong]:text-right!
`}>
                  <div>
                    <span>High risk</span>
                    <div>
                      <i className={"w-17/100"} />
                    </div>
                    <strong>1</strong>
                  </div>
                  <div>
                    <span>Medium risk</span>
                    <div>
                      <i className={"w-50/100"} />
                    </div>
                    <strong>3</strong>
                  </div>
                  <div>
                    <span>Low risk</span>
                    <div>
                      <i className={"w-34/100"} />
                    </div>
                    <strong>2</strong>
                  </div>
                </div>
                <div className={`
  mt-3.5! pt-2.5! pr-4.25! pb-2.5! pl-4.25! flex! items-center! gap-y-1.75!
  gap-x-1.75! border-t! border-solid! border-t-slate-200!
  text-slate-400! text-fine! max-lg:text-xs! leading-body! [&_svg]:flex-none! [&_svg]:text-slate-500!
`}>
                  <Icon name="spark" size={16} />
                  <span>
                    Predictions require review before applying operational changes.
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
              <div className={`
  min-h-workspace! flex! flex-col! items-center! justify-center! text-slate-500!
  [&_>_span]:w-7.5! [&_>_span]:h-7.5! [&_>_span]:mb-3.5!
  [&_>_span]:border-t-blue-600!
  [&_>_span]:border-r-slate-200!
  [&_>_span]:border-b-slate-200!
  [&_>_span]:border-l-slate-200! [&_>_span]:rounded-full!
  [&_>_span]:animate-map-spin! [&_>_span]:border-3! [&_>_span]:border-solid! [&_strong]:text-slate-700!
  [&_strong]:text-detail! max-lg:[&_strong]:text-xs! [&_p]:mt-1! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
                <span />
                <strong>Loading Nigeria movement map</strong>
                <p>Preparing vehicle telemetry…</p>
              </div>
            }
          >
            <MovementMap />
          </Suspense>
        ) : activeNav === "Intelligence" ? (
          <Suspense
            fallback={
              <div className={`
  min-h-workspace! flex! flex-col! items-center! justify-center! text-slate-500!
  [&_>_span]:w-7.5! [&_>_span]:h-7.5! [&_>_span]:mb-3.5!
  [&_>_span]:border-t-blue-600!
  [&_>_span]:border-r-slate-200!
  [&_>_span]:border-b-slate-200!
  [&_>_span]:border-l-slate-200! [&_>_span]:rounded-full!
  [&_>_span]:animate-map-spin! [&_>_span]:border-3! [&_>_span]:border-solid! [&_strong]:text-slate-700!
  [&_strong]:text-detail! max-lg:[&_strong]:text-xs! [&_p]:mt-1! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
                <span />
                <strong>Loading intelligence workspace</strong>
                <p>Preparing the alert queue…</p>
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
                navigate(buildRoute(allNav.find((item) => item.label === page)?.path ?? ROUTES.DASHBOARD))
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
          <div className={`
  max-w-360! pt-7.75! pr-8! pb-6.5! pl-8! mt-0! mr-auto! mb-0! ml-auto!
  min-h-workspace! flex! flex-col! items-center! justify-center! text-center!
  [&_>_span]:text-blue-600! [&_>_span]:text-label! max-lg:[&_>_span]:text-xs! [&_>_span]:font-bold! [&_>_span]:tracking-badge!
  [&_p]:mt-1! [&_p]:mr-0! [&_p]:mb-4.5! [&_p]:ml-0! [&_p]:text-slate-500! [&_p]:text-detail! max-lg:[&_p]:text-xs!
  [&_button]:h-9.5! [&_button]:pt-0! [&_button]:pr-3.75! [&_button]:pb-0! [&_button]:pl-3.75!
  [&_button]:rounded-control! [&_button]:text-white! [&_button]:bg-blue-600! [&_button]:text-micro! max-lg:[&_button]:text-xs!
  [&_button]:font-bold! [&_button]:border-0!  [&_button]:border-current!
  max-phone:pt-5.75! max-phone:pr-4! max-phone:pb-5.75! max-phone:pl-4!
`}>
            <div className={"w-14.5! h-14.5! mb-4.25! grid! place-items-center! rounded-dialog! text-blue-600! bg-blue-50!"}>
              <Icon
                name={nav.find((item) => item.label === activeNav)?.icon ?? "dashboard"}
                size={28}
              />
            </div>
            <span>NEXT WORKSPACE</span>
            <h1>{activeNav}</h1>
            <p>This section is queued for the next implementation milestone.</p>
            <button onClick={() => navigate(buildRoute(ROUTES.DELIVERIES))}>Return to deliveries</button>
          </div>
        )}
      </main>
    </div>
  );
}

function ModuleLoader({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className={`
  min-h-workspace! flex! flex-col! items-center! justify-center! text-slate-500!
  [&_>_span]:w-7.5! [&_>_span]:h-7.5! [&_>_span]:mb-3.5!
  [&_>_span]:border-t-blue-600!
  [&_>_span]:border-r-slate-200!
  [&_>_span]:border-b-slate-200!
  [&_>_span]:border-l-slate-200! [&_>_span]:rounded-full!
  [&_>_span]:animate-map-spin! [&_>_span]:border-3! [&_>_span]:border-solid! [&_strong]:text-slate-700!
  [&_strong]:text-detail! max-lg:[&_strong]:text-xs! [&_p]:mt-1! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-label! max-lg:[&_p]:text-xs!
`}>
          <span />
          <strong>Loading {label}</strong>
          <p>Preparing shared records…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default App;
