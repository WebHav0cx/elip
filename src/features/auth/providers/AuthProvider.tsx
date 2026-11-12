import { createContext, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import type { AuthUser, LoginCredentials, LoginResult } from "../types/auth.types";

type AuthContextValue = {
  user: AuthUser | null;
  login(credentials: LoginCredentials): Promise<LoginResult>;
  logout(): void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.restore());
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(credentials) {
        const result = await authService.login(credentials);
        if (result.ok) setUser(result.user);
        return result;
      },
      logout() {
        authService.logout();
        setUser(null);
      },
    }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
