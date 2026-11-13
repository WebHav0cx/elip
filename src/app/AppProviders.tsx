import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { DataProvider } from "../data";
import { AuthProvider } from "../features/auth/providers/AuthProvider";

export function AppProviders({ children }: { children?: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>{children ?? <Outlet />}</DataProvider>
    </AuthProvider>
  );
}
