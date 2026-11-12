import type { AuthUser, LoginCredentials, LoginResult } from "../types/auth.types";
import type { UserRole } from "../../../types/user.types";

const DEMO_PASSWORD = "Demo123!";
const SESSION_KEY = "elip-demo-session";
const DISABLED_KEY = "elip-disabled-accounts";
const ROLE_OVERRIDES_KEY = "elip-role-overrides";

export const authApiContracts = {
  login: "/api/v1/auth/login",
  refresh: "/api/v1/auth/refresh",
  currentUser: "/api/v1/users/me",
} as const;

export const demoAccounts: AuthUser[] = [
  {
    id: "USR-001",
    name: "Alex Morgan",
    email: "alex.morgan@elip.demo",
    role: "Administrator",
    status: "ACTIVE",
  },
  {
    id: "USR-002",
    name: "Maya Chen",
    email: "maya.chen@elip.demo",
    role: "Operations Coordinator",
    status: "ACTIVE",
  },
  {
    id: "USR-003",
    name: "Sam Okafor",
    email: "sam.okafor@elip.demo",
    role: "Monitoring Analyst",
    status: "ACTIVE",
  },
  {
    id: "USR-004",
    name: "Amara Bello",
    email: "amara.bello@elip.demo",
    role: "Planning Analyst",
    status: "ACTIVE",
  },
  {
    id: "USR-005",
    name: "Jordan Lee",
    email: "jordan.lee@elip.demo",
    role: "Monitoring Analyst",
    status: "INACTIVE",
  },
];

function disabledAccounts() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(DISABLED_KEY) ?? "[]"));
  } catch {
    return new Set<string>();
  }
}

function roleOverrides(): Record<string, UserRole> {
  try {
    return JSON.parse(localStorage.getItem(ROLE_OVERRIDES_KEY) ?? "{}") as Record<string, UserRole>;
  } catch {
    return {};
  }
}

export const authService = {
  mode: "MOCK_DATA" as const,
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const account = demoAccounts.find(
      (item) => item.email.toLowerCase() === credentials.email.trim().toLowerCase(),
    );
    if (!account || credentials.password !== DEMO_PASSWORD) {
      return { ok: false, message: "The email or password is incorrect." };
    }
    if (account.status === "INACTIVE" || disabledAccounts().has(account.email.toLowerCase())) {
      return { ok: false, message: "This account is inactive. Contact an administrator." };
    }
    const user = {
      ...account,
      role: roleOverrides()[account.email.toLowerCase()] ?? account.role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { ok: true, user };
  },
  restore(): AuthUser | null {
    try {
      const user = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AuthUser | null;
      if (!user || disabledAccounts().has(user.email.toLowerCase())) return null;
      return user;
    } catch {
      return null;
    }
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
  setAccountActive(email: string, active: boolean) {
    const disabled = disabledAccounts();
    if (active) disabled.delete(email.toLowerCase());
    else disabled.add(email.toLowerCase());
    localStorage.setItem(DISABLED_KEY, JSON.stringify([...disabled]));
  },
  setAccountRole(email: string, role: UserRole) {
    const overrides = roleOverrides();
    overrides[email.toLowerCase()] = role;
    localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(overrides));
  },
};
