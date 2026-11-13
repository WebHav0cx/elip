import L from "leaflet";
import { useEffect, useState } from "react";
import { CircleMarker, Pane, Polyline, Tooltip, useMap } from "react-leaflet";
import { getRoadRoute, type MapPoint, type RoadRoute } from "../services/roadRoute";

type RouteResult = { points: MapPoint[]; route?: RoadRoute; failed?: boolean };

export function JourneyRoute({
  points,
  position,
  visible,
  onFocus,
}: {
  points: MapPoint[];
  position: MapPoint;
  visible: boolean;
  onFocus(): void;
}) {
  const map = useMap();
  const [result, setResult] = useState<RouteResult | null>(null);
  const [view, setView] = useState("overview");
  const [focusRequest, setFocusRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    getRoadRoute(points, controller.signal)
      .then(
        (route) => {
          if (!cancelled) setResult({ points, route });
        },
        () => {
          if (!cancelled) setResult({ points, failed: true });
        },
      )
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [points]);

  const current = result?.points === points ? result : null;
  const path = current?.route?.path ?? points;
  useEffect(() => {
    const focus = () => {
      map.invalidateSize({ pan: false });
      if (!map.getSize().x || !map.getSize().y) return;
      map.stop();
      if (view === "street") {
        const vehicle = L.latLng(position);
        const nearest = path.reduce(
          (best, point) => (vehicle.distanceTo(point) < vehicle.distanceTo(best) ? point : best),
          path[0],
        );
        map.fitBounds(L.latLngBounds([position, nearest]), {
          padding: [40, 40],
          maxZoom: 15,
          animate: false,
        });
      } else
        map.fitBounds(L.latLngBounds([...path, position]), {
          padding: [40, 40],
          maxZoom: 15,
          animate: false,
        });
    };
    focus();
    const observer = new ResizeObserver(focus);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, path, position, view, focusRequest]);

  return (
    <>
      {visible && (
        <Pane name="selected-journey" className="z-460!">
          <Polyline
            positions={path}
            pathOptions={{ color: "#ffffff", weight: 10, opacity: 1, interactive: false }}
          />
          <Polyline
            positions={path}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 1,
              dashArray: current?.route ? undefined : "8 6",
            }}
          >
            <Tooltip>Selected journey route</Tooltip>
          </Polyline>
          <CircleMarker
            center={path[0]}
            radius={6}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#16a34a", fillOpacity: 1 }}
          >
            <Tooltip>Journey start</Tooltip>
          </CircleMarker>
          <CircleMarker
            center={path[path.length - 1]}
            radius={6}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#dc2626", fillOpacity: 1 }}
          >
            <Tooltip>Last route waypoint</Tooltip>
          </CircleMarker>
        </Pane>
      )}
      <div
        className="absolute! right-3! top-20! z-800! grid! max-w-48! gap-2! rounded-lg! border! border-slate-200! bg-white! p-3! shadow-md!"
        ref={(element) => {
          if (element) {
            L.DomEvent.disableClickPropagation(element);
            L.DomEvent.disableScrollPropagation(element);
          }
        }}
      >
        <p role="status" className="m-0! text-xs! text-slate-600!">
          {current?.route
            ? `Road route · ${(current.route.distance / 1000).toFixed(1)} km`
            : current?.failed
              ? "Road detail unavailable. Showing route waypoints."
              : "Loading road detail…"}
        </p>
        {(["overview", "street"] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            aria-pressed={view === mode}
            className="rounded-md! border! border-slate-200! bg-white! px-2! py-2! text-xs! font-semibold! text-blue-600!"
            onClick={() => {
              setView(mode);
              setFocusRequest((value) => value + 1);
              onFocus();
            }}
          >
            {mode === "overview" ? "Route overview" : "Street detail"}
          </button>
        ))}
      </div>
    </>
  );
}
