export type MapPoint = [latitude: number, longitude: number];
export type RoadRoute = { path: MapPoint[]; distance: number };

const cache = new Map<string, RoadRoute>();
const endpoint = (
  import.meta.env.VITE_ROUTING_SERVICE_URL || "https://router.project-osrm.org/route/v1/driving"
).replace(/\/$/, "");

/** Road geometry is a route estimate, separate from recorded vehicle telemetry. */
export async function getRoadRoute(points: MapPoint[], signal: AbortSignal): Promise<RoadRoute> {
  const coordinates = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const cached = cache.get(coordinates);
  if (cached) return cached;
  const response = await fetch(`${endpoint}/${coordinates}?overview=full&geometries=geojson`, {
    signal,
  });
  if (!response.ok) throw new Error("Road route unavailable");
  const data: unknown = await response.json();
  const result = data as {
    code?: string;
    routes?: { distance?: number; geometry?: { type?: string; coordinates?: unknown[] } }[];
  };
  const route = result.routes?.[0];
  const positions = route?.geometry?.coordinates;
  if (
    result.code !== "Ok" ||
    route?.geometry?.type !== "LineString" ||
    !Array.isArray(positions) ||
    positions.length < 2 ||
    !positions.every(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]) &&
        Math.abs(point[0]) <= 180 &&
        Math.abs(point[1]) <= 90,
    ) ||
    typeof route.distance !== "number" ||
    !Number.isFinite(route.distance) ||
    route.distance < 0
  ) {
    throw new Error("Road route unavailable");
  }
  const path = positions.map((point) => {
    const [lng, lat] = point as [number, number];
    return [lat, lng] as MapPoint;
  });
  const roadRoute = { path, distance: route.distance };
  cache.set(coordinates, roadRoute);
  return roadRoute;
}
