import { ROUTES, buildRoute } from "../../../routes";
import L from "leaflet";
import {
  AlertTriangle,
  Clock3,
  Crosshair,
  Map as MapIcon,
  Route,
  Search,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate, useSearchParams } from "react-router";
import { NigeriaMapLayers } from "../components/NigeriaMapLayers";
import { LiveLocation } from "../components/LiveLocation";
import { JourneyRoute } from "../components/JourneyRoute";
import type { MapPoint } from "../services/roadRoute";
import {
  nigeriaBounds,
  nigeriaNavigationBounds,
  type GeopoliticalZone,
  type MapZone,
} from "../config/nigeriaMap";

type Freshness = "Fresh" | "Delayed" | "Stale" | "Unavailable";
type Vehicle = {
  id: string;
  delivery: string;
  destination: string;
  zone: GeopoliticalZone;
  state: string;
  position: [number, number] | null;
  freshness: Freshness;
  updated: string;
  age: string;
  speed?: number;
  heading?: string;
  eta: string;
  deadline: string;
  risk: "On track" | "At risk";
};

const vehicles: Vehicle[] = [
  {
    id: "VEH-003",
    delivery: "SIM-002",
    destination: "NG-NC-ZONE-008",
    zone: "North Central",
    state: "FCT",
    position: [9.112, 7.431],
    freshness: "Fresh",
    updated: "09:31:42",
    age: "36 sec ago",
    speed: 42,
    heading: "NE",
    eta: "10:45",
    deadline: "11:00",
    risk: "On track",
  },
  {
    id: "VEH-005",
    delivery: "SIM-018",
    destination: "NG-SW-ZONE-014",
    zone: "South West",
    state: "Oyo",
    position: [7.516, 3.807],
    freshness: "Fresh",
    updated: "09:30:54",
    age: "1 min ago",
    speed: 36,
    heading: "N",
    eta: "10:58",
    deadline: "10:30",
    risk: "At risk",
  },
  {
    id: "VEH-007",
    delivery: "SIM-024",
    destination: "NG-NW-ZONE-011",
    zone: "North West",
    state: "Kaduna",
    position: [10.384, 7.672],
    freshness: "Delayed",
    updated: "09:22:10",
    age: "10 min ago",
    speed: 31,
    heading: "NW",
    eta: "11:05",
    deadline: "10:30",
    risk: "At risk",
  },
  {
    id: "VEH-009",
    delivery: "SIM-041",
    destination: "NG-SE-ZONE-006",
    zone: "South East",
    state: "Enugu",
    position: [6.516, 7.482],
    freshness: "Fresh",
    updated: "09:29:33",
    age: "3 min ago",
    speed: 48,
    heading: "SE",
    eta: "09:51",
    deadline: "09:20",
    risk: "At risk",
  },
  {
    id: "VEH-011",
    delivery: "SIM-029",
    destination: "NG-NE-ZONE-003",
    zone: "North East",
    state: "Bauchi",
    position: [10.129, 9.661],
    freshness: "Stale",
    updated: "09:08:04",
    age: "24 min ago",
    speed: 0,
    heading: "—",
    eta: "10:42",
    deadline: "10:15",
    risk: "At risk",
  },
  {
    id: "VEH-014",
    delivery: "SIM-057",
    destination: "NG-SS-ZONE-019",
    zone: "South South",
    state: "Rivers",
    position: [4.891, 6.968],
    freshness: "Fresh",
    updated: "09:31:05",
    age: "1 min ago",
    speed: 29,
    heading: "S",
    eta: "11:20",
    deadline: "11:45",
    risk: "On track",
  },
  {
    id: "VEH-016",
    delivery: "SIM-063",
    destination: "NG-NW-ZONE-021",
    zone: "North West",
    state: "Kano",
    position: null,
    freshness: "Unavailable",
    updated: "Never",
    age: "No signal received",
    eta: "—",
    deadline: "12:10",
    risk: "On track",
  },
  {
    id: "VEH-018",
    delivery: "SIM-067",
    destination: "NG-NC-ZONE-024",
    zone: "North Central",
    state: "Niger",
    position: [9.601, 6.552],
    freshness: "Fresh",
    updated: "09:30:28",
    age: "2 min ago",
    speed: 34,
    heading: "W",
    eta: "11:35",
    deadline: "11:50",
    risk: "On track",
  },
];

