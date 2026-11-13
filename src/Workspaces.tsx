import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  Clock3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { type CSSProperties, type FormEvent, type ReactNode, useRef, useState } from "react";
import { useModalFocus } from "./hooks/useModalFocus";
import {
  type Operation,
  type PlanningScenario,
  type UserRole,
  useData,
  scenarioResults,
} from "./data";
import { usePermissions } from "./hooks/usePermissions";

const inputClass =
  "w-full min-w-0 h-11 rounded-md border border-slate-300 bg-white px-3 text-base sm:text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const buttonPrimary =
  "min-h-11 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300";
const buttonSecondary =
  "min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200";

function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"}>
      <div>
        <p className={"text-xs font-semibold uppercase tracking-wider text-blue-600"}>
          Demo Operation · data
        </p>
        <h1 className={"mt-2 text-2xl font-semibold tracking-tight text-slate-900"}>
          {title}
        </h1>
        <p className={"mt-1 text-sm text-slate-500"}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function StatGrid({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    note: string;
    tone?: string;
    icon?: ReactNode;
  }[];
}) {
  return (
    <div className={"grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"}>
      {items.map((item) => (
        <div
          key={item.label}
          className={"rounded-lg border border-slate-200 bg-white p-4"}
        >
          <div className={"flex items-start justify-between"}>
            <div>
              <p className={"text-xs font-medium text-slate-500"}>{item.label}</p>
              <strong className={"mt-2 block text-3xl font-semibold tabular-nums text-slate-900"}>
                {item.value}
              </strong>
              <span className={"mt-1 block text-xs text-slate-500"}>
                {item.note}
              </span>
            </div>
            <span
              className={`grid h-9 w-9 place-items-center rounded-md ${item.tone ?? "bg-blue-50 text-blue-700"}`}
            >
              {item.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red" | "teal";
}) {
  const styles = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    teal: "bg-teal-50 text-teal-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function statusTone(
  status: string,
): "slate" | "blue" | "green" | "amber" | "red" | "teal" {
  if (
    ["COMPLETED", "APPROVED", "ACTIVE", "AVAILABLE", "CONFIRMED"].includes(
      status,
    )
  )
    return "green";
  if (["RUNNING", "READY", "ASSIGNED"].includes(status)) return "blue";
  if (["INFEASIBLE", "FAILED", "REJECTED", "UNAVAILABLE"].includes(status))
    return "red";
  if (["QUEUED", "PAUSED", "NOT_REVIEWED"].includes(status)) return "amber";
  return "slate";
}

function SearchBox({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange(value: string): void;
  placeholder?: string;
}) {
  return (
    <label className={"flex h-10 min-w-60 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-slate-400"}>
      <Search size={16} />
      <input
        className={"w-full bg-transparent text-sm text-slate-700 outline-none"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className={"flex min-h-64 flex-col items-center justify-center text-center"}>
      <Search className={"text-slate-300"} />
      <strong className={"mt-3 text-sm text-slate-700"}>{title}</strong>
      <p className={"mt-1 text-xs text-slate-500"}>{description}</p>
    </div>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose(): void;
}) {
  const panel = useRef<HTMLElement>(null);
  useModalFocus(true, panel, onClose);
  return (
    <div
      className={"fixed inset-0 z-70 flex h-dvh items-center justify-center bg-slate-900/50 p-2 sm:p-4"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={onClose}
    >
      <section
        ref={panel}
        className={"max-h-full w-full min-w-0 max-w-2xl overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-xl"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={"sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-5"}>
          <div className="min-w-0 wrap-anywhere">
            <h2
              id="modal-title"
              className={"text-lg font-semibold text-slate-900"}
            >
              {title}
            </h2>
            <p className={"mt-1 text-sm text-slate-500"}>{description}</p>
          </div>
          <button
            className={"grid size-11 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Toast() {
  const { toast, clearToast } = useData();
  if (!toast) return null;
  return (
    <div role="status" className={"fixed inset-x-3 bottom-4 z-90 flex items-center gap-3 rounded-lg border border-emerald-200 bg-white p-3 shadow-lg sm:left-auto sm:right-5 sm:max-w-sm"}>
      <span className={"grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-700"}>
        <Check size={15} />
      </span>
      <span className={"min-w-0 flex-1 wrap-anywhere text-sm font-medium text-slate-700"}>{toast}</span>
      <button aria-label="Dismiss notification" onClick={clearToast} className={"grid size-11 shrink-0 place-items-center text-slate-400"}>
        <X size={15} />
      </button>
    </div>
  );
}

export function ScenariosPage() {
  const {
    scenarios,
    operations,
    addScenario,
    updateScenario,
    reviewScenario,
    reviews,
  } = useData();
  const [search, setSearch] = useState("");
  const [solver, setSolver] = useState("ALL");
  const [review, setReview] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("Overview");
  const [rejectOpen, setRejectOpen] = useState(false);
  const { can } = usePermissions();
  const selected = scenarios.find((item) => item.id === selectedId);
  const filtered = scenarios
    .filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        (solver === "ALL" || item.solverStatus === solver) &&
        (review === "ALL" || item.reviewStatus === review),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const runSolver = (scenario: PlanningScenario) => {
    updateScenario(scenario.id, { solverStatus: "QUEUED" });
    window.setTimeout(
      () => updateScenario(scenario.id, { solverStatus: "RUNNING" }),
      500,
    );
    window.setTimeout(
      () =>
        updateScenario(scenario.id, {
          solverStatus: scenario.id === "SCN-002" ? "INFEASIBLE" : "COMPLETED",
        }),
      1500,
    );
  };
  return (
    <Workspace>
      <PageHead
        title="Scenario Comparison"
        subtitle="Evaluate alternative logistics plans against the current baseline."
        action={
          can("create_scenarios") ? (
            <button
              className={buttonPrimary}
              onClick={() => setCreateOpen(true)}
            >
              <span className={"flex items-center gap-2"}>
                <Plus size={16} />
                Create Scenario
              </span>
            </button>
          ) : undefined
        }
      />
      <StatGrid
        items={[
          {
            label: "Total Scenarios",
            value: scenarios.length,
            note: "Across shared records",
            icon: <SlidersHorizontal size={18} />,
          },
          {
            label: "Completed Scenarios",
            value: scenarios.filter((s) => s.solverStatus === "COMPLETED")
              .length,
            note: "Solver results available",
            tone: "bg-emerald-50 text-emerald-700",
            icon: <Check size={18} />,
          },
          {
            label: "Pending Review",
            value: scenarios.filter(
              (s) =>
                s.solverStatus === "COMPLETED" &&
                s.reviewStatus === "NOT_REVIEWED",
            ).length,
            note: "Human decision required",
            tone: "bg-amber-50 text-amber-800",
            icon: <Clock3 size={18} />,
          },
          {
            label: "Infeasible Scenarios",
            value: scenarios.filter((s) => s.solverStatus === "INFEASIBLE")
              .length,
            note: "Constraints not satisfied",
            tone: "bg-red-50 text-red-700",
            icon: <AlertTriangle size={18} />,
          },
        ]}
      />
      <section className={"rounded-lg border border-slate-200 bg-white"}>
        <div className={"flex flex-wrap gap-3 border-b border-slate-200 p-4"}>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search scenario name"
          />
          <select
            className={inputClass + " max-w-48"}
            value={solver}
            onChange={(e) => setSolver(e.target.value)}
          >
            <option value="ALL">All solver statuses</option>
            {["QUEUED", "RUNNING", "COMPLETED", "INFEASIBLE", "FAILED"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
          <select
            className={inputClass + " max-w-48"}
            value={review}
            onChange={(e) => setReview(e.target.value)}
          >
            <option value="ALL">All review statuses</option>
            {["NOT_REVIEWED", "APPROVED", "REJECTED"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className={"overflow-x-auto"}>
          {filtered.length ? (
            <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`}>
              <thead>
                <tr>
                  <th>Scenario Name</th>
                  <th>Scenario ID</th>
                  <th>Associated Operation</th>
                  <th>Created Date</th>
                  <th>Baseline</th>
                  <th>Solver Status</th>
                  <th>Review Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.id}</td>
                    <td>
                      {
                        operations.find((op) => op.id === item.operationId)
                          ?.name
                      }
                    </td>
                    <td>{item.createdAt}</td>
                    <td>{item.baseline}</td>
                    <td>
                      <Badge tone={statusTone(item.solverStatus)}>
                        {item.solverStatus}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(item.reviewStatus)}>
                        {item.reviewStatus}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className={`
  inline-flex! items-center! gap-y-1! gap-x-1! text-blue-600! bg-transparent!
  text-xs! font-semibold! border-0!  border-current!
  [&:hover]:text-blue-700!
`}
                        onClick={() => {
                          setSelectedId(item.id);
                          setTab("Overview");
                        }}
                      >
                        View Scenario <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty
              title="No matching scenarios"
              description="Change the active search or status filters."
            />
          )}
        </div>
        <TableFooter count={filtered.length} total={scenarios.length} />
      </section>
      {createOpen && (
        <ScenarioForm
          onClose={() => setCreateOpen(false)}
          onSubmit={(record) => {
            addScenario(record);
            setCreateOpen(false);
          }}
        />
      )}
      {selected && (
        <Modal
          title={selected.name}
          description={`${selected.id} · ${selected.baseline} remains the approved baseline`}
          onClose={() => setSelectedId(null)}
        >
          <div className={"flex overflow-x-auto border-b border-slate-200 px-5"}>
            {[
              "Overview",
              "Configuration",
              "Comparison",
              "Proposed Allocations",
              "Review History",
            ].map((name) => (
              <button
                key={name}
                className={`border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap ${tab === name ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className={"p-5"}>
            {tab === "Overview" && (
              <ScenarioOverview
                scenario={selected}
                onRun={() => runSolver(selected)}
                canRun={can("create_scenarios")}
              />
            )}{" "}
            {tab === "Configuration" && (
              <ScenarioConfiguration scenario={selected} />
            )}{" "}
            {tab === "Comparison" && <ScenarioComparison scenario={selected} />}{" "}
            {tab === "Proposed Allocations" && <Allocations />}{" "}
            {tab === "Review History" && (
              <ReviewHistory scenario={selected} reviews={reviews} />
            )}
          </div>
          {can("review_scenarios") &&
            selected.solverStatus === "COMPLETED" &&
            selected.reviewStatus === "NOT_REVIEWED" && (
              <div className={"flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-5"}>
                <p className={"max-w-md text-xs text-slate-500"}>
                  A review decision is recorded only. The approved baseline and
                  delivery assignments remain unchanged.
                </p>
                <div className={"flex gap-2"}>
                  <button
                    className={buttonSecondary}
                    onClick={() => setRejectOpen(true)}
                  >
                    Reject Recommendation
                  </button>
                  <button
                    className={buttonPrimary}
                    onClick={() =>
                      window.confirm(
                        "Approving records a planning review decision. It does not automatically change existing delivery assignments.",
                      ) &&
                      reviewScenario(
                        selected.id,
                        "APPROVED",
                        "Accepted for planning review; baseline unchanged.",
                      )
                    }
                  >
                    Approve Recommendation
                  </button>
                </div>
              </div>
            )}
        </Modal>
      )}
      {rejectOpen && selected && (
        <RejectModal
          onClose={() => setRejectOpen(false)}
          onSubmit={(note) => {
            reviewScenario(selected.id, "REJECTED", note);
            setRejectOpen(false);
          }}
        />
      )}
      <Toast />
    </Workspace>
  );
}

function ScenarioForm({
  onClose,
  onSubmit,
}: {
  onClose(): void;
  onSubmit(
    record: Omit<
      PlanningScenario,
      "id" | "createdAt" | "solverStatus" | "reviewStatus" | "createdBy"
    >,
  ): void;
}) {
  const { operations } = useData();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("Reduce estimated lateness");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError("Enter a scenario name with at least three characters.");
      return;
    }
    onSubmit({
      name: name.trim(),
      operationId: operations[0].id,
      baseline: "PLAN-v1.4",
      objective,
      assumptions: "Current vehicle availability and active disruptions.",
      constraints:
        "Deadlines, vehicle capacity and non-overlapping assignments.",
    });
  };
  return (
    <Modal
      title="Create Scenario"
      description="Configure a hypothetical plan without changing approved assignments."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={"grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2"}>
          <Field label="Scenario Name" required>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South West rainfall response"
            />
          </Field>
          <Field label="Selected Operation" required>
            <select className={inputClass}>
              <option>{operations[0].name}</option>
            </select>
          </Field>
          <Field label="Baseline Plan Version">
            <input className={inputClass} readOnly value="PLAN-v1.4" />
          </Field>
          <Field label="Optimisation Objective" required>
            <select
              className={inputClass}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            >
              <option>Reduce estimated lateness</option>
              <option>Improve on-time completion</option>
              <option>Reduce required vehicle usage</option>
            </select>
          </Field>
          <Field label="Resource Availability Assumptions">
            <textarea
              className={`
  w-full! min-h-22! pt-3! pr-3! pb-3! pl-3! resize-y!
  rounded-md! outline-none! text-slate-700! bg-white! text-sm! leading-normal! border!
  border-solid! border-slate-300! focus:shadow-focus!
  focus:border-blue-500!
`}
              defaultValue="Current vehicle availability and active disruptions."
            />
          </Field>
          <Field label="Delivery Requirements">
            <textarea
              className={`
  w-full! min-h-22! pt-3! pr-3! pb-3! pl-3! resize-y!
  rounded-md! outline-none! text-slate-700! bg-white! text-sm! leading-normal! border!
  border-solid! border-slate-300! focus:shadow-focus!
  focus:border-blue-500!
`}
              defaultValue="All scheduled deliveries remain in scope."
            />
          </Field>
          <Field label="Scheduling Constraints">
            <textarea
              className={`
  w-full! min-h-22! pt-3! pr-3! pb-3! pl-3! resize-y!
  rounded-md! outline-none! text-slate-700! bg-white! text-sm! leading-normal! border!
  border-solid! border-slate-300! focus:shadow-focus!
  focus:border-blue-500!
`}
              defaultValue="Deadlines, capacities and assignment windows enforced."
            />
          </Field>
          <Field label="Objective Priority">
            <select className={inputClass}>
              <option>Primary</option>
              <option>Secondary</option>
            </select>
          </Field>
          {error && (
            <p className={"sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700"}>
              {error}
            </p>
          )}
        </div>
        <div className={"flex justify-end gap-2 border-t border-slate-200 p-5"}>
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={buttonPrimary}>Create Scenario</button>
        </div>
      </form>
    </Modal>
  );
}

function ScenarioOverview({
  scenario,
  onRun,
  canRun,
}: {
  scenario: PlanningScenario;
  onRun(): void;
  canRun: boolean;
}) {
  const { operations } = useData();
  return (
    <div className={"space-y-5"}>
      <div className={"grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3"}>
        {[
          [
            "Associated Operation",
            operations.find((o) => o.id === scenario.operationId)?.name,
          ],
          ["Created Date", scenario.createdAt],
          ["Baseline Version", scenario.baseline],
          ["Solver Status", scenario.solverStatus],
          ["Review Status", scenario.reviewStatus],
          ["Created By", scenario.createdBy],
        ].map(([label, value]) => (
          <div key={label} className={"rounded-md border border-slate-200 p-4"}>
            <span className={"text-xs text-slate-500"}>{label}</span>
            <strong className={"mt-1 block wrap-anywhere text-sm text-slate-800"}>
              {value}
            </strong>
          </div>
        ))}
      </div>
      {scenario.solverStatus === "RUNNING" && (
        <div className={"rounded-md border border-blue-200 bg-blue-50 p-4"}>
          <div className={"flex items-center justify-between text-sm font-semibold text-blue-700"}>
            <span>Solver processing deterministic scenario</span>
            <span>68%</span>
          </div>
          <div className={"mt-3 h-2 rounded-full bg-blue-100"}>
            <i className={"block h-full w-2/3 rounded-full bg-blue-600"} />
          </div>
        </div>
      )}
      {canRun && (
        <button
          className={buttonPrimary}
          disabled={scenario.solverStatus === "RUNNING"}
          onClick={onRun}
        >
          {scenario.solverStatus === "RUNNING"
            ? "Optimisation Running…"
            : "Run Optimisation"}
        </button>
      )}
      <p className={"text-xs text-slate-500"}>
        Prototype results are deterministic and are not claimed to be
        mathematically optimal.
      </p>
    </div>
  );
}
function ScenarioConfiguration({ scenario }: { scenario: PlanningScenario }) {
  return (
    <div className={"grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"}>
      <Info label="Optimisation objective" value={scenario.objective} />
      <Info label="Baseline plan" value={scenario.baseline} />
      <Info label="Resource assumptions" value={scenario.assumptions} />
      <Info label="Scheduling constraints" value={scenario.constraints} />
    </div>
  );
}
function ScenarioComparison({ scenario }: { scenario: PlanningScenario }) {
  const result = scenarioResults[scenario.id];
  if (scenario.solverStatus === "INFEASIBLE")
    return (
      <Empty
        title="No feasible alternative found"
        description="The configured constraints could not all be satisfied. Review resource assumptions."
      />
    );
  if (!result)
    return (
      <Empty
        title="Comparison not available"
        description="Run optimisation to produce a deterministic comparison."
      />
    );
  const labels = [
    "Total Deliveries",
    "Within Window",
    "Late Deliveries",
    "Vehicles Used",
    "Total Lateness (min)",
  ];
  return (
    <div>
      <div className={"grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"}>
        <ComparisonSide
          title="Baseline Plan"
          values={result.baseline}
          labels={labels}
        />
        <ComparisonSide
          title="Proposed Alternative"
          values={result.alternative}
          labels={labels}
          proposed
        />
      </div>
      <div className={"mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"}>
        <strong>Planning recommendation only.</strong> The proposed alternative
        has not changed any approved delivery or vehicle assignment.
      </div>
    </div>
  );
}
function ComparisonSide({
  title,
  values,
  labels,
  proposed,
}: {
  title: string;
  values: number[];
  labels: string[];
  proposed?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border p-4 ${proposed ? "border-blue-200 bg-blue-50/40" : "border-slate-200"}`}
    >
      <span className={"text-xs font-semibold uppercase tracking-wide text-slate-500"}>
        {title}
      </span>
      <div className={"mt-4 space-y-3"}>
        {labels.map((label, i) => (
          <div
            key={label}
            className={"flex items-center justify-between border-b border-slate-200 pb-2"}
          >
            <span className={"text-sm text-slate-600"}>{label}</span>
            <strong className={"tabular-nums text-slate-900"}>{values[i]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
function Allocations() {
  const rows = [
    ["SIM-018", "VEH-005", "VEH-008", "10:30", "10:22", "0", "SATISFIED"],
    ["SIM-024", "VEH-008", "VEH-007", "10:30", "10:38", "8", "SATISFIED"],
    ["SIM-029", "VEH-011", "VEH-003", "10:15", "10:12", "0", "SATISFIED"],
    ["SIM-041", "VEH-009", "VEH-009", "09:20", "09:51", "31", "DEADLINE"],
  ];
  return (
    <div className={"overflow-x-auto"}>
      <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`} data-state="compact">
        <thead>
          <tr>
            {[
              "Delivery Code",
              "Baseline Vehicle",
              "Proposed Vehicle",
              "Deadline",
              "Estimated Arrival",
              "Lateness",
              "Constraint",
            ].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) => (
                <td key={i}>
                  {i === 6 ? (
                    <Badge tone={v === "SATISFIED" ? "green" : "red"}>
                      {v}
                    </Badge>
                  ) : (
                    v
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ReviewHistory({
  scenario,
  reviews,
}: {
  scenario: PlanningScenario;
  reviews: {
    scenarioId: string;
    decision: string;
    reviewer: string;
    timestamp: string;
    note: string;
  }[];
}) {
  const rows = reviews.filter((r) => r.scenarioId === scenario.id);
  return rows.length ? (
    <div className={"space-y-3"}>
      {rows.map((r, i) => (
        <div key={i} className={"rounded-md border border-slate-200 p-4"}>
          <div className={"flex justify-between"}>
            <Badge tone={r.decision === "APPROVED" ? "green" : "red"}>
              {r.decision}
            </Badge>
            <span className={"text-xs text-slate-500"}>{r.timestamp}</span>
          </div>
          <p className={"mt-3 text-sm text-slate-600"}>{r.note}</p>
          <span className={"mt-2 block text-xs text-slate-500"}>
            {r.reviewer}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <Empty
      title="Awaiting human review"
      description="No review decision has been recorded for this scenario."
    />
  );
}
function RejectModal({
  onClose,
  onSubmit,
}: {
  onClose(): void;
  onSubmit(note: string): void;
}) {
  const [note, setNote] = useState("");
  return (
    <Modal
      title="Reject Recommendation"
      description="Record why the proposed plan should not proceed."
      onClose={onClose}
    >
      <div className={"p-5"}>
        <Field label="Review note" required>
          <textarea
            className={`
  w-full! min-h-22! pt-3! pr-3! pb-3! pl-3! resize-y!
  rounded-md! outline-none! text-slate-700! bg-white! text-sm! leading-normal! border!
  border-solid! border-slate-300! focus:shadow-focus!
  focus:border-blue-500!
`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the reason for rejection…"
          />
        </Field>
        <p className={"mt-3 text-xs text-slate-500"}>
          The baseline plan remains unchanged.
        </p>
      </div>
      <div className={"flex justify-end gap-2 border-t border-slate-200 p-5"}>
        <button className={buttonSecondary} onClick={onClose}>
          Cancel
        </button>
        <button
          disabled={!note.trim()}
          className={"min-h-11 rounded-md bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-40"}
          onClick={() => onSubmit(note.trim())}
        >
          Reject Recommendation
        </button>
      </div>
    </Modal>
  );
}

export function TeamPage() {
  const { users, currentUser, addUser, updateUser } = useData();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [create, setCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = users.find((u) => u.id === selectedId);
  const rows = users.filter(
    (u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()) &&
      (role === "ALL" || u.role === role) &&
      (status === "ALL" || u.status === status),
  );
  const admin = currentUser.role === "Administrator";
  return (
    <Workspace>
      <PageHead
        title="Team Access"
        subtitle="Manage authorised users and their access to logistics operations."
        action={
          <button
            disabled={!admin}
            className={buttonPrimary + " disabled:opacity-40"}
            onClick={() => setCreate(true)}
          >
            <span className={"flex items-center gap-2"}>
              <Plus size={16} />
              Add Team Member
            </span>
          </button>
        }
      />
      <StatGrid
        items={[
          {
            label: "Total Users",
            value: users.length,
            note: "team records",
            icon: <Users size={18} />,
          },
          {
            label: "Active Users",
            value: users.filter((u) => u.status === "ACTIVE").length,
            note: "Account enabled",
            tone: "bg-emerald-50 text-emerald-700",
            icon: <Check size={18} />,
          },
          {
            label: "Inactive Users",
            value: users.filter((u) => u.status === "INACTIVE").length,
            note: "Access disabled",
            tone: "bg-slate-100 text-slate-700",
            icon: <UserRound size={18} />,
          },
          {
            label: "Administrators",
            value: users.filter((u) => u.role === "Administrator").length,
            note: "Can manage accounts",
            tone: "bg-teal-50 text-teal-700",
            icon: <ShieldCheck size={18} />,
          },
        ]}
      />
      {!admin && (
        <div className={"rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"}>
          Access denied: Administrator permission is required to manage user
          accounts.
        </div>
      )}
      <section className={"rounded-lg border border-slate-200 bg-white"}>
        <div className={"flex flex-wrap gap-3 border-b border-slate-200 p-4"}>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search name or email"
          />
          <select
            className={inputClass + " max-w-56"}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ALL">All roles</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            className={inputClass + " max-w-44"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option>ACTIVE</option>
            <option>INACTIVE</option>
          </select>
        </div>
        <div className={"overflow-x-auto"}>
          {rows.length ? (
            <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <Badge tone={statusTone(u.status)}>{u.status}</Badge>
                    </td>
                    <td>{u.createdAt}</td>
                    <td>
                      <button
                        className={`
  inline-flex! items-center! gap-y-1! gap-x-1! text-blue-600! bg-transparent!
  text-xs! font-semibold! border-0!  border-current!
  [&:hover]:text-blue-700!
`}
                        onClick={() => setSelectedId(u.id)}
                      >
                        View User <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty
              title="No team members found"
              description="Change the current search or filters."
            />
          )}
        </div>
        <TableFooter count={rows.length} total={users.length} />
      </section>
      {create && (
        <UserForm
          onClose={() => setCreate(false)}
          onSubmit={(u) => {
            if (addUser(u)) setCreate(false);
          }}
          existing={users.map((u) => u.email)}
        />
      )}
      {selected && (
        <Modal
          title={selected.name}
          description={`${selected.id} · User account`}
          onClose={() => setSelectedId(null)}
        >
          <div className={"grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2"}>
            <Info label="Email Address" value={selected.email} />
            <Info label="Created Date" value={selected.createdAt} />
            <Field label="Role">
              <select
                disabled={!admin}
                className={inputClass}
                value={selected.role}
                onChange={(e) =>
                  updateUser(selected.id, { role: e.target.value as UserRole })
                }
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Account Status">
              <select
                disabled={!admin}
                className={inputClass}
                value={selected.status}
                onChange={(e) =>
                  window.confirm("Confirm this account status change?") &&
                  updateUser(selected.id, {
                    status: e.target.value as "ACTIVE" | "INACTIVE",
                  })
                }
              >
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}
      <Toast />
    </Workspace>
  );
}
const roles: UserRole[] = [
  "Administrator",
  "Operations Coordinator",
  "Monitoring Analyst",
  "Planning Analyst",
];
function UserForm({
  onClose,
  onSubmit,
  existing,
}: {
  onClose(): void;
  onSubmit(u: {
    name: string;
    email: string;
    role: UserRole;
    status: "ACTIVE" | "INACTIVE";
  }): void;
  existing: string[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Monitoring Analyst");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (existing.some((x) => x.toLowerCase() === email.toLowerCase())) {
      setError("A user with this email already exists.");
      return;
    }
    onSubmit({ name: name.trim(), email: email.trim(), role, status });
  };
  return (
    <Modal
      title="Add Team Member"
      description="Create a account ."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={"grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2"}>
          <Field label="Full Name" required>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Email Address" required>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Role" required>
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Account Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "ACTIVE" | "INACTIVE")
              }
            >
              <option>ACTIVE</option>
              <option>INACTIVE</option>
            </select>
          </Field>
          {error && (
            <p className={"sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700"}>
              {error}
            </p>
          )}
        </div>
        <div className={"flex justify-end gap-2 border-t border-slate-200 p-5"}>
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={buttonPrimary}>Create User</button>
        </div>
      </form>
    </Modal>
  );
}

export function SettingsPage({
  onNavigate,
}: {
  onNavigate?(page: string): void;
}) {
  const {
    currentUser,
    operations,
    simulationState,
    timezone,
    dateFormat,
    setPreferences,
  } = useData();
  const [tz, setTz] = useState(timezone);
  const [format, setFormat] = useState(dateFormat);
  const [section, setSection] = useState("Profile");
  return (
    <Workspace>
      <PageHead
        title="Settings"
        subtitle="Manage your account preferences and view system information."
      />
      <div className={"grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-settings"}>
        <aside className={"flex h-fit gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 lg:block"}>
          {[
            "Profile",
            "Preferences",
            "Operation Information",
            "System Information",
          ].map((name) => (
            <button
              key={name}
              onClick={() => setSection(name)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-3 text-left text-sm font-medium lg:w-full ${section === name ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Settings2 size={16} />
              {name}
            </button>
          ))}
        </aside>
        <section className={"rounded-lg border border-slate-200 bg-white p-5"}>
          {section === "Profile" && (
            <>
              <SectionHead
                title="Profile"
                description="Signed-in demonstration account information."
              />
              <div className={"mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"}>
                <Info label="Full Name" value={currentUser.name} />
                <Info label="Email Address" value={currentUser.email} />
                <Info label="Assigned Role" value={currentUser.role} />
                <Info label="Account Status" value={currentUser.status} />
              </div>
              <p className={"mt-5 rounded-md bg-slate-50 p-3 text-xs text-slate-500"}>
                Profile editing is read-only until the corresponding backend
                contract is available.
              </p>
            </>
          )}
          {section === "Preferences" && (
            <>
              <SectionHead
                title="Preferences"
                description="Operational timestamps are stored in UTC and displayed using this preference."
              />
              <div className={"mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"}>
                <Field label="Display Timezone">
                  <select
                    className={inputClass}
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                  >
                    <option>Africa/Lagos</option>
                    <option>UTC</option>
                  </select>
                </Field>
                <Field label="Date Format">
                  <select
                    className={inputClass}
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option>DD MMM YYYY</option>
                    <option>YYYY-MM-DD</option>
                    <option>DD/MM/YYYY</option>
                  </select>
                </Field>
              </div>
              <button
                className={buttonPrimary + " mt-5"}
                onClick={() => setPreferences(tz, format)}
              >
                Save Preferences
              </button>
            </>
          )}
          {section === "Operation Information" && (
            <>
              <SectionHead
                title="Operation Information"
                description="Read-only information for the selected exercise."
              />
              <div className={"mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"}>
                OPERATION DETAILS
              </div>
              <div className={"mt-4 grid gap-4 sm:grid-cols-2"}>
                <Info
                  label="Active Operation"
                  value={operations[0].name}
                />
                <Info label="Operation ID" value={operations[0].id} />
                <Info label="Operation Seed" value={operations[0].seed} />
                <Info label="Operation State" value={simulationState} />
              </div>
              <button
                className={buttonSecondary + " mt-5"}
                onClick={() => onNavigate?.("Operations")}
              >
                Open Operation
              </button>
            </>
          )}
          {section === "System Information" && (
            <>
              <SectionHead
                title="System Information"
                description="Runtime and data-source status."
              />
              <div className={"mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"}>
                <Info
                  label="Application Name"
                  value="Electoral Logistics Command Centre"
                />
                <Info label="Application Version" value="1.0.0" />
                <Info
                  label="API Connection Status"
                  value="Backend not connected"
                />
                <Info
                  label="Last Successful Synchronisation"
                  value="Awaiting API connection"
                />
                <Info
                  label="Data Source"
                  value="Application data"
                />
              </div>
              <div className={"mt-5 rounded-md border border-slate-200 bg-slate-50 p-4"}>
                <Badge tone="amber">DATA CONNECTION</Badge>
                <p className={"mt-2 text-xs text-slate-500"}>
                  API integration pending.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
      <Toast />
    </Workspace>
  );
}

export function OperationsPage() {
  const { operations, addOperation } = useData();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [create, setCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("Overview");
  const selected = operations.find((o) => o.id === selectedId);
  const rows = operations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "ALL" || o.status === status),
  );
  return (
    <Workspace>
      <PageHead
        title="Operations"
        subtitle="Create, configure and review electoral logistics exercises."
        action={
          can("manage_operations") ? (
            <button className={buttonPrimary} onClick={() => setCreate(true)}>
              <span className={"flex items-center gap-2"}>
                <Plus size={16} />
                Create Operation
              </span>
            </button>
          ) : undefined
        }
      />
      <StatGrid
        items={[
          {
            label: "Total Operations",
            value: operations.length,
            note: "Shared records",
            icon: <Activity size={18} />,
          },
          {
            label: "Running",
            value: operations.filter((o) => o.status === "RUNNING").length,
            note: "Operation active",
            tone: "bg-blue-50 text-blue-700",
            icon: <Play size={18} />,
          },
          {
            label: "Ready",
            value: operations.filter((o) => o.status === "READY").length,
            note: "Prepared to start",
            tone: "bg-emerald-50 text-emerald-700",
            icon: <Check size={18} />,
          },
          {
            label: "Total Deliveries",
            value: operations.reduce((n, o) => n + o.totalDeliveries, 0),
            note: "Across all exercises",
            tone: "bg-teal-50 text-teal-700",
            icon: <Truck size={18} />,
          },
        ]}
      />
      <section className={"rounded-lg border border-slate-200 bg-white"}>
        <div className={"flex flex-wrap gap-3 border-b border-slate-200 p-4"}>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search operation"
          />
          <select
            className={inputClass + " max-w-44"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            {["DRAFT", "READY", "RUNNING", "PAUSED", "COMPLETED"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className={"overflow-x-auto"}>
          <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`}>
            <thead>
              <tr>
                <th>Operation Name</th>
                <th>Operation ID</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Total Deliveries</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.name}</strong>
                  </td>
                  <td>{o.id}</td>
                  <td>{o.start.replace("T", " ")}</td>
                  <td>{o.end.replace("T", " ")}</td>
                  <td>
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                  </td>
                  <td>{o.totalDeliveries}</td>
                  <td>{o.createdAt}</td>
                  <td>
                    <button
                      className={`
  inline-flex! items-center! gap-y-1! gap-x-1! text-blue-600! bg-transparent!
  text-xs! font-semibold! border-0!  border-current!
  [&:hover]:text-blue-700!
`}
                      onClick={() => {
                        setSelectedId(o.id);
                        setTab("Overview");
                      }}
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter count={rows.length} total={operations.length} />
      </section>
      {create && (
        <OperationForm
          onClose={() => setCreate(false)}
          onSubmit={(o) => {
            addOperation(o);
            setCreate(false);
          }}
        />
      )}
      {selected && (
        <Modal
          title={selected.name}
          description={`${selected.id} · electoral logistics exercise`}
          onClose={() => setSelectedId(null)}
        >
          <div className={"flex overflow-x-auto border-b border-slate-200 px-5"}>
            {[
              "Overview",
              "Locations",
              "Vehicles",
              "Personnel",
              "Deliveries",
              "Operation",
            ].map((name) => (
              <button
                key={name}
                className={`border-b-2 px-3 py-3 text-sm font-medium ${tab === name ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className={"p-5"}>
            {tab === "Overview" ? (
              <OperationOverview operation={selected} />
            ) : tab === "Operation" ? (
              <SimulationControl operation={selected} />
            ) : (
              <OperationSubtab name={tab} operation={selected} />
            )}
          </div>
        </Modal>
      )}
      <Toast />
    </Workspace>
  );
}
function OperationForm({
  onClose,
  onSubmit,
}: {
  onClose(): void;
  onSubmit(o: Omit<Operation, "id" | "createdAt" | "totalDeliveries">): void;
}) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("2026-12-15T07:00");
  const [end, setEnd] = useState("2026-12-15T18:00");
  const [seed, setSeed] = useState("ELIP-NG-2615");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Operation name is required.");
      return;
    }
    if (end <= start) {
      setError("End date and time must be after the start.");
      return;
    }
    onSubmit({ name: name.trim(), start, end, seed, status: "DRAFT" });
  };
  return (
    <Modal
      title="Create Operation"
      description="Create a exercise ."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={"grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2"}>
          <Field label="Operation Name" required>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Operation Seed" required>
            <input
              className={inputClass}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </Field>
          <Field label="Start Date and Time" required>
            <input
              type="datetime-local"
              className={inputClass}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="End Date and Time" required>
            <input
              type="datetime-local"
              className={inputClass}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
          {error && (
            <p className={"sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700"}>
              {error}
            </p>
          )}
        </div>
        <div className={"flex justify-end gap-2 border-t border-slate-200 p-5"}>
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={buttonPrimary}>Create Operation</button>
        </div>
      </form>
    </Modal>
  );
}
function OperationOverview({ operation }: { operation: Operation }) {
  const { vehicles } = useData();
  return (
    <div className={"grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"}>
      <Info label="Operation Status" value={operation.status} />
      <Info
        label="Schedule"
        value={`${operation.start.replace("T", " ")} — ${operation.end.replace("T", " ")}`}
      />
      <Info label="Operation Seed" value={operation.seed} />
      <Info
        label="Number of Deliveries"
        value={String(operation.totalDeliveries)}
      />
      <Info
        label="Assigned Vehicles"
        value={String(
          vehicles.filter(
            (v) => v.operationId === operation.id && v.status === "ASSIGNED",
          ).length,
        )}
      />
      <Info
        label="Setup Completeness"
        value={operation.status === "DRAFT" ? "35%" : "100%"}
      />
    </div>
  );
}
function OperationSubtab({
  name,
  operation,
}: {
  name: string;
  operation: Operation;
}) {
  const { vehicles, personnel, deliveries } = useData();
  const data =
    name === "Vehicles"
      ? vehicles
      : name === "Personnel"
        ? personnel
        : name === "Deliveries"
          ? deliveries.slice(0, 8)
          : [
              {
                id: "LOC-001",
                code: "NG-NC-HUB-01",
                type: "HUB",
                region: "North Central",
              },
              {
                id: "LOC-002",
                code: "NG-SW-ZONE-014",
                type: "DESTINATION",
                region: "South West",
              },
            ];
  return (
    <div>
      <div className={"flex items-center justify-between"}>
        <SectionHead
          title={name}
          description={`Records associated with ${operation.name}.`}
        />
        <button className={buttonSecondary}>
          <span className={"flex items-center gap-2"}>
            <Plus size={15} />
            Add {name.replace(/s$/, "")}
          </span>
        </button>
      </div>
      <div className={"mt-4 space-y-2"}>
        {data.map((item: any) => (
          <div
            key={item.id}
            className={"flex items-center justify-between rounded-md border border-slate-200 p-3"}
          >
            <div>
              <strong className={"text-sm text-slate-800"}>{item.code}</strong>
              <span className={"ml-3 text-xs text-slate-500"}>
                {item.region ?? item.role ?? item.status}
              </span>
            </div>
            <ChevronRight size={15} className={"text-slate-400"} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourcesPage() {
  const { can } = usePermissions();
  const { vehicles, personnel, operations, addVehicle, addPersonnel } =
    useData();
  const [tab, setTab] = useState("Vehicles");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [add, setAdd] = useState(false);
  const rows = (tab === "Vehicles" ? vehicles : personnel).filter(
    (r) =>
      `${r.code} ${r.assignment}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "ALL" || r.status === status),
  );
  return (
    <Workspace>
      <PageHead
        title="Vehicles & Resources"
        subtitle="Manage logistics vehicles and personnel records."
        action={
          <button
            className={buttonPrimary}
            disabled={!can("assign_resources")}
            onClick={() => setAdd(true)}
          >
            <span className={"flex items-center gap-2"}>
              <Plus size={16} />
              Add {tab === "Vehicles" ? "Vehicle" : "Personnel"}
            </span>
          </button>
        }
      />
      <div className={"flex gap-1 rounded-lg border border-slate-200 bg-white p-1"}>
        {["Vehicles", "Personnel"].map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${tab === x ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {x}
          </button>
        ))}
      </div>
      <StatGrid
        items={
          tab === "Vehicles"
            ? [
                {
                  label: "Total Vehicles",
                  value: vehicles.length,
                  note: "fleet",
                  icon: <Truck size={18} />,
                },
                {
                  label: "Available",
                  value: vehicles.filter((v) => v.status === "AVAILABLE")
                    .length,
                  note: "Ready for assignment",
                  tone: "bg-emerald-50 text-emerald-700",
                  icon: <Check size={18} />,
                },
                {
                  label: "Assigned",
                  value: vehicles.filter((v) => v.status === "ASSIGNED").length,
                  note: "Active allocation",
                  tone: "bg-blue-50 text-blue-700",
                  icon: <Activity size={18} />,
                },
                {
                  label: "Unavailable",
                  value: vehicles.filter((v) => v.status === "UNAVAILABLE")
                    .length,
                  note: "Not assignable",
                  tone: "bg-red-50 text-red-700",
                  icon: <AlertTriangle size={18} />,
                },
              ]
            : [
                {
                  label: "Total Personnel",
                  value: personnel.length,
                  note: "records",
                  icon: <Users size={18} />,
                },
                {
                  label: "Available",
                  value: personnel.filter((v) => v.status === "AVAILABLE")
                    .length,
                  note: "Unassigned",
                  tone: "bg-emerald-50 text-emerald-700",
                  icon: <Check size={18} />,
                },
                {
                  label: "Assigned",
                  value: personnel.filter((v) => v.status === "ASSIGNED")
                    .length,
                  note: "Current exercise",
                  tone: "bg-blue-50 text-blue-700",
                  icon: <Activity size={18} />,
                },
                {
                  label: "Unavailable",
                  value: personnel.filter((v) => v.status === "UNAVAILABLE")
                    .length,
                  note: "No active allocation",
                  tone: "bg-slate-100 text-slate-700",
                  icon: <UserRound size={18} />,
                },
              ]
        }
      />
      <section className={"rounded-lg border border-slate-200 bg-white"}>
        <div className={"flex flex-wrap gap-3 border-b border-slate-200 p-4"}>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={`Search ${tab.toLowerCase()}`}
          />
          <select
            className={inputClass + " max-w-44"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All availability</option>
            <option>AVAILABLE</option>
            <option>ASSIGNED</option>
            <option>UNAVAILABLE</option>
          </select>
        </div>
        <div className={"overflow-x-auto"}>
          <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`}>
            <thead>
              <tr>
                {tab === "Vehicles" ? (
                  <>
                    <th>Vehicle Code</th>
                    <th>Capacity Units</th>
                  </>
                ) : (
                  <>
                    <th>Staff Code</th>
                    <th>Role</th>
                  </>
                )}
                <th>Availability</th>
                <th>Current Assignment</th>
                <th>Operation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.code}</strong>
                  </td>
                  <td>{r.capacity ?? r.role}</td>
                  <td>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td>{r.assignment}</td>
                  <td>
                    {operations.find((o) => o.id === r.operationId)?.name}
                  </td>
                  <td>
                    <button className={`
  inline-flex! items-center! gap-y-1! gap-x-1! text-blue-600! bg-transparent!
  text-xs! font-semibold! border-0!  border-current!
  [&:hover]:text-blue-700!
`}>
                      View Record <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter
          count={rows.length}
          total={(tab === "Vehicles" ? vehicles : personnel).length}
        />
      </section>
      {add && (
        <ResourceForm
          type={tab}
          onClose={() => setAdd(false)}
          onSubmit={(record: any) => {
            const ok =
              tab === "Vehicles"
                ? addVehicle(record)
                : (addPersonnel(record), true);
            if (ok) setAdd(false);
          }}
        />
      )}
      <Toast />
    </Workspace>
  );
}
function ResourceForm({
  type,
  onClose,
  onSubmit,
}: {
  type: string;
  onClose(): void;
  onSubmit(r: any): void;
}) {
  const { operations } = useData();
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState(12);
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("A unique code is required.");
      return;
    }
    const record =
      type === "Vehicles"
        ? {
            code: code.trim(),
            capacity,
            status: "AVAILABLE",
            operationId: operations[0].id,
          }
        : {
            code: code.trim(),
            role: "Driver",
            status: "AVAILABLE",
            operationId: operations[0].id,
          };
    onSubmit(record);
  };
  return (
    <Modal
      title={`Add ${type === "Vehicles" ? "Vehicle" : "Personnel"}`}
      description="Create a resource in the selected operation."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={"grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2"}>
          <Field
            label={type === "Vehicles" ? "Vehicle Code" : "Staff Code"}
            required
          >
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={type === "Vehicles" ? "VEH-011" : "STF-009"}
            />
          </Field>
          {type === "Vehicles" ? (
            <Field label="Capacity Units" required>
              <input
                type="number"
                min="1"
                className={inputClass}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </Field>
          ) : (
            <Field label="Role">
              <select className={inputClass}>
                <option>Driver</option>
                <option>Logistics Officer</option>
              </select>
            </Field>
          )}
          <Field label="Availability Status">
            <select className={inputClass}>
              <option>AVAILABLE</option>
              <option>UNAVAILABLE</option>
            </select>
          </Field>
          <Field label="Operation">
            <select className={inputClass}>
              <option>{operations[0].name}</option>
            </select>
          </Field>
          {error && (
            <p className={"sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700"}>
              {error}
            </p>
          )}
        </div>
        <div className={"flex justify-end gap-2 border-t border-slate-200 p-5"}>
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={buttonPrimary}>Create Record</button>
        </div>
      </form>
    </Modal>
  );
}

export function SimulationControl({ operation }: { operation: Operation }) {
  const { simulationState, setSimulationState, simulationEvents } = useData();
  const [scenario, setScenario] = useState("Normal Operations");
  return (
    <div className={"space-y-5"}>
      <div className={"rounded-lg border border-slate-200 bg-slate-50 p-4"}>
        <div className={"grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3"}>
          <Info label="Operation State" value={simulationState} />
          <Info label="Operation Seed" value={operation.seed} />
          <Info label="Elapsed Time" value="2h 32m" />
          <Info label="Event Count" value="184" />
          <Info label="Active Journeys" value="25" />
        </div>
      </div>
      <div>
        <SectionHead
          title="Controls"
          description="Manage the selected operation."
        />
        <div className={"mt-3 flex flex-wrap gap-2"}>
          <button
            className={buttonPrimary}
            disabled={simulationState === "RUNNING"}
            onClick={() => setSimulationState("RUNNING")}
          >
            <span className={"flex items-center gap-2"}>
              <Play size={15} />
              Start Operation
            </span>
          </button>
          <button
            className={buttonSecondary}
            disabled={simulationState !== "RUNNING"}
            onClick={() => setSimulationState("PAUSED")}
          >
            <span className={"flex items-center gap-2"}>
              <Pause size={15} />
              Pause Operation
            </span>
          </button>
          <button
            className={buttonSecondary}
            onClick={() =>
              window.confirm("Reset the operation state?") &&
              setSimulationState("READY")
            }
          >
            <span className={"flex items-center gap-2"}>
              <RotateCcw size={15} />
              Reset Operation
            </span>
          </button>
        </div>
      </div>
      <Field label="Available Scenario">
        <select
          className={inputClass}
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
        >
          <option>Normal Operations</option>
          <option>Rainfall Disruption</option>
          <option>Road Disruption</option>
          <option>Vehicle Unavailability</option>
        </select>
        <span className={"mt-2 block text-xs text-slate-500"}>
          {scenario === "Normal Operations"
            ? "Baseline movement and delivery event replay."
            : `Deterministic ${scenario.toLowerCase()} event sequence.`}
        </span>
      </Field>
      <div>
        <SectionHead
          title="Operation Event Stream"
          description={
            simulationState === "PAUSED"
              ? "Paused — no new movement updates are generated."
              : "Recorded operation events."
          }
        />
        <div className={"mt-3 overflow-x-auto rounded-md border border-slate-200"}>
          <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`} data-state="compact">
            <thead>
              <tr>
                <th>Event Time</th>
                <th>Event Type</th>
                <th>Delivery</th>
                <th>Vehicle</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {simulationEvents.map((e) => (
                <tr key={e.id}>
                  <td>{e.time}</td>
                  <td>
                    <Badge tone="blue">{e.type}</Badge>
                  </td>
                  <td>{e.delivery}</td>
                  <td>{e.vehicle}</td>
                  <td>{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { deliveries, vehicles, operations } = useData();
  const completed = deliveries.filter((d) => d.status === "CONFIRMED");
  const onTime = completed.filter((d) => d.lateness === 0);
  const avg = Math.round(
    completed.reduce((n, d) => n + d.duration, 0) / completed.length,
  );
  const utilisation = Math.round(
    (vehicles.filter((v) => v.status === "ASSIGNED").length / vehicles.length) *
      100,
  );
  const regions = ["North Central", "South West", "South East", "North West"];
  return (
    <Workspace>
      <PageHead
        title="Performance Analytics"
        subtitle="Aggregate reporting for the selected operation."
      />
      <div className={"flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4"}>
        <select className={inputClass + " max-w-56"}>
          <option>{operations[0].name}</option>
        </select>
        <input
          type="date"
          className={inputClass + " max-w-44"}
          defaultValue="2026-12-03"
        />
        <select className={inputClass + " max-w-48"}>
          <option>All delivery statuses</option>
          <option>CONFIRMED</option>
          <option>IN_TRANSIT</option>
        </select>
        <select className={inputClass + " max-w-48"}>
          <option>All regions</option>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className={"grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        <Metric
          label="Total Scheduled Deliveries"
          value={deliveries.length.toString()}
          note="Canonical operation dataset"
        />
        <Metric
          label="Completed Deliveries"
          value={completed.length.toString()}
          note="Confirmed receipt records"
        />
        <Metric
          label="On-Time Delivery Rate"
          value={`${Math.round((onTime.length / completed.length) * 100)}%`}
          note={`${onTime.length} of ${completed.length} completed`}
        />
        <Metric
          label="Late Delivery Rate"
          value={`${Math.round(((completed.length - onTime.length) / completed.length) * 100)}%`}
          note="Based on recorded arrivals"
        />
        <Metric
          label="Average Delivery Duration"
          value={`${avg} min`}
          note="Completed deliveries only"
        />
        <Metric
          label="Vehicle Utilisation"
          value={`${utilisation}%`}
          note={`${vehicles.filter((v) => v.status === "ASSIGNED").length} of ${vehicles.length} assigned`}
        />
      </div>
      <div className={"grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2"}>
        <ChartCard
          title="Delivery Completion Trend"
          subtitle="Confirmed deliveries by operation hour"
        >
          <div className={`
  w-full! h-45! pt-0! pr-2! pb-0! pl-2! flex! items-end!
  justify-around! border-b! border-solid!
  border-b-slate-200! [&_>_div]:w-11/100! [&_>_div]:h-full! [&_>_div]:flex!
  [&_>_div]:flex-col! [&_>_div]:items-center! [&_>_div]:justify-end! [&_i]:w-full! [&_i]:min-h-1.25!
  [&_i]:block! [&_i]:rounded-t-sm! [&_i]:bg-blue-600! [&_span]:mt-2!
  [&_span]:text-slate-500! [&_span]:text-caption! max-lg:[&_span]:text-xs!
`}>
            {[8, 14, 23, 31, 38, 42].map((v, i) => (
              <div key={v}>
                <i className={"h-(--bar-height)"} style={{ "--bar-height": `${(v / 42) * 100}%` } as CSSProperties} />
                <span>{`${8 + i}:00`}</span>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard
          title="Delivery Status Distribution"
          subtitle="Lifecycle statuses; risk conditions excluded"
        >
          <div className={`
  w-37! h-37! relative! grid! place-items-center! rounded-full!
  bg-fleet-progress!
  [&::before]:content-empty! [&::before]:absolute! [&::before]:top-4! [&::before]:right-4!
  [&::before]:bottom-4! [&::before]:left-4! [&::before]:rounded-full! [&::before]:bg-white!
  [&_>_div]:z-1! [&_>_div]:text-center! [&_strong]:block! [&_strong]:text-slate-900!
  [&_strong]:text-2xl! [&_span]:block! [&_span]:text-slate-500! [&_span]:text-caption! max-lg:[&_span]:text-xs!
`}>
            <div>
              <strong>75</strong>
              <span>scheduled</span>
            </div>
          </div>
          <ul className={`
  min-w-37.5! ml-0! sm:ml-8! grid! gap-y-3! gap-x-3! text-slate-600!
  text-xs! [&_li]:grid! [&_li]:grid-cols-event-row! [&_li]:items-center!
  [&_li]:gap-y-2! [&_li]:gap-x-2! [&_i]:w-1.75! [&_i]:h-1.75! [&_i]:rounded-full!
  [&_strong]:text-slate-900! max-workspace-mobile:ml-0!
`}>
            <li>
              <i className={"bg-emerald-500"} />
              Confirmed <strong>42</strong>
            </li>
            <li>
              <i className={"bg-blue-500"} />
              In transit <strong>25</strong>
            </li>
            <li>
              <i className={"bg-slate-400"} />
              Pending <strong>8</strong>
            </li>
          </ul>
        </ChartCard>
        <ChartCard
          title="Delay Distribution"
          subtitle="Recorded lateness in minutes"
        >
          <div className={`
  w-full! grid! gap-y-3! gap-x-3! [&_>_div]:grid!
  [&_>_div]:grid-cols-notification-row! [&_>_div]:items-center! [&_>_div]:gap-y-3!
  [&_>_div]:gap-x-3! [&_>_div]:text-slate-500! [&_>_div]:text-detail! max-lg:[&_>_div]:text-xs! [&_>_div_>_div]:h-2!
  [&_>_div_>_div]:overflow-x-hidden! [&_>_div_>_div]:overflow-y-hidden! [&_>_div_>_div]:rounded-full!
  [&_>_div_>_div]:bg-slate-100! [&_i]:h-full! [&_i]:min-w-0.75! [&_i]:block! [&_i]:rounded-full!
  [&_i]:bg-teal-500! [&_strong]:text-slate-700! [&_strong]:text-right!
`}>
            {[
              ["On time", 38],
              ["1–15 min", 0],
              ["16–30 min", 2],
              ["31+ min", 2],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i className={"w-(--bar-width)"} style={{ "--bar-width": `${(Number(value) / 42) * 100}%` } as CSSProperties} />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard
          title="Vehicle Utilisation"
          subtitle="Delivery assignments by vehicle"
        >
          <div className={`
  w-full! grid! gap-y-3! gap-x-3! [&_>_div]:grid!
  [&_>_div]:grid-cols-notification-row! [&_>_div]:items-center! [&_>_div]:gap-y-3!
  [&_>_div]:gap-x-3! [&_>_div]:text-slate-500! [&_>_div]:text-detail! max-lg:[&_>_div]:text-xs! [&_>_div_>_div]:h-2!
  [&_>_div_>_div]:overflow-x-hidden! [&_>_div_>_div]:overflow-y-hidden! [&_>_div_>_div]:rounded-full!
  [&_>_div_>_div]:bg-slate-100! [&_i]:h-full! [&_i]:min-w-0.75! [&_i]:block! [&_i]:rounded-full!
  [&_i]:bg-teal-500! [&_strong]:text-slate-700! [&_strong]:text-right!
`}>
            {vehicles.slice(0, 6).map((v, i) => (
              <div key={v.id}>
                <span>{v.code}</span>
                <div>
                  <i className={"w-(--bar-width)"} style={{ "--bar-width": `${55 + i * 7}%` } as CSSProperties} />
                </div>
                <strong>{55 + i * 7}%</strong>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
      <section className={"rounded-lg border border-slate-200 bg-white"}>
        <div className={"p-4"}>
          <SectionHead
            title="Delivery Analytics"
            description="Figures are derived from the shared delivery records."
          />
        </div>
        <div className={"overflow-x-auto"}>
          <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`}>
            <thead>
              <tr>
                <th>Delivery Code</th>
                <th>Scheduled Deadline</th>
                <th>Actual Arrival</th>
                <th>Duration</th>
                <th>Lateness</th>
                <th>Vehicle</th>
                <th>Final Status</th>
              </tr>
            </thead>
            <tbody>
              {completed.slice(0, 8).map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.code}</strong>
                  </td>
                  <td>{d.deadline.replace("T", " ")}</td>
                  <td>{d.arrival?.replace("T", " ")}</td>
                  <td>{d.duration} min</td>
                  <td>{d.lateness} min</td>
                  <td>{d.vehicle}</td>
                  <td>
                    <Badge tone="green">{d.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter count={8} total={completed.length} />
      </section>
      <div className={"rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500"}>
        <strong className={"text-slate-700"}>
          Prediction accuracy unavailable.
        </strong>{" "}
        No evaluated model-metrics response is connected, so ETA MAE is not
        displayed.
      </div>
    </Workspace>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={"rounded-lg border border-slate-200 bg-white p-5"}>
      <span className={"text-xs font-medium text-slate-500"}>{label}</span>
      <strong className={"mt-2 block text-3xl font-semibold tabular-nums text-slate-900"}>
        {value}
      </strong>
      <p className={"mt-1 text-xs text-slate-500"}>{note}</p>
    </div>
  );
}
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className={"min-w-0 min-h-72 rounded-lg border border-slate-200 bg-white p-5"}>
      <SectionHead title={title} description={subtitle} />
      <div className={"mt-5 flex min-h-48 flex-col items-center justify-center gap-4 sm:flex-row"}>
        {children}
      </div>
    </section>
  );
}

export function AuditPage() {
  const { audits, currentUser } = useData();
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("ALL");
  const [selected, setSelected] = useState<(typeof audits)[number] | null>(
    null,
  );
  const rows = audits.filter(
    (a) =>
      `${a.actor} ${a.action} ${a.entityId}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (entity === "ALL" || a.entityType === entity),
  );
  if (currentUser.role !== "Administrator")
    return (
      <Workspace>
        <PageHead
          title="Audit History"
          subtitle="Read-only administrative event history."
        />
        <div className={"rounded-lg border border-red-200 bg-red-50 p-6 text-red-700"}>
          <ShieldCheck />
          <h2 className={"mt-3 text-lg font-semibold"}>
            Administrator access required
          </h2>
          <p className={"mt-1 text-sm"}>
            Audit records are restricted and cannot be edited or deleted.
          </p>
        </div>
      </Workspace>
    );
  return (
    <Workspace>
      <PageHead
        title="Audit History"
        subtitle="Read-only administrative event history for the shared prototype."
      />
      <div className={"rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"}>
        <strong>Read-only record.</strong> Audit events cannot be edited or
        deleted.
      </div>
      <section className={"rounded-lg border border-slate-200 bg-white"}>
        <div className={"flex flex-wrap gap-3 border-b border-slate-200 p-4"}>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search actor, action or entity"
          />
          <input
            type="date"
            className={inputClass + " max-w-44"}
            defaultValue="2026-12-03"
          />
          <select
            className={inputClass + " max-w-44"}
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="ALL">All entity types</option>
            {[
              "Alert",
              "Delivery",
              "Scenario",
              "Disruption",
              "Operation",
              "User",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className={"overflow-x-auto"}>
          {rows.length ? (
            <table className={`
  w-full! border-collapse! text-slate-600! text-xs! [&_th]:h-11! [&_th]:pt-0!
  [&_th]:pr-4! [&_th]:pb-0! [&_th]:pl-4! [&_th]:bg-slate-50! [&_th]:text-slate-500!
  [&_th]:text-detail! max-lg:[&_th]:text-xs! [&_th]:font-semibold! [&_th]:text-left! [&_th]:uppercase!
  [&_th]:tracking-label! [&_th]:whitespace-nowrap! [&_td]:h-14.5! [&_td]:pt-0! [&_td]:pr-4!
  [&_td]:pb-0! [&_td]:pl-4! [&_td]:border-t! [&_td]:border-solid!
  [&_td]:border-t-slate-200! [&_td]:whitespace-nowrap!
  [&_tbody_tr:hover_td]:bg-slate-50! [&_td_strong]:text-slate-800! [&_td_strong]:font-semibold!
  [&[data-state~=compact]_th]:h-9.5! [&[data-state~=compact]_th]:pl-3! [&[data-state~=compact]_th]:pr-3!
  [&[data-state~=compact]_th]:text-caption! max-lg:[&[data-state~=compact]_th]:text-xs! [&[data-state~=compact]_td]:h-12! [&[data-state~=compact]_td]:pl-3!
  [&[data-state~=compact]_td]:pr-3! [&[data-state~=compact]_td]:text-detail! max-lg:[&[data-state~=compact]_td]:text-xs! max-workspace-mobile:min-w-190!
`}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>{a.timestamp}</td>
                    <td>{a.actor}</td>
                    <td>
                      <Badge tone="slate">{a.action}</Badge>
                    </td>
                    <td>{a.entityType}</td>
                    <td>
                      <strong>{a.entityId}</strong>
                    </td>
                    <td>
                      <button
                        className={`
  inline-flex! items-center! gap-y-1! gap-x-1! text-blue-600! bg-transparent!
  text-xs! font-semibold! border-0!  border-current!
  [&:hover]:text-blue-700!
`}
                        onClick={() => setSelected(a)}
                      >
                        Details <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty
              title="No audit events found"
              description="Change the search or entity filter."
            />
          )}
        </div>
        <TableFooter count={rows.length} total={audits.length} />
      </section>
      {selected && (
        <Modal
          title="Audit Event Details"
          description={`${selected.id} · Stored audit record`}
          onClose={() => setSelected(null)}
        >
          <div className={"grid min-w-0 grid-cols-1 gap-4 p-5 sm:grid-cols-2"}>
            <Info label="Timestamp" value={selected.timestamp} />
            <Info label="Actor" value={selected.actor} />
            <Info label="Action" value={selected.action} />
            <Info
              label="Entity"
              value={`${selected.entityType} · ${selected.entityId}`}
            />
            <div className={"sm:col-span-2"}>
              <Info label="Recorded Detail" value={selected.detail} />
            </div>
          </div>
          <div className={"border-t border-slate-200 bg-slate-50 p-5 text-xs text-slate-500"}>
            Only fields present in the stored audit record are displayed.
          </div>
        </Modal>
      )}
    </Workspace>
  );
}

function Workspace({ children }: { children: ReactNode }) {
  return <div className={`
  min-w-0 space-y-5 min-h-workspace! pt-7! pr-8! pb-7! pl-8! bg-slate-50!
  font-sans! max-workspace-mobile:pt-5.5! max-workspace-mobile:pr-3.5! max-workspace-mobile:pb-5.5!
  max-workspace-mobile:pl-3.5!
`}>{children}</div>;
}
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={"block"}>
      <span className={"mb-2 block text-xs font-semibold text-slate-700"}>
        {label}
        {required && <b className={"ml-1 text-red-600"}>*</b>}
      </span>
      {children}
    </label>
  );
}
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className={"rounded-md border border-slate-200 bg-white p-4"}>
      <span className={"text-xs text-slate-500"}>{label}</span>
      <strong className={"mt-1 block wrap-anywhere text-sm text-slate-800"}>
        {value ?? "—"}
      </strong>
    </div>
  );
}
function SectionHead({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className={"text-lg font-semibold text-slate-900"}>{title}</h2>
      <p className={"mt-1 text-xs text-slate-500"}>{description}</p>
    </div>
  );
}
function TableFooter({ count, total }: { count: number; total: number }) {
  return (
    <div className={"flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500"}>
      <span>
        Showing <strong className={"text-slate-700"}>{count}</strong> of {total}
      </span>
      <div className={"flex gap-1"}>
        <button
          className={"rounded-md border border-slate-200 px-3 py-2"}
          disabled
        >
          Previous
        </button>
        <button className={"rounded-md bg-blue-600 px-3 py-2 text-white"}>
          1
        </button>
        <button className={"rounded-md border border-slate-200 px-3 py-2"}>
          Next
        </button>
      </div>
    </div>
  );
}
