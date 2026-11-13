import { ROUTES, type WorkspacePath } from "../routes";
import type { UserRole } from "../types/user.types";

export type Permission =
  | "manage_users"
  | "view_audit"
  | "manage_operations"
  | "manage_deliveries"
  | "assign_resources"
  | "control_simulation"
  | "monitor"
  | "create_scenarios"
  | "review_scenarios"
  | "view_analytics";

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  Administrator: ["manage_users", "view_audit", "monitor"],
  "Operations Coordinator": [
    "manage_operations",
    "manage_deliveries",
    "assign_resources",
    "control_simulation",
    "monitor",
    "review_scenarios",
    "view_analytics",
  ],
  "Monitoring Analyst": ["monitor", "view_analytics"],
  "Planning Analyst": ["monitor", "create_scenarios", "view_analytics"],
};

const routeRoles: Partial<Record<WorkspacePath, readonly UserRole[]>> = {
  [ROUTES.OPERATIONS]: ["Operations Coordinator"],
  [ROUTES.TEAM]: ["Administrator"],
  [ROUTES.AUDIT]: ["Administrator"],
  [ROUTES.SCENARIOS]: ["Operations Coordinator", "Planning Analyst"],
  [ROUTES.ANALYTICS]: ["Operations Coordinator", "Monitoring Analyst", "Planning Analyst"],
  [ROUTES.RESOURCES]: ["Operations Coordinator", "Planning Analyst"],
  [ROUTES.DELIVERIES]: [
    "Administrator",
    "Operations Coordinator",
    "Monitoring Analyst",
    "Planning Analyst",
  ],
  [ROUTES.MOVEMENT_MAP]: ["Administrator", "Operations Coordinator", "Monitoring Analyst"],
  [ROUTES.INTELLIGENCE]: [
    "Administrator",
    "Operations Coordinator",
    "Monitoring Analyst",
    "Planning Analyst",
  ],
  [ROUTES.SETTINGS]: [
    "Administrator",
    "Operations Coordinator",
    "Monitoring Analyst",
    "Planning Analyst",
  ],
};

export function canAccessRoute(role: UserRole, pathname: string) {
  if (pathname === ROUTES.DASHBOARD) return true;
  const rule = routeRoles[pathname as WorkspacePath];
  return rule ? rule.includes(role) : false;
}