const hubs: {
  name: string;
  zone: GeopoliticalZone;
  position: [number, number];
}[] = [
  {
    name: "North West Operation Hub",
    zone: "North West",
    position: [11.96, 8.52],
  },
  {
    name: "North East Operation Hub",
    zone: "North East",
    position: [11.83, 13.15],
  },
  {
    name: "North Central Operation Hub",
    zone: "North Central",
    position: [9.08, 7.49],
  },
  {
    name: "South West Operation Hub",
    zone: "South West",
    position: [6.55, 3.38],
  },
  {
    name: "South East Operation Hub",
    zone: "South East",
    position: [6.44, 7.5],
  },
  {
    name: "South South Operation Hub",
    zone: "South South",
    position: [4.81, 7.03],
  },
];

const routes: Record<string, MapPoint[]> = {
  "VEH-003": [
    [9.08, 7.49],
    [9.112, 7.431],
    [9.23, 7.1],
  ],
  "VEH-005": [
    [6.55, 3.38],
    [7.12, 3.58],
    [7.516, 3.807],
  ],
  "VEH-007": [
    [11.96, 8.52],
    [10.9, 8.1],
    [10.384, 7.672],
  ],
  "VEH-009": [
    [6.44, 7.5],
    [6.516, 7.482],
    [6.2, 7.7],
  ],
  "VEH-011": [
    [11.83, 13.15],
    [11.1, 11.8],
    [10.129, 9.661],
  ],
  "VEH-014": [
    [4.81, 7.03],
    [4.891, 6.968],
    [5.1, 6.7],
  ],
  "VEH-018": [
    [9.08, 7.49],
    [9.32, 7.04],
    [9.601, 6.552],
  ],
};

