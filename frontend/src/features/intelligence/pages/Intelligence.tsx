import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  CloudRain,
  FileText,
  Link,
  ListFilter,
  RadioTower,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useData } from "../../../data";
import { usePermissions } from "../../../hooks/usePermissions";

type Severity = "Critical" | "High" | "Medium" | "Low";
type ReviewStatus = "New" | "Acknowledged" | "Under review" | "Resolved";
type AlertType =
  | "Overdue"
  | "Delivery risk"
  | "Telemetry stale"
  | "Weather"
  | "Disruption"
  | "Resource conflict";

type AlertRecord = {
  id: string;
  type: AlertType;
  severity: Severity;
  status: ReviewStatus;
  title: string;
  description: string;
  entity: string;
  vehicle?: string;
  state: string;
  zone: string;
  source: string;
  created: string;
  updated: string;
  occurrences: number;
  fact: string;
  action: string;
  prediction?: {
    deadline: string;
    arrival: string;
    lateness: number;
    generated: string;
  };
  disruption?: { validUntil: string; affected: number; verification: string };
};

const initialAlerts: AlertRecord[] = [
  {
    id: "ALT-1041",
    type: "Overdue",
    severity: "Critical",
    status: "New",
    title: "Deadline passed without confirmed receipt",
    description: "Delivery remains in transit after its scheduled deadline.",
    entity: "SIM-041",
    vehicle: "VEH-009",
    state: "Enugu",
    zone: "South East",
    source: "Delivery event service",
    created: "09:21",
    updated: "09:31",
    occurrences: 2,
    fact: "Scheduled deadline was 09:20 WAT. No receipt event has been recorded.",
    action: "Confirm vehicle status and contact the assigned coordinator.",
  },
  {
    id: "ALT-1018",
    type: "Delivery risk",
    severity: "High",
    status: "New",
    title: "Predicted arrival exceeds scheduled deadline",
    description: "Latest ETA prediction indicates a likely late arrival.",
    entity: "SIM-018",
    vehicle: "VEH-005",
    state: "Oyo",
    zone: "South West",
    source: "ETA model v0.1",
    created: "09:05",
    updated: "09:26",
    occurrences: 3,
    fact: "Delivery was dispatched at 07:30 WAT. Last telemetry was received at 09:30 WAT.",
    action: "Review the journey and assess whether a response is required.",
    prediction: {
      deadline: "10:30",
      arrival: "10:58",
      lateness: 28,
      generated: "09:26",
    },
  },
  {
    id: "ALT-1029",
    type: "Telemetry stale",
    severity: "High",
    status: "Acknowledged",
    title: "No recent movement update received",
    description: "Vehicle telemetry has exceeded the freshness threshold.",
    entity: "SIM-029",
    vehicle: "VEH-011",
    state: "Bauchi",
    zone: "North East",
    source: "Telemetry monitor",
    created: "09:18",
    updated: "09:29",
    occurrences: 1,
    fact: "Last recorded position event was received at 09:08 WAT, 24 minutes ago.",
    action:
      "Check communications status before relying on the displayed position.",
  },
  {
    id: "ALT-1033",
    type: "Weather",
    severity: "Medium",
    status: "Under review",
    title: "heavy rainfall advisory",
    description: "weather conditions may affect journey timing.",
    entity: "4 deliveries",
    state: "Oyo",
    zone: "South West",
    source: "weather service",
    created: "09:14",
    updated: "09:24",
    occurrences: 2,
    fact: "A rainfall advisory was recorded for the Oyo operation corridor.",
    action:
      "Review affected delivery estimates. Do not infer delay without evidence.",
    disruption: {
      validUntil: "11:30",
      affected: 4,
      verification: "Verified operation event",
    },
  },
  {
    id: "ALT-1038",
    type: "Resource conflict",
    severity: "Medium",
    status: "New",
    title: "Incompatible vehicle assignment detected",
    description: "A vehicle appears in two overlapping assignment windows.",
    entity: "SIM-038",
    vehicle: "VEH-012",
    state: "Kaduna",
    zone: "North West",
    source: "Planning validator",
    created: "09:17",
    updated: "09:17",
    occurrences: 1,
    fact: "VEH-012 is assigned to SIM-038 and SIM-044 between 10:00 and 10:45 WAT.",
    action: "Review assignments before approving the proposed plan.",
  },
  {
    id: "ALT-1046",
    type: "Disruption",
    severity: "Low",
    status: "Resolved",
    title: "road closure reported",
    description: "No active delivery impact is currently confirmed.",
    entity: "No linked delivery",
    state: "Borno",
    zone: "North East",
    source: "Operation event service",
    created: "08:42",
    updated: "09:11",
    occurrences: 1,
    fact: "A closure event was recorded on a corridor.",
    action: "No further action unless a delivery becomes associated.",
    disruption: {
      validUntil: "12:00",
      affected: 0,
      verification: "Verified operation event",
    },
  },
];

