import {
  Boxes,
  Clock3,
  LayoutDashboard,
  Map,
  Route,
  Settings,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { ROUTES } from "../../routes";
export const workspaceNavigation = [
  { label: "Overview", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Operations", path: ROUTES.OPERATIONS, icon: Boxes },
  { label: "Deliveries", path: ROUTES.DELIVERIES, icon: Truck },
  { label: "Vehicles & Resources", path: ROUTES.RESOURCES, icon: Truck },
  { label: "Movement Map", path: ROUTES.MOVEMENT_MAP, icon: Map },
  { label: "Intelligence", path: ROUTES.INTELLIGENCE, icon: Sparkles },
  { label: "Scenarios", path: ROUTES.SCENARIOS, icon: Route },
  { label: "Performance Analytics", path: ROUTES.ANALYTICS, icon: TrendingUp },
];
export const managementNavigation = [
  { label: "Team Access", path: ROUTES.TEAM, icon: Users },
  { label: "Audit History", path: ROUTES.AUDIT, icon: Clock3 },
  { label: "Settings", path: ROUTES.SETTINGS, icon: Settings },
];
export const applicationNavigation = [
  ...workspaceNavigation,
  ...managementNavigation,
];
