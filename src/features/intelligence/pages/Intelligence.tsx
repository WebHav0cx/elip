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
  prediction?: { deadline: string; arrival: string; lateness: number; generated: string };
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
    prediction: { deadline: "10:30", arrival: "10:58", lateness: 28, generated: "09:26" },
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
    action: "Check communications status before relying on the displayed position.",
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
    action: "Review affected delivery estimates. Do not infer delay without evidence.",
    disruption: { validUntil: "11:30", affected: 4, verification: "Verified operation event" },
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
    disruption: { validUntil: "12:00", affected: 0, verification: "Verified operation event" },
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

function IntelligenceIcon({ type }: { type: IconType }) {
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
  return <Component aria-hidden="true" strokeWidth={1.8} />;
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
        const matchesSeverity = severity === "All severities" || alert.severity === severity;
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

  const selected = alerts.find((alert) => alert.id === selectedId) ?? visibleAlerts[0];
  const openCount = alerts.filter((alert) => alert.status !== "Resolved").length;

  function updateSelected(status: ReviewStatus) {
    if (!selected) return;
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === selected.id ? { ...alert, status, updated: "09:36" } : alert,
      ),
    );
  }

  return (
    <div className={`
  min-h-workspace! pt-6.5! pr-7.5! pb-4.5! pl-7.5!
  max-workspace-mobile:pt-5.5! max-workspace-mobile:pr-3.5! max-workspace-mobile:pb-4! max-workspace-mobile:pl-3.5!
`}>
      <div className={`
  mb-4.75! flex! items-end! justify-between! [&_h1]:mt-1.75!
  [&_>_div:first-child_>_p]:mt-1! [&_>_div:first-child_>_p]:mr-0! [&_>_div:first-child_>_p]:mb-0!
  [&_>_div:first-child_>_p]:ml-0! [&_>_div:first-child_>_p]:text-slate-500!
  [&_>_div:first-child_>_p]:text-detail! max-lg:[&_>_div:first-child_>_p]:text-xs! max-workspace-mobile:items-start! max-workspace-mobile:flex-col!
  max-workspace-mobile:gap-y-3.25! max-workspace-mobile:gap-x-3.25!
`}>
        <div>
          <div className={`
  flex! items-center! gap-y-1.75! gap-x-1.75! text-slate-400! text-label! max-lg:text-xs! font-bold!
  tracking-section! [&_span]:text-slate-500! [&_i]:w-0.75! [&_i]:h-0.75! [&_i]:rounded-full!
  [&_i]:bg-slate-400!
`}>
            <span>OPERATIONS</span>
            <i />
            INTELLIGENCE REVIEW · NIGERIA
          </div>
          <h1>Intelligence & alerts</h1>
          <p>Review operational risks, recorded evidence and AI-assisted predictions.</p>
        </div>
      </div>

      <section className={`
  min-h-18.25! mb-3! pt-2! pr-3.75! pb-2! pl-3.75! grid!
  grid-cols-5! rounded-lg! bg-white! border! border-solid! border-slate-200!
  [&_>_div]:min-w-0! [&_>_div]:pt-0! [&_>_div]:pr-4! [&_>_div]:pb-0! [&_>_div]:pl-4! [&_>_div]:grid!
  [&_>_div]:grid-cols-timeline! [&_>_div]:grid-rows-2!
  [&_>_div]:items-center! [&_>_div]:gap-x-2.5! [&_>_div]:border-r!
  [&_>_div]:border-solid! [&_>_div]:border-r-slate-200!
  [&_>_div:last-child]:border-0! 
  [&_>_div:last-child]:border-current! [&_p]:mt-1.75! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0!
  [&_p]:self-end! [&_p_strong]:inline! [&_p_strong]:mr-1.25! [&_p_strong]:text-slate-700!
  [&_p_strong]:font-bold! [&_p_strong]:text-base! [&_p_strong]:leading-default!
  [&_p_strong]:font-sans! [&_p_strong]:not-italic! [&_p_span]:inline! [&_p_span]:text-slate-500!
  [&_p_span]:text-label! max-lg:[&_p_span]:text-xs! [&_p_span]:font-semibold! [&_small]:self-start! [&_small]:text-slate-400!
  [&_small]:text-fine! max-lg:[&_small]:text-xs! max-intelligence-compact:grid-cols-3! max-intelligence-compact:gap-y-2.5!
  max-intelligence-compact:pt-3! max-intelligence-compact:pb-3! max-intelligence-compact:[&_>_div:nth-child(3)]:border-0!
  
  max-intelligence-compact:[&_>_div:nth-child(3)]:border-current!
  max-workspace-mobile:grid-cols-2! max-workspace-mobile:[&_>_div]:pt-1.25! max-workspace-mobile:[&_>_div]:pr-2!
  max-workspace-mobile:[&_>_div]:pb-1.25! max-workspace-mobile:[&_>_div]:pl-2! max-workspace-mobile:[&_>_div:nth-child(2)]:border-0!
  
  max-workspace-mobile:[&_>_div:nth-child(2)]:border-current!
  max-workspace-mobile:[&_>_div:nth-child(4)]:border-0! 
  max-workspace-mobile:[&_>_div:nth-child(4)]:border-current!
  max-workspace-mobile:[&_>_div:last-child]:col-span-full!
`}>
        <div>
          <span className={`
  w-8.25! h-8.25! row-span-2! grid! place-items-center! rounded-control!
  [&_svg]:w-4.25! [&_svg]:h-4.25! data-[state~=red]:text-red-600! data-[state~=red]:bg-red-50! data-[state~=amber]:text-amber-700!
  data-[state~=amber]:bg-amber-100! data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100! data-[state~=slate]:text-slate-500!
  data-[state~=slate]:bg-slate-100! data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50!
`} data-state="red">
            <IntelligenceIcon type="clock" />
          </span>
          <p>
            <strong>4</strong>
            <span>Overdue</span>
          </p>
          <small>Recorded fact</small>
        </div>
        <div>
          <span className={`
  w-8.25! h-8.25! row-span-2! grid! place-items-center! rounded-control!
  [&_svg]:w-4.25! [&_svg]:h-4.25! data-[state~=red]:text-red-600! data-[state~=red]:bg-red-50! data-[state~=amber]:text-amber-700!
  data-[state~=amber]:bg-amber-100! data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100! data-[state~=slate]:text-slate-500!
  data-[state~=slate]:bg-slate-100! data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50!
`} data-state="amber">
            <IntelligenceIcon type="trend" />
          </span>
          <p>
            <strong>6</strong>
            <span>At risk</span>
          </p>
          <small>Model prediction</small>
        </div>
        <div>
          <span className={`
  w-8.25! h-8.25! row-span-2! grid! place-items-center! rounded-control!
  [&_svg]:w-4.25! [&_svg]:h-4.25! data-[state~=red]:text-red-600! data-[state~=red]:bg-red-50! data-[state~=amber]:text-amber-700!
  data-[state~=amber]:bg-amber-100! data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100! data-[state~=slate]:text-slate-500!
  data-[state~=slate]:bg-slate-100! data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50!
`} data-state="purple">
            <IntelligenceIcon type="cloud" />
          </span>
          <p>
            <strong>2</strong>
            <span>Disruptions</span>
          </p>
          <small>Verified operation</small>
        </div>
        <div>
          <span className={`
  w-8.25! h-8.25! row-span-2! grid! place-items-center! rounded-control!
  [&_svg]:w-4.25! [&_svg]:h-4.25! data-[state~=red]:text-red-600! data-[state~=red]:bg-red-50! data-[state~=amber]:text-amber-700!
  data-[state~=amber]:bg-amber-100! data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100! data-[state~=slate]:text-slate-500!
  data-[state~=slate]:bg-slate-100! data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50!
`} data-state="slate">
            <IntelligenceIcon type="telemetry" />
          </span>
          <p>
            <strong>1</strong>
            <span>Stale telemetry</span>
          </p>
          <small>Data quality</small>
        </div>
        <div>
          <span className={`
  w-8.25! h-8.25! row-span-2! grid! place-items-center! rounded-control!
  [&_svg]:w-4.25! [&_svg]:h-4.25! data-[state~=red]:text-red-600! data-[state~=red]:bg-red-50! data-[state~=amber]:text-amber-700!
  data-[state~=amber]:bg-amber-100! data-[state~=purple]:text-slate-500! data-[state~=purple]:bg-slate-100! data-[state~=slate]:text-slate-500!
  data-[state~=slate]:bg-slate-100! data-[state~=blue]:text-blue-600! data-[state~=blue]:bg-blue-50!
`} data-state="blue">
            <IntelligenceIcon type="alert" />
          </span>
          <p>
            <strong>{openCount}</strong>
            <span>Open alerts</span>
          </p>
          <small>Needs review</small>
        </div>
      </section>

      <section className={`
  overflow-x-hidden! overflow-y-hidden! rounded-panel! bg-white!
  shadow-card! border! border-solid!
  border-slate-200!
`}>
        <div className={`
  min-h-14.25! pt-2.25! pr-3! pb-2.25! pl-3! flex! items-center! gap-y-1.75! gap-x-1.75!
  border-b! border-solid! border-b-slate-200!
  [&_>_label]:h-8.75! [&_>_label]:pt-0! [&_>_label]:pr-2! [&_>_label]:pb-0! [&_>_label]:pl-2!
  [&_>_label]:flex! [&_>_label]:items-center! [&_>_label]:gap-y-1.25! [&_>_label]:gap-x-1.25!
  [&_>_label]:rounded-md! [&_>_label]:bg-white! [&_>_label]:border! [&_>_label]:border-solid!
  [&_>_label]:border-slate-300! [&_svg]:w-3.5! [&_svg]:h-3.5! [&_svg]:text-slate-500!
  [&_select]:outline-none! [&_select]:text-slate-600! [&_select]:bg-transparent! [&_select]:text-label! max-lg:[&_select]:text-base!
  [&_select]:font-semibold! [&_select]:border-0! 
  [&_select]:border-current! **:data-[slot~=intel-search]:w-alert-list! **:data-[slot~=intel-search]:mr-auto!
  **:data-[slot~=intel-search]:bg-slate-50! max-intelligence-compact:flex-wrap! max-intelligence-compact:**:data-[slot~=intel-search]:w-full!
  max-workspace-mobile:[&_>_label:not([data-slot~=intel-search])]:flex-1! max-sm:flex-col! max-sm:items-stretch! max-sm:[&_label]:w-full!
`}>
          <label className={`
  [&_input]:w-full! [&_input]:outline-none! [&_input]:text-slate-700! [&_input]:bg-transparent!
  [&_input]:text-micro! max-lg:[&_input]:text-base! [&_input]:border-0!  [&_input]:border-current!
`} data-slot="intel-search">
            <IntelligenceIcon type="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search alert, delivery, vehicle or state"
            />
          </label>
          <label>
            <IntelligenceIcon type="filter" />
            <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option>All severities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>All types</option>
              <option>Overdue</option>
              <option>Delivery risk</option>
              <option>Telemetry stale</option>
              <option>Weather</option>
              <option>Disruption</option>
              <option>Resource conflict</option>
            </select>
          </label>
          <label>
            <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
              <option>Open alerts</option>
              <option>All statuses</option>
              <option>New</option>
              <option>Acknowledged</option>
              <option>Under review</option>
              <option>Resolved</option>
            </select>
          </label>
        </div>

        <div className={"min-h-167.5! grid! grid-cols-intelligence! max-intelligence-compact:grid-cols-intelligence-compact! max-workspace-mobile:block!"}>
          <aside className={`
  min-w-0! border-r! border-solid!
  border-r-slate-200! bg-slate-50! max-workspace-mobile:max-h-97.5!
  max-workspace-mobile:overflow-x-auto! max-workspace-mobile:overflow-y-auto! max-workspace-mobile:border-r-0!
   max-workspace-mobile:border-r-current!
  max-workspace-mobile:border-b! max-workspace-mobile:border-solid!
  max-workspace-mobile:border-b-slate-200!
`}>
            <div className={`
  min-h-14.5! pt-2.75! pr-3.5! pb-2.75! pl-3.5! flex! items-start!
  justify-between! border-b! border-solid!
  border-b-slate-200! bg-white! [&_h2]:mt-0! [&_h2]:mr-0! [&_h2]:mb-0!
  [&_h2]:ml-0! [&_h2]:text-slate-700! [&_h2]:font-bold! [&_h2]:text-detail! max-lg:[&_h2]:text-xs! [&_h2]:leading-default!
  [&_h2]:font-sans! [&_h2]:not-italic! [&_p]:mt-0.75! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0!
  [&_p]:text-slate-400! [&_p]:text-fine! max-lg:[&_p]:text-xs! [&_button]:pt-1! [&_button]:pr-1.75! [&_button]:pb-1!
  [&_button]:pl-1.75! [&_button]:rounded-field! [&_button]:text-slate-500! [&_button]:bg-white!
  [&_button]:text-fine! max-lg:[&_button]:text-xs! [&_button]:border! [&_button]:border-solid! [&_button]:border-slate-200!
`}>
              <div>
                <h2>Review queue</h2>
                <p>{visibleAlerts.length} matching alerts · sorted by severity</p>
              </div>
              <button>Newest first</button>
            </div>
            <div className={"max-h-180! overflow-y-auto! max-workspace-mobile:max-h-82.5!"}>
              {visibleAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => {
                    setSelectedId(alert.id);
                    setSavedNote("");
                    setNote("");
                  }}
                  className={`
  w-full! min-h-28.75! pt-3.25! pr-2.75! pb-3.25! pl-2.75! flex! items-start!
  gap-y-2.25! gap-x-2.25! border-t-0!  border-t-current!
  border-r-0!  border-r-current!
  border-b! border-solid! border-b-slate-200!
  border-l-0!  border-l-current! text-inherit!
  bg-white! text-left! [&:hover]:bg-slate-50! data-[state~=selected]:bg-blue-50!
  data-[state~=selected]:shadow-active-nav!
`} data-state={selected?.id === alert.id ? "selected" : ""}
                >
                  <span className={`
  w-7.75! h-7.75! flex-none! grid! place-items-center! rounded-control!
  [&_svg]:w-4! [&_svg]:h-4! data-[state~=critical]:text-red-600! data-[state~=critical]:bg-red-50! data-[state~=high]:text-amber-700!
  data-[state~=high]:bg-amber-100! data-[state~=medium]:text-slate-500! data-[state~=medium]:bg-slate-100! data-[state~=low]:text-slate-500!
  data-[state~=low]:bg-slate-100!
`} data-state={alert.severity.toLowerCase()}>
                    <IntelligenceIcon type={typeIcons[alert.type]} />
                  </span>
                  <span className={`
  min-w-0! flex-1! [&_>_span:first-child]:flex! [&_>_span:first-child]:items-center!
  [&_>_span:first-child]:gap-y-1.5! [&_>_span:first-child]:gap-x-1.5! [&_em]:text-slate-400!
  [&_em]:text-fine! max-lg:[&_em]:text-xs! [&_em]:not-italic! [&_>_strong]:block! [&_>_strong]:overflow-x-hidden!
  [&_>_strong]:overflow-y-hidden! [&_>_strong]:whitespace-nowrap! [&_>_strong]:text-ellipsis!
  [&_>_strong]:mt-1.75! [&_>_strong]:text-slate-700! [&_>_strong]:text-micro! max-lg:[&_>_strong]:text-xs! [&_>_small]:block!
  [&_>_small]:overflow-x-hidden! [&_>_small]:overflow-y-hidden! [&_>_small]:whitespace-nowrap!
  [&_>_small]:text-ellipsis! [&_>_small]:mt-1! [&_>_small]:text-slate-400! [&_>_small]:text-fine! max-lg:[&_>_small]:text-xs!
`}>
                    <span>
                      <b className={`
  w-fit! pt-0.75! pr-1.5! pb-0.75! pl-1.5! inline-block! rounded-lg!
  text-tiny! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! data-[state~=critical]:text-red-700! data-[state~=critical]:bg-red-100!
  data-[state~=high]:text-amber-700! data-[state~=high]:bg-amber-100! data-[state~=medium]:text-slate-500! data-[state~=medium]:bg-slate-100!
  data-[state~=low]:text-slate-500! data-[state~=low]:bg-slate-100!
`} data-state={alert.severity.toLowerCase()}>
                        {alert.severity}
                      </b>
                      <em>{alert.updated} WAT</em>
                    </span>
                    <strong>{alert.title}</strong>
                    <small>
                      {alert.entity}
                      {alert.vehicle ? ` · ${alert.vehicle}` : ""} · {alert.state}
                    </small>
                    <span className={`
  mt-2! flex! items-center! gap-y-1.5! gap-x-1.5! [&_>_i:first-child]:text-slate-500!
  [&_>_i:first-child]:text-fine! max-lg:[&_>_i:first-child]:text-xs! [&_>_i:first-child]:not-italic!
`}>
                      <i>{alert.type}</i>
                      <i className={`
  w-fit! pt-0.75! pr-1.5! pb-0.75! pl-1.5! inline-block! rounded-lg!
  text-tiny! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! text-slate-500! bg-slate-100! data-[state~=new]:text-blue-700!
  data-[state~=new]:bg-blue-50! data-[state~=acknowledged]:text-amber-800! data-[state~=acknowledged]:bg-amber-100!
  data-[state~=under-review]:text-slate-500! data-[state~=under-review]:bg-slate-100! data-[state~=resolved]:text-teal-800!
  data-[state~=resolved]:bg-slate-200!
`} data-slot="review-label" data-state={alert.status.toLowerCase().replace(" ", "-")}>
                        {alert.status}
                      </i>
                    </span>
                  </span>
                  <span className={"pt-9.5! text-slate-400!"}>
                    <ChevronRight aria-hidden="true" />
                  </span>
                </button>
              ))}
              {!visibleAlerts.length && (
                <div className={`
  min-h-87.5! flex! flex-col! items-center! justify-center! text-slate-400! [&_svg]:w-5.75!
  [&_svg]:h-5.75! [&_strong]:mt-2.25! [&_strong]:text-slate-600! [&_strong]:text-micro! max-lg:[&_strong]:text-xs!
  [&_span]:mt-0.75! [&_span]:text-fine! max-lg:[&_span]:text-xs!
`}>
                  <IntelligenceIcon type="search" />
                  <strong>No matching alerts</strong>
                  <span>Change the current search or filters.</span>
                </div>
              )}
            </div>
          </aside>

          {selected ? (
            <article className={"min-w-0! bg-slate-50!"}>
              <div className={`
  min-h-29! pt-4.5! pr-5.25! pb-4.5! pl-5.25! flex! justify-between! gap-y-5!
  gap-x-5! border-b! border-solid!
  border-b-slate-200! bg-white! **:data-[slot~=review-label]:ml-1.25! [&_h2]:mt-2.25!
  [&_h2]:mr-0! [&_h2]:mb-1! [&_h2]:ml-0! [&_h2]:text-slate-700! [&_h2]:font-bold! [&_h2]:text-base!
  [&_h2]:leading-default! [&_h2]:font-sans! [&_h2]:not-italic! [&_p]:mt-0! [&_p]:mr-0!
  [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-slate-500! [&_p]:text-label! max-lg:[&_p]:text-xs! max-workspace-mobile:pt-4! max-workspace-mobile:pr-4!
  max-workspace-mobile:pb-4! max-workspace-mobile:pl-4!
`}>
                <div>
                  <span className={`
  w-fit! pt-0.75! pr-1.5! pb-0.75! pl-1.5! inline-block! rounded-lg!
  text-tiny! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! data-[state~=critical]:text-red-700! data-[state~=critical]:bg-red-100!
  data-[state~=high]:text-amber-700! data-[state~=high]:bg-amber-100! data-[state~=medium]:text-slate-500! data-[state~=medium]:bg-slate-100!
  data-[state~=low]:text-slate-500! data-[state~=low]:bg-slate-100!
`} data-state={selected.severity.toLowerCase()}>
                    {selected.severity}
                  </span>
                  <span
                    className={`
  w-fit! pt-0.75! pr-1.5! pb-0.75! pl-1.5! inline-block! rounded-lg!
  text-tiny! max-lg:text-xs! not-italic! font-bold! whitespace-nowrap! text-slate-500! bg-slate-100! data-[state~=new]:text-blue-700!
  data-[state~=new]:bg-blue-50! data-[state~=acknowledged]:text-amber-800! data-[state~=acknowledged]:bg-amber-100!
  data-[state~=under-review]:text-slate-500! data-[state~=under-review]:bg-slate-100! data-[state~=resolved]:text-teal-800!
  data-[state~=resolved]:bg-slate-200!
`} data-slot="review-label" data-state={selected.status.toLowerCase().replace(" ", "-")}
                  >
                    {selected.status}
                  </span>
                  <h2>{selected.title}</h2>
                  <p>{selected.description}</p>
                </div>
                <div className={`
  min-w-18! text-right! [&_span]:block! [&_span]:text-slate-400! [&_span]:text-tiny! max-lg:[&_span]:text-xs!
  [&_span]:tracking-section! [&_strong]:block! [&_strong]:mt-1! [&_strong]:text-slate-500!
  [&_strong]:text-label! max-lg:[&_strong]:text-xs!
`}>
                  <span>ALERT ID</span>
                  <strong>{selected.id}</strong>
                </div>
              </div>
              <div className={`
  min-h-15! pt-2.5! pr-5.25! pb-2.5! pl-5.25! grid!
  grid-cols-4! items-center! gap-y-2.5! gap-x-2.5!
  border-b! border-solid! border-b-slate-200!
  bg-white! [&_div]:pr-2.5! [&_div]:border-r! [&_div]:border-solid!
  [&_div]:border-r-slate-200! [&_div:last-child]:border-0!
   [&_div:last-child]:border-current! [&_span]:block!
  [&_span]:mb-1! [&_span]:text-slate-400! [&_span]:text-fine! max-lg:[&_span]:text-xs! [&_strong]:block!
  [&_strong]:overflow-x-hidden! [&_strong]:overflow-y-hidden! [&_strong]:text-slate-600!
  [&_strong]:text-label! max-lg:[&_strong]:text-xs! [&_strong]:whitespace-nowrap! [&_strong]:text-ellipsis! max-workspace-mobile:pt-3!
  max-workspace-mobile:pr-4! max-workspace-mobile:pb-3! max-workspace-mobile:pl-4! max-workspace-mobile:grid-cols-2!
  max-workspace-mobile:gap-y-3! max-workspace-mobile:[&_div:nth-child(2)]:border-0!
  
  max-workspace-mobile:[&_div:nth-child(2)]:border-current!
`}>
                <div>
                  <span>Related record</span>
                  <strong>{selected.entity}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>
                    {selected.state} · {selected.zone}
                  </strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>{selected.source}</strong>
                </div>
                <div>
                  <span>Last updated</span>
                  <strong>{selected.updated} WAT</strong>
                </div>
              </div>

              {selected.prediction && (
                <section className={"mt-3.5! mr-4! mb-0! ml-4! overflow-x-hidden! overflow-y-hidden! rounded-lg! bg-slate-50! border! border-solid! border-slate-300!"}>
                  <div className={`
  h-9.75! pt-0! pr-3.25! pb-0! pl-3.25! flex! items-center! justify-between!
  border-b! border-solid! border-b-slate-200!
  [&_>_span]:flex! [&_>_span]:items-center! [&_>_span]:gap-y-1.75! [&_>_span]:gap-x-1.75!
  [&_>_span]:text-slate-500! [&_svg]:w-4! [&_svg]:h-4! [&_strong]:text-slate-600! [&_strong]:text-label! max-lg:[&_strong]:text-xs!
  [&_b]:pt-0.75! [&_b]:pr-1.5! [&_b]:pb-0.75! [&_b]:pl-1.5! [&_b]:rounded-lg! [&_b]:text-slate-500!
  [&_b]:bg-slate-100! [&_b]:text-tiny! max-lg:[&_b]:text-xs!
`}>
                    <span>
                      <IntelligenceIcon type="spark" />
                      <strong>AI-assisted prediction</strong>
                    </span>
                    <b>ETA v0.1</b>
                  </div>
                  <div className={`
  min-h-20.5! pt-3.25! pr-4.5! pb-3.25! pl-4.5! flex! items-center!
  gap-y-5.5! gap-x-5.5! [&_>_div_span]:block! [&_>_div_span]:mb-0.75! [&_>_div_span]:text-slate-500!
  [&_>_div_span]:text-fine! max-lg:[&_>_div_span]:text-xs! [&_>_div_strong]:inline! [&_>_div_strong]:text-slate-700!
  [&_>_div_strong]:font-bold! [&_>_div_strong]:text-xl! [&_>_div_strong]:leading-default!
  [&_>_div_strong]:font-sans! [&_>_div_strong]:not-italic! [&_>_div_small]:inline!
  [&_>_div_small]:ml-0.75! [&_>_div_small]:text-slate-400! [&_>_div_small]:text-tiny! max-lg:[&_>_div_small]:text-xs!
  [&_>_i]:text-slate-400! [&_>_i]:not-italic! [&_[data-state~=predicted]_strong]:text-red-600! **:data-[state~=delay-result]:ml-auto!
  **:data-[state~=delay-result]:pt-2.25! **:data-[state~=delay-result]:pr-3.25! **:data-[state~=delay-result]:pb-2.25!
  **:data-[state~=delay-result]:pl-3.25! **:data-[state~=delay-result]:rounded-md! **:data-[state~=delay-result]:bg-red-100!
  [&_[data-state~=delay-result]_strong]:text-amber-700! [&_[data-state~=delay-result]_strong]:text-sm! max-workspace-mobile:flex-wrap!
  max-workspace-mobile:gap-y-3! max-workspace-mobile:gap-x-3! max-workspace-mobile:**:data-[state~=delay-result]:w-full!
  max-workspace-mobile:**:data-[state~=delay-result]:mt-0! max-workspace-mobile:**:data-[state~=delay-result]:mr-0!
  max-workspace-mobile:**:data-[state~=delay-result]:mb-0! max-workspace-mobile:**:data-[state~=delay-result]:ml-0!
`}>
                    <div>
                      <span>Scheduled arrival</span>
                      <strong>{selected.prediction.deadline}</strong>
                      <small>WAT</small>
                    </div>
                    <i>
                      <ArrowRight aria-hidden="true" />
                    </i>
                    <div data-state="predicted">
                      <span>Predicted arrival</span>
                      <strong>{selected.prediction.arrival}</strong>
                      <small>WAT</small>
                    </div>
                    <div data-state="delay-result">
                      <span>Estimated lateness</span>
                      <strong>{selected.prediction.lateness} min</strong>
                    </div>
                  </div>
                  <div className={`
  min-h-7.5! pt-1.75! pr-3.25! pb-1.75! pl-3.25! flex! gap-y-4.5!
  gap-x-4.5! border-t! border-solid! border-t-slate-200!
  text-slate-400! bg-slate-100! text-tiny! max-lg:text-xs! [&_span:not(:first-child)::before]:content-separator!
  [&_span:not(:first-child)::before]:pr-4.5! [&_span:not(:first-child)::before]:text-slate-400!
  max-workspace-mobile:items-start! max-workspace-mobile:flex-col! max-workspace-mobile:gap-y-1! max-workspace-mobile:gap-x-1!
  max-workspace-mobile:[&_span:not(:first-child)::before]:hidden!
`}>
                    <span>Generated {selected.prediction.generated} WAT</span>
                    <span>Prediction details</span>
                    <span>No action automatically applied</span>
                  </div>
                </section>
              )}

              {selected.disruption && (
                <section className={`
  mt-3.5! mr-4! mb-0! ml-4! pt-3.25! pr-3.25! pb-3.25! pl-3.25! flex!
  items-center! gap-y-2.75! gap-x-2.75! rounded-lg! bg-slate-50! border! border-solid!
  border-slate-200! [&_>_div:nth-child(2)]:flex-1! [&_>_div_>_span]:text-slate-500!
  [&_>_div_>_span]:text-tiny! max-lg:[&_>_div_>_span]:text-xs! [&_>_div_>_span]:font-bold! [&_>_div_>_span]:tracking-caption!
  [&_>_div_>_strong]:mt-0.75! [&_>_div_>_strong]:block! [&_>_div_>_strong]:text-slate-700!
  [&_>_div_>_strong]:text-micro! max-lg:[&_>_div_>_strong]:text-xs! [&_p]:mt-0.75! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0! [&_p]:text-slate-500!
  [&_p]:text-fine! max-lg:[&_p]:text-xs! [&_>_div:last-child]:pl-3.75! [&_>_div:last-child]:border-l!
  [&_>_div:last-child]:border-solid!
  [&_>_div:last-child]:border-l-slate-200! [&_>_div:last-child]:text-center!
  [&_>_div:last-child_strong]:text-slate-500! [&_>_div:last-child_strong]:font-bold!
  [&_>_div:last-child_strong]:text-heading-sm! [&_>_div:last-child_strong]:leading-default!
  [&_>_div:last-child_strong]:font-sans! [&_>_div:last-child_strong]:not-italic!
`}>
                  <span className={"w-8.5! h-8.5! grid! place-items-center! rounded-control! text-slate-500! bg-slate-100! [&_svg]:w-4.25! [&_svg]:h-4.25!"}>
                    <IntelligenceIcon type="cloud" />
                  </span>
                  <div>
                    <span>EVENT DETAILS</span>
                    <strong>{selected.title}</strong>
                    <p>
                      {selected.zone} · Valid until {selected.disruption.validUntil} WAT
                    </p>
                  </div>
                  <div>
                    <span>AFFECTED DELIVERIES</span>
                    <strong>{selected.disruption.affected}</strong>
                  </div>
                </section>
              )}

              <div className={"mt-3.5! mr-4! mb-0! ml-4! grid! grid-cols-2! gap-y-2.5! gap-x-2.5! max-intelligence-compact:grid-cols-1!"}>
                <section className={`
  pt-3.25! pr-3.25! pb-3.25! pl-3.25! rounded-lg! bg-white! border! border-solid!
  border-slate-200! [&_blockquote]:min-h-10.5! [&_blockquote]:mt-3! [&_blockquote]:mr-0!
  [&_blockquote]:mb-3! [&_blockquote]:ml-0! [&_blockquote]:pt-2.25! [&_blockquote]:pr-2.25!
  [&_blockquote]:pb-2.25! [&_blockquote]:pl-2.25! [&_blockquote]:border-l-2!
  [&_blockquote]:border-solid! [&_blockquote]:border-l-blue-600!
  [&_blockquote]:text-slate-500! [&_blockquote]:bg-slate-50! [&_blockquote]:text-fine! max-lg:[&_blockquote]:text-xs!
  [&_blockquote]:leading-normal!
`}>
                  <div className={`
  flex! items-center! gap-y-2! gap-x-2! [&_h3]:mt-0! [&_h3]:mr-0! [&_h3]:mb-0! [&_h3]:ml-0!
  [&_h3]:text-slate-700! [&_h3]:font-bold! [&_h3]:text-micro! max-lg:[&_h3]:text-xs! [&_h3]:leading-default!
  [&_h3]:font-sans! [&_h3]:not-italic! [&_p]:mt-0.5! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0!
  [&_p]:text-slate-400! [&_p]:text-tiny! max-lg:[&_p]:text-xs!
`}>
                    <span className={"w-7.25! h-7.25! grid! place-items-center! rounded-md! text-blue-600! bg-blue-50! [&_svg]:w-3.75! [&_svg]:h-3.75!"}>
                      <IntelligenceIcon type="check" />
                    </span>
                    <div>
                      <h3>Recorded fact</h3>
                      <p>Evidence from operational event records</p>
                    </div>
                  </div>
                  <blockquote>{selected.fact}</blockquote>
                  <div className={"grid! grid-cols-alert-heading! gap-y-1.5! gap-x-1.5! text-slate-400! text-tiny! max-lg:text-xs! [&_strong]:text-slate-500!"}>
                    <span>Source</span>
                    <strong>{selected.source}</strong>
                    <span>First detected</span>
                    <strong>{selected.created} WAT</strong>
                  </div>
                </section>
                <section className={`
  pt-3.25! pr-3.25! pb-3.25! pl-3.25! rounded-lg! bg-white! border!
  border-solid! border-slate-200! [&_>_p]:min-h-10.5! [&_>_p]:mt-3! [&_>_p]:mr-0! [&_>_p]:mb-3!
  [&_>_p]:ml-0! [&_>_p]:text-slate-500! [&_>_p]:text-fine! max-lg:[&_>_p]:text-xs! [&_>_p]:leading-normal! [&_>_small]:pt-2!
  [&_>_small]:block! [&_>_small]:border-t! [&_>_small]:border-solid!
  [&_>_small]:border-t-slate-200! [&_>_small]:text-slate-500! [&_>_small]:text-tiny! max-lg:[&_>_small]:text-xs!
`}>
                  <div className={`
  flex! items-center! gap-y-2! gap-x-2! [&_h3]:mt-0! [&_h3]:mr-0! [&_h3]:mb-0! [&_h3]:ml-0!
  [&_h3]:text-slate-700! [&_h3]:font-bold! [&_h3]:text-micro! max-lg:[&_h3]:text-xs! [&_h3]:leading-default!
  [&_h3]:font-sans! [&_h3]:not-italic! [&_p]:mt-0.5! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0!
  [&_p]:text-slate-400! [&_p]:text-tiny! max-lg:[&_p]:text-xs!
`}>
                    <span className={"w-7.25! h-7.25! grid! place-items-center! rounded-md! text-amber-700! bg-amber-100! [&_svg]:w-3.75! [&_svg]:h-3.75!"}>
                      <IntelligenceIcon type="note" />
                    </span>
                    <div>
                      <h3>Recommended review</h3>
                      <p>Guidance for human assessment</p>
                    </div>
                  </div>
                  <p>{selected.action}</p>
                  <small>Recommendations do not change approved assignments.</small>
                </section>
              </div>

              {can("manage_operations") ? (
                <section className={`
  mt-3.5! mr-4! mb-0! ml-4! pt-3.5! pr-3.5! pb-3.5! pl-3.5! rounded-lg!
  bg-white! border! border-solid! border-slate-200! [&_textarea]:w-full! [&_textarea]:mt-2.75!
  [&_textarea]:pt-2.25! [&_textarea]:pr-2.25! [&_textarea]:pb-2.25! [&_textarea]:pl-2.25!
  [&_textarea]:resize-y! [&_textarea]:rounded-md! [&_textarea]:outline-none! [&_textarea]:text-slate-600!
  [&_textarea]:bg-slate-50! [&_textarea]:text-label! max-lg:[&_textarea]:text-base! [&_textarea]:leading-body! [&_textarea]:border!
  [&_textarea]:border-solid! [&_textarea]:border-slate-200!
  [&_textarea:focus]:shadow-search-focus!
  [&_textarea:focus]:border-blue-300!
`}>
                  <div className={`
  flex! items-start! justify-between! [&_h3]:mt-0! [&_h3]:mr-0! [&_h3]:mb-0! [&_h3]:ml-0!
  [&_h3]:text-slate-700! [&_h3]:font-bold! [&_h3]:text-micro! max-lg:[&_h3]:text-xs! [&_h3]:leading-default!
  [&_h3]:font-sans! [&_h3]:not-italic! [&_p]:mt-0.75! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0!
  [&_p]:text-slate-400! [&_p]:text-tiny! max-lg:[&_p]:text-xs! [&_>_span]:flex! [&_>_span]:items-center! [&_>_span]:gap-y-1!
  [&_>_span]:gap-x-1! [&_>_span]:text-slate-500! [&_>_span]:text-fine! max-lg:[&_>_span]:text-xs! [&_svg]:w-3.25! [&_svg]:h-3.25!
`}>
                    <div>
                      <h3>Coordinator review</h3>
                      <p>Record a note before updating this alert.</p>
                    </div>
                    <span>
                      <IntelligenceIcon type="person" />
                      {currentUser.name}
                    </span>
                  </div>
                  {savedNote && (
                    <div className={`
  mt-2.5! pt-2.25! pr-2.25! pb-2.25! pl-2.25! flex! gap-y-2! gap-x-2! rounded-md!
  text-emerald-700! bg-emerald-50! [&_>_svg]:w-3.75! [&_>_svg]:h-3.75! [&_strong]:block!
  [&_strong]:text-teal-900! [&_strong]:text-fine! max-lg:[&_strong]:text-xs! [&_span]:block! [&_span]:text-slate-500!
  [&_span]:text-tiny! max-lg:[&_span]:text-xs! [&_p]:mt-0.75! [&_p]:mr-0! [&_p]:mb-0.75! [&_p]:ml-0! [&_p]:text-slate-500!
  [&_p]:text-fine! max-lg:[&_p]:text-xs!
`}>
                      <IntelligenceIcon type="check" />
                      <div>
                        <strong>Review note recorded</strong>
                        <p>{savedNote}</p>
                        <span>{currentUser.name} · 3 Dec 2026, 09:36 WAT</span>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add context, findings or the reason for your decision…"
                    rows={3}
                  />
                  <div className={`
  mt-2! flex! justify-between! gap-y-2.5! gap-x-2.5! [&_>_div]:flex!
  [&_>_div]:gap-y-1.25! [&_>_div]:gap-x-1.25! [&_button]:h-7.75! [&_button]:pt-0! [&_button]:pr-2.25!
  [&_button]:pb-0! [&_button]:pl-2.25! [&_button]:rounded-md! [&_button]:flex! [&_button]:items-center!
  [&_button]:gap-y-1! [&_button]:gap-x-1! [&_button]:text-slate-500! [&_button]:bg-white!
  [&_button]:text-fine! max-lg:[&_button]:text-xs! [&_button]:font-bold! [&_button]:border! [&_button]:border-solid!
  [&_button]:border-slate-300! [&_button:hover]:bg-slate-50! [&_svg]:w-3.25! [&_svg]:h-3.25!
  **:data-[state~=assign-action]:text-blue-600! **:data-[state~=resolve-action]:text-white! **:data-[state~=resolve-action]:bg-emerald-700!
  **:data-[state~=resolve-action]:border-emerald-700! [&_[data-state~=resolve-action]:hover]:bg-teal-800! max-intelligence-compact:items-stretch!
  max-intelligence-compact:flex-col! max-intelligence-compact:[&_>_div]:justify-end! max-workspace-mobile:[&_>_div]:grid!
  max-workspace-mobile:[&_>_div]:grid-cols-2!
  max-workspace-mobile:**:data-[state~=resolve-action]:col-span-full!
`}>
                    <button
                      data-state="assign-action"
                      onClick={() => updateSelected("Under review")}
                    >
                      <IntelligenceIcon type="person" />
                      Assign to me
                    </button>
                    <div>
                      <button onClick={() => updateSelected("Acknowledged")}>Acknowledge</button>
                      <button
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
                        data-state="resolve-action"
                        onClick={() => {
                          updateSelected("Resolved");
                          if (note.trim()) {
                            setSavedNote(note.trim());
                            setNote("");
                          }
                        }}
                      >
                        <IntelligenceIcon type="check" />
                        Resolve
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className={`
  mt-3.5! mr-4! mb-0! ml-4! pt-3.5! pr-3.5! pb-3.5! pl-3.5! rounded-lg!
  bg-white! border! border-solid! border-slate-200! [&_textarea]:w-full! [&_textarea]:mt-2.75!
  [&_textarea]:pt-2.25! [&_textarea]:pr-2.25! [&_textarea]:pb-2.25! [&_textarea]:pl-2.25!
  [&_textarea]:resize-y! [&_textarea]:rounded-md! [&_textarea]:outline-none! [&_textarea]:text-slate-600!
  [&_textarea]:bg-slate-50! [&_textarea]:text-label! max-lg:[&_textarea]:text-base! [&_textarea]:leading-body! [&_textarea]:border!
  [&_textarea]:border-solid! [&_textarea]:border-slate-200!
  [&_textarea:focus]:shadow-search-focus!
  [&_textarea:focus]:border-blue-300!
`}>
                  <div className={`
  flex! items-start! justify-between! [&_h3]:mt-0! [&_h3]:mr-0! [&_h3]:mb-0! [&_h3]:ml-0!
  [&_h3]:text-slate-700! [&_h3]:font-bold! [&_h3]:text-micro! max-lg:[&_h3]:text-xs! [&_h3]:leading-default!
  [&_h3]:font-sans! [&_h3]:not-italic! [&_p]:mt-0.75! [&_p]:mr-0! [&_p]:mb-0! [&_p]:ml-0!
  [&_p]:text-slate-400! [&_p]:text-tiny! max-lg:[&_p]:text-xs! [&_>_span]:flex! [&_>_span]:items-center! [&_>_span]:gap-y-1!
  [&_>_span]:gap-x-1! [&_>_span]:text-slate-500! [&_>_span]:text-fine! max-lg:[&_>_span]:text-xs! [&_svg]:w-3.25! [&_svg]:h-3.25!
`}>
                    <div>
                      <h3>Read-only review</h3>
                      <p>Only an Operations Coordinator can update alert workflow state.</p>
                    </div>
                  </div>
                </section>
              )}

              <footer className={`
  mt-3.5! pt-2.5! pr-4! pb-2.5! pl-4! flex! justify-center! gap-y-4.5! gap-x-4.5!
  border-t! border-solid! border-t-slate-200!
  text-slate-400! bg-slate-100! text-tiny! max-lg:text-xs! [&_span:not(:first-child)::before]:content-separator!
  [&_span:not(:first-child)::before]:pr-4.5! [&_span:not(:first-child)::before]:text-slate-300!
  max-workspace-mobile:items-center! max-workspace-mobile:flex-wrap! max-workspace-mobile:gap-y-1.75! max-workspace-mobile:gap-x-3!
`}>
                <span>Created {selected.created} WAT</span>
                <span>Updated {selected.updated} WAT</span>
                <span>
                  {selected.occurrences} occurrence{selected.occurrences === 1 ? "" : "s"}
                </span>
                <span>Stable condition key · no duplicate alerts</span>
              </footer>
            </article>
          ) : (
            <div className={`
  min-h-87.5! flex! flex-col! items-center! justify-center! text-slate-400!
  [&_svg]:w-5.75! [&_svg]:h-5.75! [&_strong]:mt-2.25! [&_strong]:text-slate-600! [&_strong]:text-micro! max-lg:[&_strong]:text-xs!
`}>
              <IntelligenceIcon type="alert" />
              <strong>Select an alert to review</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