const freshnessStyles = {
  Fresh: { className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
  Delayed: { className: "bg-amber-100 text-amber-700", dot: "bg-amber-600" },
  Stale: { className: "bg-red-50 text-red-700", dot: "bg-red-600" },
  Unavailable: {
    className: "bg-slate-100 text-slate-500",
    dot: "bg-slate-500",
  },
};

function vehicleIcon(vehicle: Vehicle, selected: boolean) {
  const markerClasses =
    vehicle.freshness === "Stale"
      ? "bg-red-600 ring-red-200"
      : vehicle.freshness === "Delayed"
        ? "bg-amber-600 ring-amber-200"
        : "bg-blue-600 ring-blue-200";
  const selectionClasses = selected ? "scale-125 ring-4" : "ring-2";
  return L.divIcon({
    className: "bg-transparent border-0",
    html: `<div class="grid size-8 place-items-center rounded-full border-2 border-white text-white shadow-md transition duration-200 ${markerClasses} ${selectionClasses}">${renderToStaticMarkup(<Truck aria-hidden="true" className="size-4" strokeWidth={1.8} />)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

type MiniIconType =
  | "search"
  | "truck"
  | "clock"
  | "route"
  | "alert"
  | "map"
  | "close"
  | "target";
function MiniIcon({ type }: { type: MiniIconType }) {
  const icons: Record<MiniIconType, LucideIcon> = {
    search: Search,
    truck: Truck,
    clock: Clock3,
    route: Route,
    alert: AlertTriangle,
    map: MapIcon,
    close: X,
    target: Crosshair,
  };
  const Component = icons[type];
  return (
    <Component
      aria-hidden="true"
      className="size-4 shrink-0"
      strokeWidth={1.8}
    />
  );
}

export default function MovementMap() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const deliveryId = searchParams.get("delivery");
  const vehicleId = searchParams.get("vehicle");
  // A delivery takes precedence: never show another delivery's route just because
  // its vehicle is reused or the legacy delivery and telemetry records disagree.
  const selected = deliveryId
    ? (vehicles.find((vehicle) => vehicle.delivery === deliveryId) ?? null)
    : (vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null);
  const selectedPoints = selected ? routes[selected.id] : undefined;
  function setSelected(vehicle: Vehicle | null) {
    const next = new URLSearchParams(searchParams);
    if (vehicle) {
      next.set("delivery", vehicle.delivery);
      next.set("vehicle", vehicle.id);
    } else {
      next.delete("delivery");
      next.delete("vehicle");
    }
    setDetailsOpen(Boolean(vehicle));
    setSearchParams(next, { replace: true });
  }
  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState("All telemetry");
  const [zone, setZone] = useState<MapZone>("All zones");
  const [showRoutes, setShowRoutes] = useState(true);
  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const matchesQuery =
          `${vehicle.id} ${vehicle.delivery} ${vehicle.destination} ${vehicle.state}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return (
          matchesQuery &&
          (freshness === "All telemetry" || vehicle.freshness === freshness) &&
          (zone === "All zones" || vehicle.zone === zone)
        );
      }),
    [freshness, query, zone],
  );

  return (
    <div className="relative min-h-screen p-4 md:px-8 md:py-6">
      <header className="mb-5">
        <p className="m-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <span className="text-blue-600">Operations</span>
          <span aria-hidden="true">·</span> Nigeria
        </p>
        <h1 className="mt-2 mb-1 text-2xl font-bold tracking-tight leading-tight">
          Movement map
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor vehicle positions and telemetry across Nigeria.
        </p>
      </header>

      {(deliveryId || vehicleId) && !selected && (
        <p
          role="status"
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          No journey data is available for {deliveryId ?? vehicleId}.
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 ml-2 font-semibold underline"
          >
            View all vehicles
          </button>
        </p>
      )}
      <section
        aria-label="Vehicle metrics"
        className="mb-3 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 xl:flex xl:items-center xl:gap-6"
      >
        {[
          {
            icon: "truck",
            value: "8",
            label: "Active vehicles",
            className: "bg-blue-50 text-blue-600",
          },
          {
            icon: "target",
            value: "5",
            label: "Fresh signals",
            className: "bg-emerald-50 text-emerald-700",
          },
          {
            icon: "clock",
            value: "2",
            label: "Delayed or stale",
            className: "bg-amber-100 text-amber-700",
          },
          {
            icon: "alert",
            value: "1",
            label: "Position unavailable",
            className: "bg-slate-100 text-slate-500",
          },
        ].map((metric) => (
          <div key={metric.label} className="flex items-center gap-2">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-lg ${metric.className}`}
            >
              <MiniIcon type={metric.icon as MiniIconType} />
            </span>
            <p className="m-0 min-w-0">
              <strong className="block text-base text-slate-700">
                {metric.value}
              </strong>
              <span className="block text-xs text-slate-500">
                {metric.label}
              </span>
            </p>
          </div>
        ))}
        <div className="col-span-2 xl:ml-auto xl:w-40">
          <p className="m-0 flex justify-between gap-2 text-xs text-slate-500">
            <strong className="text-emerald-700">88%</strong> telemetry coverage
          </p>
          <progress
            aria-label="Telemetry coverage"
            value={88}
            max={100}
            className="mt-2 block h-2 w-full accent-emerald-700"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <label className="flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2 text-slate-400 md:w-56">
            <MiniIcon type="search" />
            <input
              aria-label="Search vehicle or delivery"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicle or delivery"
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 w-full border-0 bg-transparent text-xs text-slate-700 outline-none"
            />
          </label>
          <select
            aria-label="Geopolitical zone"
            value={zone}
            onChange={(e) => {
              setSelected(null);
              setZone(e.target.value as MapZone);
            }}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-600 md:flex-none"
          >
            <option>All zones</option>
            {hubs.map((hub) => (
              <option key={hub.zone}>{hub.zone}</option>
            ))}
          </select>
          <select
            aria-label="Telemetry freshness"
            value={freshness}
            onChange={(e) => setFreshness(e.target.value)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-600 md:flex-none"
          >
            <option>All telemetry</option>
            <option>Fresh</option>
            <option>Delayed</option>
            <option>Stale</option>
            <option>Unavailable</option>
          </select>
          <label className="flex w-full items-center gap-2 text-xs font-semibold text-slate-500 md:w-auto">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 peer sr-only"
            />
            <span className="flex h-5 w-9 items-center rounded-full bg-slate-300 p-1 transition-colors peer-checked:justify-end peer-checked:bg-blue-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500">
              <span className="size-3 rounded-full bg-white" />
            </span>
            Journey paths
          </label>
          <div className="ml-auto hidden items-center gap-3 text-xs text-slate-500 xl:flex">
            {(["Fresh", "Delayed", "Stale"] as const).map((status) => (
              <span key={status} className="flex items-center gap-1">
                <i
                  className={`size-2 rounded-full ${freshnessStyles[status].dot}`}
                />
                {status}
              </span>
            ))}
          </div>
        </div>

        <div className="flex h-auto flex-col md:h-144 md:flex-row">
          <div className="relative h-96 min-w-0 flex-none bg-slate-200 md:h-full md:flex-1">
            <MapContainer
              className="z-0 h-full w-full"
              bounds={nigeriaBounds}
              boundsOptions={{ padding: [12, 12] }}
              maxBounds={nigeriaNavigationBounds}
              maxBoundsViscosity={1}
              zoomSnap={0.25}
              minZoom={3}
              maxZoom={18}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap
                bounds={nigeriaNavigationBounds}
              />
              <NigeriaMapLayers
                zone={zone}
                focused={Boolean(selected?.position && selectedPoints)}
                onReset={() => {
                  setSelected(null);
                  setZone("All zones");
                }}
              />
              {selected?.position && selectedPoints && (
                <JourneyRoute
                  key={selected.id}
                  points={selectedPoints}
                  position={selected.position}
                  visible={showRoutes}
                  onFocus={() => setDetailsOpen(false)}
                />
              )}
              <LiveLocation
                onLocate={() => {
                  setSelected(null);
                  setZone("All zones");
                }}
              />
              {hubs.map((hub) => (
                <CircleMarker
                  key={hub.name}
                  center={hub.position}
                  radius={7}
                  pathOptions={{
                    color: "var(--color-slate-900)",
                    fillColor: "var(--color-white)",
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <strong>{hub.name}</strong>
                    <br />
                    {hub.zone}
                    <br />
                    <small>
                      Location details.
                      <br />
                      Not an operational facility.
                    </small>
                  </Popup>
                </CircleMarker>
              ))}
              {showRoutes &&
                Object.entries(routes)
                  .filter(([id]) => id !== selected?.id)
                  .map(([id, route]) => (
                    <Polyline
                      key={id}
                      positions={route}
                      pathOptions={{
                        color:
                          id === "VEH-011"
                            ? "var(--color-amber-600)"
                            : "var(--color-blue-600)",
                        weight: 3,
                        opacity: selected ? 0.15 : 0.35,
                        dashArray: "8 7",
                      }}
                    />
                  ))}
              {filteredVehicles
                .filter((v) => v.position)
                .map((v) => (
                  <Marker
                    key={v.id}
                    position={v.position!}
                    icon={vehicleIcon(v, selected?.id === v.id)}
                    eventHandlers={{ click: () => setSelected(v) }}
                  >
                    <Popup>
                      <strong>{v.id}</strong>
                      <br />
                      {v.delivery} · {v.destination}
                      <br />
                      <small>
                        {v.freshness} · updated {v.age}
                      </small>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
          <aside
            aria-label="Active vehicles"
            className="flex h-80 min-w-0 flex-col border-t border-slate-200 bg-white md:h-full md:w-64 md:shrink-0 md:border-t-0 md:border-l"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-3">
              <div>
                <h2 className="m-0 text-sm font-bold leading-normal text-slate-700">
                  Active vehicles
                </h2>
                <p className="m-0 mt-1 text-xs text-slate-400">
                  {filteredVehicles.length} matching records
                </p>
              </div>
              <button
                aria-label="More vehicle options"
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 border-0 bg-transparent text-slate-500"
              >
                •••
              </button>
            </div>
            {selected && (
              <div className="shrink-0 border-b border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                <strong>
                  {selected.delivery} · {selected.id}
                </strong>
                <p className="m-0 mt-1">
                  {selectedPoints && selected.position
                    ? "Journey selected on map"
                    : "No route or position is available for this vehicle."}
                </p>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 mt-2 font-semibold underline"
                >
                  Vehicle details
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredVehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={["focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11", `flex min-h-20 w-full items-center gap-2 border-0 border-b border-solid border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === v.id ? "bg-blue-50" : "bg-white"}`].filter(Boolean).join(" ")}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${freshnessStyles[v.freshness].className}`}
                  >
                    <MiniIcon type="truck" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1">
                      <strong className="text-xs text-slate-700">{v.id}</strong>
                      <span
                        className={`rounded-full px-1 py-0.5 text-xs font-semibold ${freshnessStyles[v.freshness].className}`}
                      >
                        {v.freshness}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                      {v.delivery} · {v.state}
                    </span>
                    <small className="mt-1 block truncate text-xs text-slate-400">
                      {v.position ? `Updated ${v.age}` : "Position unavailable"}
                    </small>
                  </span>
                  <span className="text-slate-400">›</span>
                </button>
              ))}
              {!filteredVehicles.length && (
                <div className="flex h-56 flex-col items-center justify-center gap-2 text-xs text-slate-400">
                  <MiniIcon type="search" />
                  <strong className="text-slate-600">No vehicles found</strong>
                  <span>Adjust the active filters.</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {selected && detailsOpen && (
        <aside
          aria-label="Vehicle details"
          className="fixed right-4 top-20 z-20 w-80 max-h-4/5 overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-xl max-md:inset-x-3 max-md:bottom-3 max-md:top-auto max-md:w-auto"
        >
          <div className="flex justify-between border-b border-slate-200 p-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Vehicle details
              </span>
              <h2 className="m-0 mt-1 text-lg font-bold leading-normal text-teal-900">
                {selected.id}
              </h2>
              <p className="m-0 text-xs text-slate-400">
                {selected.delivery} · {selected.destination}
              </p>
            </div>
            <button
              onClick={() => setDetailsOpen(false)}
              aria-label="Close vehicle details"
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-500"
            >
              <MiniIcon type="close" />
            </button>
          </div>
          <div
            className={`flex items-center justify-between gap-2 px-4 py-2 text-xs ${freshnessStyles[selected.freshness].className}`}
          >
            <span className="flex items-center gap-1 font-bold">
              <i
                className={`size-2 rounded-full ${freshnessStyles[selected.freshness].dot}`}
              />
              {selected.freshness} telemetry
            </span>
            <strong>{selected.age}</strong>
          </div>
          {selected.position ? (
            <>
              <div className="m-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-blue-600">
                  <MiniIcon type="target" />
                </span>
                <div>
                  <span className="block text-xs text-slate-400">
                    Last-known position
                  </span>
                  <strong className="block text-xs text-slate-600">
                    {selected.position[0].toFixed(4)}° N,{" "}
                    {selected.position[1].toFixed(4)}° E
                  </strong>
                </div>
              </div>
              <dl className="m-0 grid grid-cols-2 gap-4 border-b border-slate-200 px-4 pb-4 text-xs">
                {[
                  ["Last update", `${selected.updated} WAT`],
                  ["State", selected.state],
                  ["Speed", `${selected.speed} km/h`],
                  ["Heading", selected.heading],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="mb-1 text-slate-400">{label}</dt>
                    <dd className="m-0 font-semibold text-slate-600">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <div className="m-4 rounded-lg border border-slate-200 bg-slate-100 p-4 text-center text-slate-500">
              <div className="flex justify-center">
                <MiniIcon type="alert" />
              </div>
              <strong className="mt-2 block text-xs text-slate-600">
                Position unavailable
              </strong>
              <p className="m-0 mt-1 text-xs leading-normal">
                No telemetry has been received. The map does not display a
                guessed location.
              </p>
            </div>
          )}
          <section className="border-b border-slate-200 p-4 text-xs">
            <h3 className="m-0 mb-3 text-sm font-bold text-slate-700">
              Active delivery
            </h3>
            <dl className="m-0 space-y-2">
              {[
                ["Destination", selected.destination],
                ["Geopolitical zone", selected.zone],
                ["Scheduled deadline", `${selected.deadline} WAT`],
                ["Predicted arrival", `${selected.eta} WAT`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-slate-400">{label}</dt>
                  <dd
                    className={`m-0 text-right font-semibold ${label === "Predicted arrival" && selected.risk === "At risk" ? "text-red-600" : "text-slate-600"}`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <div
            className={`m-4 flex gap-2 rounded-lg p-3 text-xs ${selected.risk === "At risk" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            <MiniIcon type={selected.risk === "At risk" ? "alert" : "route"} />
            <div>
              <strong className="block">{selected.risk}</strong>
              <span className="mt-1 block">
                {selected.risk === "At risk"
                  ? "Prediction exceeds the scheduled deadline"
                  : "Predicted to arrive before the deadline"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-4">
            <button
              onClick={() => navigate(buildRoute(ROUTES.DELIVERIES))}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 flex-1 rounded-md border border-blue-600 bg-blue-600 px-2 py-2 text-xs font-bold text-white"
            >
              View delivery record
            </button>
            <button
              onClick={() => navigate(buildRoute(ROUTES.DELIVERIES))}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-600"
            >
              <MiniIcon type="route" />
              Journey events
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
