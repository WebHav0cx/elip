import { generatePath, type PathParam } from "react-router";

/** Application URL patterns. API endpoint contracts stay with their services. */
export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  OPERATIONS: "/operations",
  DELIVERIES: "/deliveries",
  RESOURCES: "/resources",
  MOVEMENT_MAP: "/map",
  INTELLIGENCE: "/intelligence",
  SCENARIOS: "/scenarios",
  ANALYTICS: "/analytics",
  TEAM: "/team",
  AUDIT: "/audit",
  SETTINGS: "/settings",
} as const;

export type RouteName = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteName];
export type WorkspacePath = (typeof ROUTES)[Exclude<RouteName, "ROOT" | "LOGIN">];

type RouteParams<Path extends string> = Pick<
  NonNullable<Parameters<typeof generatePath<Path>>[1]>,
  PathParam<Path>
>;

type PathArguments<Path extends string> = [PathParam<Path>] extends [never]
  ? []
  : Record<never, never> extends RouteParams<Path>
    ? [params?: RouteParams<Path>]
    : [params: RouteParams<Path>];

type BuiltPath<Path extends string> = [PathParam<Path>] extends [never] ? Path : string;

/** Build registered URLs; parameter names are inferred from their route patterns. */
export function buildRoute<Path extends RoutePath>(
  pattern: Path,
  ...[params]: PathArguments<Path>
): BuiltPath<Path> {
  return generatePath<string>(pattern, params) as BuiltPath<Path>;
}

export function movementMapPath({
  deliveryId,
  vehicleId,
}: { deliveryId?: string; vehicleId?: string } = {}): string {
  const search = new URLSearchParams();
  if (deliveryId) search.set("delivery", deliveryId);
  if (vehicleId) search.set("vehicle", vehicleId);
  const query = search.toString();
  return `${buildRoute(ROUTES.MOVEMENT_MAP)}${query ? `?${query}` : ""}`;
}