type IconType =
  | "alert"
  | "check"
  | "clock"
  | "cloud"
  | "filter"
  | "link"
  | "note"
  | "person"
  | "search"
  | "spark"
  | "telemetry"
  | "trend";

function IntelligenceIcon({
  type,
  className,
}: {
  type: IconType;
  className?: string;
}) {
  const icons: Record<IconType, LucideIcon> = {
    alert: AlertTriangle,
    check: Check,
    clock: Clock3,
    cloud: CloudRain,
    filter: ListFilter,
    link: Link,
    note: FileText,
    person: UserRound,
    search: Search,
    spark: Sparkles,
    telemetry: RadioTower,
    trend: TrendingUp,
  };
  const Component = icons[type];
  return (
    <Component className={className} aria-hidden="true" strokeWidth={1.8} />
  );
}

const typeIcons: Record<AlertType, IconType> = {
  Overdue: "clock",
  "Delivery risk": "trend",
  "Telemetry stale": "telemetry",
  Weather: "cloud",
  Disruption: "alert",
  "Resource conflict": "link",
};

export default function Intelligence() {
  const { currentUser } = useData();
  const { can } = usePermissions();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedId, setSelectedId] = useState(initialAlerts[0].id);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All severities");
  const [type, setType] = useState("All types");
  const [reviewStatus, setReviewStatus] = useState("Open alerts");
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");

  const visibleAlerts = useMemo(
    () =>
      alerts.filter((alert) => {
        const matchesQuery =
          `${alert.id} ${alert.entity} ${alert.vehicle ?? ""} ${alert.title} ${alert.state}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesSeverity =
          severity === "All severities" || alert.severity === severity;
        const matchesType = type === "All types" || alert.type === type;
        const matchesStatus =
          reviewStatus === "All statuses" ||
          (reviewStatus === "Open alerts"
            ? alert.status !== "Resolved"
            : alert.status === reviewStatus);
        return matchesQuery && matchesSeverity && matchesType && matchesStatus;
      }),
    [alerts, query, reviewStatus, severity, type],
  );

  const selected =
    alerts.find((alert) => alert.id === selectedId) ?? visibleAlerts[0];
  const openCount = alerts.filter(
    (alert) => alert.status !== "Resolved",
  ).length;

  function updateSelected(status: ReviewStatus) {
    if (!selected) return;
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === selected.id
          ? { ...alert, status, updated: "09:36" }
          : alert,
      ),
    );
  }

  return (
    <div className="min-h-dvh pt-6.5 pb-4.5 max-md:pt-5.5 max-md:pb-4 px-7.5 max-md:px-3.5">
      <div className="mb-4.75 flex items-end justify-between max-md:items-start max-md:flex-col max-md:gap-3.25">
        <div>
          <div className="flex items-center text-slate-400 text-xs max-lg:text-xs font-bold tracking-wide gap-1.75">
            <span className="text-slate-500">OPERATIONS</span>
            <i className="w-0.75 h-0.75 rounded-full bg-slate-400" />
            INTELLIGENCE REVIEW · NIGERIA
          </div>
          <h1 className="mt-1.75 mb-1 text-3xl font-bold tracking-tight">
            Intelligence & alerts
          </h1>
          <p className="mt-1 mb-0 text-slate-500 text-xs max-lg:text-xs mx-0">
            Review operational risks, recorded evidence and AI-assisted
            predictions.
          </p>
        </div>
      </div>

      <section className="min-h-18.25 mb-3 grid grid-cols-5 rounded-lg bg-white border border-slate-200 max-xl:grid-cols-3 max-xl:gap-y-2.5 max-md:grid-cols-2 py-2 max-xl:py-3 px-3.75">
        <div className="min-w-0 grid grid-cols-2 grid-rows-2 items-center gap-x-2.5 border-r border-r-slate-200 py-0 max-md:py-1.25 px-4 max-md:px-2">
          <span
            className="w-8.25 h-8.25 row-span-2 grid place-items-center rounded-lg text-red-600 bg-red-50"
            data-state="red"
          >
            <IntelligenceIcon className="w-4.25 h-4.25" type="clock" />
          </span>
          <p className="mt-1.75 mb-0 self-end mx-0">
            <strong className="inline mr-1.25 text-slate-700 font-bold text-base leading-normal font-sans not-italic">
              4
            </strong>
            <span className="inline text-slate-500 text-xs max-lg:text-xs font-semibold">
              Overdue
            </span>
          </p>
          <small className="self-start text-slate-400 text-xs max-lg:text-xs">
            Recorded fact
          </small>
        </div>
        <div className="min-w-0 grid grid-cols-2 grid-rows-2 items-center gap-x-2.5 border-r border-r-slate-200 max-md:border-0 py-0 max-md:py-1.25 px-4 max-md:px-2">
          <span
            className="w-8.25 h-8.25 row-span-2 grid place-items-center rounded-lg text-amber-700 bg-amber-100"
            data-state="amber"
          >
            <IntelligenceIcon className="w-4.25 h-4.25" type="trend" />
          </span>
          <p className="mt-1.75 mb-0 self-end mx-0">
            <strong className="inline mr-1.25 text-slate-700 font-bold text-base leading-normal font-sans not-italic">
              6
            </strong>
            <span className="inline text-slate-500 text-xs max-lg:text-xs font-semibold">
              At risk
            </span>
          </p>
          <small className="self-start text-slate-400 text-xs max-lg:text-xs">
            Model prediction
          </small>
        </div>
        <div className="min-w-0 grid grid-cols-2 grid-rows-2 items-center gap-x-2.5 border-r border-r-slate-200 max-xl:border-0 py-0 max-md:py-1.25 px-4 max-md:px-2">
          <span
            className="w-8.25 h-8.25 row-span-2 grid place-items-center rounded-lg text-slate-500 bg-slate-100"
            data-state="purple"
          >
            <IntelligenceIcon className="w-4.25 h-4.25" type="cloud" />
          </span>
          <p className="mt-1.75 mb-0 self-end mx-0">
            <strong className="inline mr-1.25 text-slate-700 font-bold text-base leading-normal font-sans not-italic">
              2
            </strong>
            <span className="inline text-slate-500 text-xs max-lg:text-xs font-semibold">
              Disruptions
            </span>
          </p>
          <small className="self-start text-slate-400 text-xs max-lg:text-xs">
            Verified operation
          </small>
        </div>
        <div className="min-w-0 grid grid-cols-2 grid-rows-2 items-center gap-x-2.5 border-r border-r-slate-200 max-md:border-0 py-0 max-md:py-1.25 px-4 max-md:px-2">
          <span
            className="w-8.25 h-8.25 row-span-2 grid place-items-center rounded-lg text-slate-500 bg-slate-100"
            data-state="slate"
          >
            <IntelligenceIcon className="w-4.25 h-4.25" type="telemetry" />
          </span>
          <p className="mt-1.75 mb-0 self-end mx-0">
            <strong className="inline mr-1.25 text-slate-700 font-bold text-base leading-normal font-sans not-italic">
              1
            </strong>
            <span className="inline text-slate-500 text-xs max-lg:text-xs font-semibold">
              Stale telemetry
            </span>
          </p>
          <small className="self-start text-slate-400 text-xs max-lg:text-xs">
            Data quality
          </small>
        </div>
        <div className="min-w-0 grid grid-cols-2 grid-rows-2 items-center gap-x-2.5 border-r border-r-slate-200 border-0 max-md:col-span-full py-0 max-md:py-1.25 px-4 max-md:px-2">
          <span
            className="w-8.25 h-8.25 row-span-2 grid place-items-center rounded-lg text-blue-600 bg-blue-50"
            data-state="blue"
          >
            <IntelligenceIcon className="w-4.25 h-4.25" type="alert" />
          </span>
          <p className="mt-1.75 mb-0 self-end mx-0">
            <strong className="inline mr-1.25 text-slate-700 font-bold text-base leading-normal font-sans not-italic">
              {openCount}
            </strong>
            <span className="inline text-slate-500 text-xs max-lg:text-xs font-semibold">
              Open alerts
            </span>
          </p>
          <small className="self-start text-slate-400 text-xs max-lg:text-xs">
            Needs review
          </small>
        </div>
      </section>

      <section className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="min-h-14.25 flex items-center border-b border-b-slate-200 max-xl:flex-wrap max-sm:flex-col max-sm:items-stretch gap-1.75 py-2.25 px-3">
          <label
            className="h-8.75 flex items-center rounded-md bg-slate-50 border border-slate-300 max-sm:w-full gap-1.25 py-0 px-2 w-80 max-w-full mr-auto max-xl:w-full"
            data-slot="intel-search"
          >
            <IntelligenceIcon
              className="w-3.5 h-3.5 text-slate-500"
              type="search"
            />
            <input
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 w-full outline-none text-slate-700 bg-transparent text-xs border-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search alert, delivery, vehicle or state"
            />
          </label>
          <label className="h-8.75 flex items-center rounded-md bg-white border border-slate-300 max-sm:w-full gap-1.25 py-0 px-2">
            <IntelligenceIcon
              className="w-3.5 h-3.5 text-slate-500"
              type="filter"
            />
            <select
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 outline-none text-slate-600 bg-transparent text-xs font-semibold border-0"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option>All severities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <label className="h-8.75 flex items-center rounded-md bg-white border border-slate-300 max-sm:w-full gap-1.25 py-0 px-2">
            <select
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 outline-none text-slate-600 bg-transparent text-xs font-semibold border-0"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>All types</option>
              <option>Overdue</option>
              <option>Delivery risk</option>
              <option>Telemetry stale</option>
              <option>Weather</option>
              <option>Disruption</option>
              <option>Resource conflict</option>
            </select>
          </label>
          <label className="h-8.75 flex items-center rounded-md bg-white border border-slate-300 max-sm:w-full gap-1.25 py-0 px-2">
            <select
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 outline-none text-slate-600 bg-transparent text-xs font-semibold border-0"
              value={reviewStatus}
              onChange={(event) => setReviewStatus(event.target.value)}
            >
              <option>Open alerts</option>
              <option>All statuses</option>
              <option>New</option>
              <option>Acknowledged</option>
              <option>Under review</option>
              <option>Resolved</option>
            </select>
          </label>
        </div>

        <div className="min-h-167.5 grid grid-cols-3 max-xl:grid-cols-3 max-md:block">
          <aside className="min-w-0 border-r border-r-slate-200 bg-slate-50 max-md:max-h-97.5 max-md:border-r-0 max-md:border-b max-md:border-b-slate-200 max-md:overflow-auto">
            <div className="min-h-14.5 flex items-start justify-between border-b border-b-slate-200 bg-white py-2.75 px-3.5">
              <div>
                <h2 className="text-slate-700 font-bold text-xs max-lg:text-xs leading-normal font-sans not-italic my-0 mx-0">
                  Review queue
                </h2>
                <p className="mt-0.75 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                  {visibleAlerts.length} matching alerts · sorted by severity
                </p>
              </div>
              <button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 rounded-md text-slate-500 bg-white text-xs max-lg:text-xs border border-slate-200 py-1 px-1.75">
                Newest first
              </button>
            </div>
            <div className="max-h-180 overflow-y-auto max-md:max-h-82.5">
              {visibleAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => {
                    setSelectedId(alert.id);
                    setSavedNote("");
                    setNote("");
                  }}
                  className={[
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 w-full min-h-28.75 flex items-start border-t-0 border-r-0 border-b border-b-slate-200 border-l-0 text-inherit text-left hover:bg-slate-50 gap-2.25 py-3.25 px-2.75",
                    String(selected?.id === alert.id ? "selected" : "")
                      .split(" ")
                      .includes("selected")
                      ? "bg-blue-50 ring-2 ring-blue-600"
                      : "bg-white",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-state={selected?.id === alert.id ? "selected" : ""}
                >
                  <span
                    className={[
                      "w-7.75 h-7.75 flex-none grid place-items-center rounded-lg",
                      String(alert.severity.toLowerCase())
                        .split(" ")
                        .includes("critical")
                        ? "text-red-600 bg-red-50"
                        : "",
                      String(alert.severity.toLowerCase())
                        .split(" ")
                        .includes("high")
                        ? "text-amber-700 bg-amber-100"
                        : "",
                      String(alert.severity.toLowerCase())
                        .split(" ")
                        .includes("medium")
                        ? "text-slate-500 bg-slate-100"
                        : "",
                      String(alert.severity.toLowerCase())
                        .split(" ")
                        .includes("low")
                        ? "text-slate-500 bg-slate-100"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-state={alert.severity.toLowerCase()}
                  >
                    <IntelligenceIcon
                      className="w-4 h-4"
                      type={typeIcons[alert.type]}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <b
                        className={[
                          "w-fit inline-block rounded-lg text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap py-0.75 px-1.5",
                          String(alert.severity.toLowerCase())
                            .split(" ")
                            .includes("critical")
                            ? "text-red-700 bg-red-100"
                            : "",
                          String(alert.severity.toLowerCase())
                            .split(" ")
                            .includes("high")
                            ? "text-amber-700 bg-amber-100"
                            : "",
                          String(alert.severity.toLowerCase())
                            .split(" ")
                            .includes("medium")
                            ? "text-slate-500 bg-slate-100"
                            : "",
                          String(alert.severity.toLowerCase())
                            .split(" ")
                            .includes("low")
                            ? "text-slate-500 bg-slate-100"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-state={alert.severity.toLowerCase()}
                      >
                        {alert.severity}
                      </b>
                      <em className="text-slate-400 text-xs max-lg:text-xs not-italic">
                        {alert.updated} WAT
                      </em>
                    </span>
                    <strong className="block whitespace-nowrap text-ellipsis mt-1.75 text-slate-700 text-xs max-lg:text-xs overflow-hidden">
                      {alert.title}
                    </strong>
                    <small className="block whitespace-nowrap text-ellipsis mt-1 text-slate-400 text-xs max-lg:text-xs overflow-hidden">
                      {alert.entity}
                      {alert.vehicle ? ` · ${alert.vehicle}` : ""} ·{" "}
                      {alert.state}
                    </small>
                    <span className="mt-2 flex items-center gap-1.5">
                      <i className="text-slate-500 text-xs max-lg:text-xs not-italic">
                        {alert.type}
                      </i>
                      <i
                        className={[
                          "w-fit inline-block rounded-lg text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap text-slate-500 bg-slate-100 py-0.75 px-1.5",
                          String(alert.status.toLowerCase().replace(" ", "-"))
                            .split(" ")
                            .includes("new")
                            ? "text-blue-700 bg-blue-50"
                            : "",
                          String(alert.status.toLowerCase().replace(" ", "-"))
                            .split(" ")
                            .includes("acknowledged")
                            ? "text-amber-800 bg-amber-100"
                            : "",
                          String(alert.status.toLowerCase().replace(" ", "-"))
                            .split(" ")
                            .includes("under-review")
                            ? "text-slate-500 bg-slate-100"
                            : "",
                          String(alert.status.toLowerCase().replace(" ", "-"))
                            .split(" ")
                            .includes("resolved")
                            ? "text-teal-800 bg-slate-200"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-slot="review-label"
                        data-state={alert.status
                          .toLowerCase()
                          .replace(" ", "-")}
                      >
                        {alert.status}
                      </i>
                    </span>
                  </span>
                  <span className="pt-9.5 text-slate-400">
                    <ChevronRight aria-hidden="true" />
                  </span>
                </button>
              ))}
              {!visibleAlerts.length && (
                <div className="min-h-87.5 flex flex-col items-center justify-center text-slate-400">
                  <IntelligenceIcon className="w-5.75 h-5.75" type="search" />
                  <strong className="mt-2.25 text-slate-600 text-xs max-lg:text-xs">
                    No matching alerts
                  </strong>
                  <span className="mt-0.75 text-xs max-lg:text-xs">
                    Change the current search or filters.
                  </span>
                </div>
              )}
            </div>
          </aside>

          {selected ? (
            <article className="min-w-0 bg-slate-50 md:col-span-2">
              <div className="min-h-29 flex justify-between border-b border-b-slate-200 bg-white gap-5 py-4.5 max-md:py-4 px-5.25 max-md:px-4">
                <div>
                  <span
                    className={[
                      "w-fit inline-block rounded-lg text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap py-0.75 px-1.5",
                      String(selected.severity.toLowerCase())
                        .split(" ")
                        .includes("critical")
                        ? "text-red-700 bg-red-100"
                        : "",
                      String(selected.severity.toLowerCase())
                        .split(" ")
                        .includes("high")
                        ? "text-amber-700 bg-amber-100"
                        : "",
                      String(selected.severity.toLowerCase())
                        .split(" ")
                        .includes("medium")
                        ? "text-slate-500 bg-slate-100"
                        : "",
                      String(selected.severity.toLowerCase())
                        .split(" ")
                        .includes("low")
                        ? "text-slate-500 bg-slate-100"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-state={selected.severity.toLowerCase()}
                  >
                    {selected.severity}
                  </span>
                  <span
                    className={[
                      "w-fit inline-block rounded-lg text-xs max-lg:text-xs not-italic font-bold whitespace-nowrap text-slate-500 bg-slate-100 py-0.75 px-1.5 ml-1.25",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("new")
                        ? "text-blue-700 bg-blue-50"
                        : "",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("acknowledged")
                        ? "text-amber-800 bg-amber-100"
                        : "",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("under-review")
                        ? "text-slate-500 bg-slate-100"
                        : "",
                      String(selected.status.toLowerCase().replace(" ", "-"))
                        .split(" ")
                        .includes("resolved")
                        ? "text-teal-800 bg-slate-200"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-slot="review-label"
                    data-state={selected.status.toLowerCase().replace(" ", "-")}
                  >
                    {selected.status}
                  </span>
                  <h2 className="mt-2.25 mb-1 text-slate-700 font-bold text-base leading-normal font-sans not-italic mx-0">
                    {selected.title}
                  </h2>
                  <p className="text-slate-500 text-xs max-lg:text-xs my-0 mx-0">
                    {selected.description}
                  </p>
                </div>
                <div className="min-w-18 text-right">
                  <span className="block text-slate-400 text-xs max-lg:text-xs tracking-wide">
                    ALERT ID
                  </span>
                  <strong className="block mt-1 text-slate-500 text-xs max-lg:text-xs">
                    {selected.id}
                  </strong>
                </div>
              </div>
              <div className="min-h-15 grid grid-cols-4 items-center border-b border-b-slate-200 bg-white max-md:grid-cols-2 max-md:gap-y-3 gap-2.5 py-2.5 max-md:py-3 px-5.25 max-md:px-4">
                <div className="pr-2.5 border-r border-r-slate-200">
                  <span className="block mb-1 text-slate-400 text-xs max-lg:text-xs">
                    Related record
                  </span>
                  <strong className="block text-slate-600 text-xs max-lg:text-xs whitespace-nowrap text-ellipsis overflow-hidden">
                    {selected.entity}
                  </strong>
                </div>
                <div className="pr-2.5 border-r border-r-slate-200 max-md:border-0">
                  <span className="block mb-1 text-slate-400 text-xs max-lg:text-xs">
                    Location
                  </span>
                  <strong className="block text-slate-600 text-xs max-lg:text-xs whitespace-nowrap text-ellipsis overflow-hidden">
                    {selected.state} · {selected.zone}
                  </strong>
                </div>
                <div className="pr-2.5 border-r border-r-slate-200">
                  <span className="block mb-1 text-slate-400 text-xs max-lg:text-xs">
                    Source
                  </span>
                  <strong className="block text-slate-600 text-xs max-lg:text-xs whitespace-nowrap text-ellipsis overflow-hidden">
                    {selected.source}
                  </strong>
                </div>
                <div className="pr-2.5 border-r border-r-slate-200 border-0">
                  <span className="block mb-1 text-slate-400 text-xs max-lg:text-xs">
                    Last updated
                  </span>
                  <strong className="block text-slate-600 text-xs max-lg:text-xs whitespace-nowrap text-ellipsis overflow-hidden">
                    {selected.updated} WAT
                  </strong>
                </div>
              </div>

              {selected.prediction && (
                <section className="mt-3.5 mb-0 rounded-lg bg-slate-50 border border-slate-300 mx-4 overflow-hidden">
                  <div className="h-9.75 flex items-center justify-between border-b border-b-slate-200 py-0 px-3.25">
                    <span className="flex items-center text-slate-500 gap-1.75">
                      <IntelligenceIcon className="w-4 h-4" type="spark" />
                      <strong className="text-slate-600 text-xs max-lg:text-xs">
                        AI-assisted prediction
                      </strong>
                    </span>
                    <b className="rounded-lg text-slate-500 bg-slate-100 text-xs max-lg:text-xs py-0.75 px-1.5">
                      ETA v0.1
                    </b>
                  </div>
                  <div className="min-h-20.5 flex items-center max-md:flex-wrap gap-5.5 max-md:gap-3 py-3.25 px-4.5">
                    <div>
                      <span className="block mb-0.75 text-slate-500 text-xs max-lg:text-xs">
                        Scheduled arrival
                      </span>
                      <strong className="inline text-slate-700 font-bold text-xl leading-normal font-sans not-italic">
                        {selected.prediction.deadline}
                      </strong>
                      <small className="inline ml-0.75 text-slate-400 text-xs max-lg:text-xs">
                        WAT
                      </small>
                    </div>
                    <i className="text-slate-400 not-italic">
                      <ArrowRight aria-hidden="true" />
                    </i>
                    <div data-state="predicted">
                      <span className="block mb-0.75 text-slate-500 text-xs max-lg:text-xs">
                        Predicted arrival
                      </span>
                      <strong className="inline text-red-600 font-bold text-xl leading-normal font-sans not-italic">
                        {selected.prediction.arrival}
                      </strong>
                      <small className="inline ml-0.75 text-slate-400 text-xs max-lg:text-xs">
                        WAT
                      </small>
                    </div>
                    <div
                      className="ml-auto rounded-md bg-red-100 max-md:w-full py-2.25 px-3.25 max-md:my-0 max-md:mx-0"
                      data-state="delay-result"
                    >
                      <span className="block mb-0.75 text-slate-500 text-xs max-lg:text-xs">
                        Estimated lateness
                      </span>
                      <strong className="inline text-amber-700 font-bold text-sm leading-normal font-sans not-italic">
                        {selected.prediction.lateness} min
                      </strong>
                    </div>
                  </div>
                  <div className="min-h-7.5 flex border-t border-t-slate-200 text-slate-400 bg-slate-100 text-xs max-lg:text-xs max-md:items-start max-md:flex-col gap-4.5 max-md:gap-1 py-1.75 px-3.25">
                    <span className="">
                      · Generated {selected.prediction.generated} WAT
                    </span>
                    <span>Prediction details</span>
                    <span>No action automatically applied</span>
                  </div>
                </section>
              )}

              {selected.disruption && (
                <section className="mt-3.5 mb-0 flex items-center rounded-lg bg-slate-50 border border-slate-200 gap-2.75 py-3.25 px-3.25 mx-4">
                  <span className="w-8.5 h-8.5 grid place-items-center rounded-lg text-slate-500 bg-slate-100">
                    <IntelligenceIcon className="w-4.25 h-4.25" type="cloud" />
                  </span>
                  <div className="flex-1">
                    <span className="text-slate-500 text-xs max-lg:text-xs font-bold tracking-wide">
                      EVENT DETAILS
                    </span>
                    <strong className="mt-0.75 block text-slate-700 text-xs max-lg:text-xs">
                      {selected.title}
                    </strong>
                    <p className="mt-0.75 mb-0 text-slate-500 text-xs max-lg:text-xs mx-0">
                      {selected.zone} · Valid until{" "}
                      {selected.disruption.validUntil} WAT
                    </p>
                  </div>
                  <div className="pl-3.75 border-l border-l-slate-200 text-center">
                    <span className="text-slate-500 text-xs max-lg:text-xs font-bold tracking-wide">
                      AFFECTED DELIVERIES
                    </span>
                    <strong className="mt-0.75 block text-slate-500 text-lg max-lg:text-xs font-bold leading-normal font-sans not-italic">
                      {selected.disruption.affected}
                    </strong>
                  </div>
                </section>
              )}

              <div className="mt-3.5 mb-0 grid grid-cols-2 max-xl:grid-cols-1 gap-2.5 mx-4">
                <section className="rounded-lg bg-white border border-slate-200 py-3.25 px-3.25">
                  <div className="flex items-center gap-2">
                    <span className="w-7.25 h-7.25 grid place-items-center rounded-md text-blue-600 bg-blue-50">
                      <IntelligenceIcon
                        className="w-3.75 h-3.75"
                        type="check"
                      />
                    </span>
                    <div>
                      <h3 className="text-slate-700 font-bold text-xs max-lg:text-xs leading-normal font-sans not-italic my-0 mx-0">
                        Recorded fact
                      </h3>
                      <p className="mt-0.5 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                        Evidence from operational event records
                      </p>
                    </div>
                  </div>
                  <blockquote className="min-h-10.5 border-l-2 border-l-blue-600 text-slate-500 bg-slate-50 text-xs max-lg:text-xs leading-normal py-2.25 px-2.25 my-3 mx-0">
                    {selected.fact}
                  </blockquote>
                  <div className="flex text-slate-400 text-xs max-lg:text-xs gap-1.5">
                    <span>Source</span>
                    <strong className="text-slate-500">
                      {selected.source}
                    </strong>
                    <span>First detected</span>
                    <strong className="text-slate-500">
                      {selected.created} WAT
                    </strong>
                  </div>
                </section>
                <section className="rounded-lg bg-white border border-slate-200 py-3.25 px-3.25">
                  <div className="flex items-center gap-2">
                    <span className="w-7.25 h-7.25 grid place-items-center rounded-md text-amber-700 bg-amber-100">
                      <IntelligenceIcon className="w-3.75 h-3.75" type="note" />
                    </span>
                    <div>
                      <h3 className="text-slate-700 font-bold text-xs max-lg:text-xs leading-normal font-sans not-italic my-0 mx-0">
                        Recommended review
                      </h3>
                      <p className="mt-0.5 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                        Guidance for human assessment
                      </p>
                    </div>
                  </div>
                  <p className="min-h-10.5 text-slate-500 text-xs max-lg:text-xs leading-normal my-3 mx-0">
                    {selected.action}
                  </p>
                  <small className="pt-2 block border-t border-t-slate-200 text-slate-500 text-xs max-lg:text-xs">
                    Recommendations do not change approved assignments.
                  </small>
                </section>
              </div>

              {can("manage_operations") ? (
                <section className="mt-3.5 mb-0 rounded-lg bg-white border border-slate-200 py-3.5 px-3.5 mx-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-slate-700 font-bold text-xs max-lg:text-xs leading-normal font-sans not-italic my-0 mx-0">
                        Coordinator review
                      </h3>
                      <p className="mt-0.75 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                        Record a note before updating this alert.
                      </p>
                    </div>
                    <span className="flex items-center text-slate-500 text-xs max-lg:text-xs gap-1">
                      <IntelligenceIcon
                        className="w-3.25 h-3.25"
                        type="person"
                      />
                      {currentUser.name}
                    </span>
                  </div>
                  {savedNote && (
                    <div className="mt-2.5 flex rounded-md text-emerald-700 bg-emerald-50 gap-2 py-2.25 px-2.25">
                      <IntelligenceIcon
                        className="w-3.75 h-3.75"
                        type="check"
                      />
                      <div>
                        <strong className="block text-teal-900 text-xs max-lg:text-xs">
                          Review note recorded
                        </strong>
                        <p className="text-slate-500 text-xs max-lg:text-xs my-0.75 mx-0">
                          {savedNote}
                        </p>
                        <span className="block text-slate-500 text-xs max-lg:text-xs">
                          {currentUser.name} · 3 Dec 2026, 09:36 WAT
                        </span>
                      </div>
                    </div>
                  )}
                  <textarea
                    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base w-full mt-2.75 resize-y rounded-md outline-none text-slate-600 bg-slate-50 text-xs leading-normal border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 py-2.25 px-2.25"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add context, findings or the reason for your decision…"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-between max-xl:items-stretch max-xl:flex-col gap-2.5">
                    <button
                      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-7.75 rounded-md flex items-center text-blue-600 bg-white text-xs max-lg:text-xs font-bold border border-slate-300 hover:bg-slate-50 gap-1 py-0 px-2.25"
                      data-state="assign-action"
                      onClick={() => updateSelected("Under review")}
                    >
                      <IntelligenceIcon
                        className="w-3.25 h-3.25"
                        type="person"
                      />
                      Assign to me
                    </button>
                    <div className="flex max-xl:justify-end max-md:grid max-md:grid-cols-2 gap-1.25">
                      <button
                        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-7.75 rounded-md flex items-center text-slate-500 bg-white text-xs max-lg:text-xs font-bold border border-slate-300 hover:bg-slate-50 gap-1 py-0 px-2.25"
                        onClick={() => updateSelected("Acknowledged")}
                      >
                        Acknowledge
                      </button>
                      <button
                        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-7.75 rounded-md flex items-center text-slate-500 bg-white text-xs max-lg:text-xs font-bold border border-slate-300 hover:bg-slate-50 gap-1 py-0 px-2.25"
                        onClick={() => {
                          updateSelected("Under review");
                          if (note.trim()) {
                            setSavedNote(note.trim());
                            setNote("");
                          }
                        }}
                      >
                        Start review
                      </button>
                      <button
                        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 h-7.75 rounded-md flex items-center text-white bg-emerald-700 text-xs max-lg:text-xs font-bold border border-emerald-700 hover:bg-emerald-800 gap-1 py-0 px-2.25 max-md:col-span-full"
                        data-state="resolve-action"
                        onClick={() => {
                          updateSelected("Resolved");
                          if (note.trim()) {
                            setSavedNote(note.trim());
                            setNote("");
                          }
                        }}
                      >
                        <IntelligenceIcon
                          className="w-3.25 h-3.25"
                          type="check"
                        />
                        Resolve
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="mt-3.5 mb-0 rounded-lg bg-white border border-slate-200 py-3.5 px-3.5 mx-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-slate-700 font-bold text-xs max-lg:text-xs leading-normal font-sans not-italic my-0 mx-0">
                        Read-only review
                      </h3>
                      <p className="mt-0.75 mb-0 text-slate-400 text-xs max-lg:text-xs mx-0">
                        Only an Operations Coordinator can update alert workflow
                        state.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <footer className="mt-3.5 flex justify-center border-t border-t-slate-200 text-slate-400 bg-slate-100 text-xs max-lg:text-xs max-md:items-center max-md:flex-wrap max-md:gap-y-1.75 max-md:gap-x-3 gap-4.5 py-2.5 px-4">
                <span className="">· Created {selected.created} WAT</span>
                <span>Updated {selected.updated} WAT</span>
                <span>
                  {selected.occurrences} occurrence
                  {selected.occurrences === 1 ? "" : "s"}
                </span>
                <span>Stable condition key · no duplicate alerts</span>
              </footer>
            </article>
          ) : (
            <div className="min-h-87.5 flex flex-col items-center justify-center text-slate-400">
              <IntelligenceIcon className="w-5.75 h-5.75" type="alert" />
              <strong className="mt-2.25 text-slate-600 text-xs max-lg:text-xs">
                Select an alert to review
              </strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
