import {
  Activity,
  AlertTriangle,
  ChartNoAxesCombined,
  CircleCheck,
  Clock3,
  RadioTower,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { useData } from "../../../data";

type Metric = {
  label: string;
  value: number | string;
  note: string;
  tone: string;
  icon: React.ReactNode;
};

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{metric.label}</p>
          <strong className="mt-2 block text-3xl font-semibold tabular-nums text-slate-900">
            {metric.value}
          </strong>
          <span className="mt-1 block text-xs text-slate-500">
            {metric.note}
          </span>
        </div>
        <span
          className={`grid size-10 place-items-center rounded-md ${metric.tone}`}
        >
          {metric.icon}
        </span>
      </div>
    </article>
  );
}

export function RoleOverviewPage() {
  const {
    currentUser,
    users,
    vehicles,
    deliveries,
    scenarios,
    audits,
    simulationEvents,
  } = useData();
  const active = users.filter((user) => user.status === "ACTIVE").length;
  const atRisk = deliveries.filter((delivery) => delivery.lateness > 0).length;
  const available = vehicles.filter(
    (vehicle) => vehicle.status === "AVAILABLE",
  ).length;
  const completedScenarios = scenarios.filter(
    (item) => item.solverStatus === "COMPLETED",
  ).length;
  const metrics: Record<typeof currentUser.role, Metric[]> = {
    Administrator: [
      {
        label: "Total Users",
        value: users.length,
        note: "accounts",
        tone: "bg-blue-50 text-blue-700",
        icon: <Users className="size-5" />,
      },
      {
        label: "Active Users",
        value: active,
        note: "Access enabled",
        tone: "bg-emerald-50 text-emerald-700",
        icon: <CircleCheck className="size-5" />,
      },
      {
        label: "Inactive Users",
        value: users.length - active,
        note: "Access disabled",
        tone: "bg-slate-100 text-slate-700",
        icon: <Clock3 className="size-5" />,
      },
      {
        label: "Administrators",
        value: users.filter((user) => user.role === "Administrator").length,
        note: "Account managers",
        tone: "bg-teal-50 text-teal-700",
        icon: <ShieldCheck className="size-5" />,
      },
    ],
    "Monitoring Analyst": [
      {
        label: "Active Journeys",
        value: deliveries.filter((item) => item.status === "IN_TRANSIT").length,
        note: "movements",
        tone: "bg-blue-50 text-blue-700",
        icon: <Truck className="size-5" />,
      },
      {
        label: "At-Risk Deliveries",
        value: atRisk,
        note: "Prediction exceeds window",
        tone: "bg-amber-50 text-amber-800",
        icon: <AlertTriangle className="size-5" />,
      },
      {
        label: "Stale Telemetry",
        value: 1,
        note: "Requires inspection",
        tone: "bg-red-50 text-red-700",
        icon: <RadioTower className="size-5" />,
      },
      {
        label: "Telemetry Coverage",
        value: "88%",
        note: "Across active journeys",
        tone: "bg-teal-50 text-teal-700",
        icon: <Activity className="size-5" />,
      },
    ],
    "Planning Analyst": [
      {
        label: "Total Scenarios",
        value: scenarios.length,
        note: "Shared planning records",
        tone: "bg-blue-50 text-blue-700",
        icon: <ChartNoAxesCombined className="size-5" />,
      },
      {
        label: "Completed Scenarios",
        value: completedScenarios,
        note: "Results available",
        tone: "bg-emerald-50 text-emerald-700",
        icon: <CircleCheck className="size-5" />,
      },
      {
        label: "Pending Reviews",
        value: scenarios.filter(
          (item) =>
            item.solverStatus === "COMPLETED" &&
            item.reviewStatus === "NOT_REVIEWED",
        ).length,
        note: "Coordinator decision needed",
        tone: "bg-amber-50 text-amber-800",
        icon: <Clock3 className="size-5" />,
      },
      {
        label: "Available Vehicles",
        value: available,
        note: "Current shared availability",
        tone: "bg-teal-50 text-teal-700",
        icon: <Truck className="size-5" />,
      },
    ],
    "Operations Coordinator": [],
  };
  const titles = {
    Administrator: [
      "System overview",
      "Manage access, auditability and platform status.",
    ],
    "Monitoring Analyst": [
      "Monitoring overview",
      "Inspect movements, delivery risk and operational alerts.",
    ],
    "Planning Analyst": [
      "Planning overview",
      "Evaluate scenarios and shared resource availability.",
    ],
    "Operations Coordinator": [
      "Operations overview",
      "Coordinate the active exercise.",
    ],
  } as const;
  const [title, subtitle] = titles[currentUser.role];
  return (
    <div className="max-w-360 pt-7.75 pb-6.5 max-sm:py-5.75 px-8 max-sm:px-4 my-0 mx-auto">
      <header className="flex justify-between items-end max-sm:items-stretch max-sm:flex-col gap-6">
        <div>
          <div className="flex items-center text-slate-400 text-xs max-lg:text-xs font-bold tracking-wide gap-2">
            <span className="text-blue-600">WORKSPACE</span>
            <i className="w-0.75 h-0.75 rounded-full bg-slate-400" />
            ROLE WORKSPACE
          </div>
          <h1 className="mt-2 mb-1 text-3xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-slate-500 text-xs my-0 mx-0">{subtitle}</p>
        </div>
      </header>
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Role metrics"
      >
        {metrics[currentUser.role].map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              {currentUser.role === "Administrator"
                ? "Recent audit events"
                : "Recent activity"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Shared operation records
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {(currentUser.role === "Administrator" ? audits : simulationEvents)
              .slice(0, 4)
              .map((item) => (
                <div key={item.id} className="p-4">
                  <strong className="block text-sm text-slate-800">
                    {"action" in item
                      ? item.action.replace(/_/g, " ")
                      : item.type.replace(/_/g, " ")}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {"detail" in item ? item.detail : item.description}
                  </span>
                </div>
              ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            {currentUser.role === "Planning Analyst"
              ? "Planning attention"
              : "System connectivity"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Service status</p>
          <div className="mt-5 space-y-3">
            {[
              ["Data source", "Application data"],
              ["API connection", "Backend not connected"],
              ["Permission mode", `${currentUser.role} policy`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <strong className="text-right text-xs text-slate-800">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
