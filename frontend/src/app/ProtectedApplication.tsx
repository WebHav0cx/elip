import { Navigate, useLocation } from "react-router";
import LegacyDashboard from "../App";
import { AccessDenied } from "../components/common/AccessDenied";
import { canAccessRoute } from "../config/permissions";
import { useAuth } from "../features/auth/hooks/useAuth";
import { ROUTES, buildRoute } from "../routes";

export function ProtectedApplication() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to={buildRoute(ROUTES.LOGIN)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (!canAccessRoute(user.role, location.pathname)) return <AccessDenied />;
  return <LegacyDashboard />;
}
