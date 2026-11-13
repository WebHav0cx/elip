import { canAccessRoute, rolePermissions, type Permission } from "../config/permissions";
import { useAuth } from "../features/auth/hooks/useAuth";

export function usePermissions() {
  const { user } = useAuth();
  return {
    can(permission: Permission) {
      return user ? rolePermissions[user.role].includes(permission) : false;
    },
    canAccess(pathname: string) {
      return user ? canAccessRoute(user.role, pathname) : false;
    },
  };
}
