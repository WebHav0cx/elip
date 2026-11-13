import { LogOut, Route, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useData } from "../../data";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useModalFocus } from "../../hooks/useModalFocus";
import { usePermissions } from "../../hooks/usePermissions";
import { ROUTES, buildRoute } from "../../routes";
import {
  applicationNavigation,
  managementNavigation,
  workspaceNavigation,
} from "./navigation";

type SidebarProps = { open: boolean; alertCount: number; onClose(): void };
export function Sidebar({ open, alertCount, onClose }: SidebarProps) {
  const panel = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { canAccess } = usePermissions();
  const { logout } = useAuth();
  const { currentUser, deliveries } = useData();
  useModalFocus(open, panel, onClose);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [onClose]);
  function navigation(items: typeof applicationNavigation) {
    return items
      .filter((item) => canAccess(item.path))
      .map((item) => {
        const Icon = item.icon;
        const active = pathname === item.path;
        const count =
          item.path === ROUTES.DELIVERIES
            ? deliveries.length
            : item.path === ROUTES.INTELLIGENCE
              ? alertCount
              : undefined;
        return (
          <button
            key={item.path}
            type="button"
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            onClick={() => {
              navigate(buildRoute(item.path));
              onClose();
            }}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {count !== undefined && (
              <span className="min-w-6 rounded-full bg-white/10 px-1.5 py-0.5 text-center text-xs font-semibold text-slate-300">
                {count}
              </span>
            )}
          </button>
        );
      });
  }
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 fixed inset-0 z-25 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        id="primary-navigation"
        ref={panel}
        aria-label="Primary navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        className={`fixed inset-y-0 left-0 z-30 flex w-62 flex-col overflow-hidden bg-slate-900 px-3.5 pb-6 pt-6 text-slate-200 transition-transform duration-200 lg:visible lg:translate-x-0 lg:pb-4 ${open ? "visible translate-x-0 shadow-xl" : "invisible -translate-x-full"}`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <div className="flex min-h-12 items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
              <Route size={23} aria-hidden="true" />
            </span>
            <div>
              <strong className="block text-sm font-bold tracking-widest text-white">
                LOGISTICS
              </strong>
              <span className="mt-1 block text-xs tracking-wider text-slate-400">
                COMMAND CENTRE
              </span>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 ml-auto grid size-11 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Workspace" className="mt-8">
            <p className="px-3 pb-2.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              Workspace
            </p>
            {navigation(workspaceNavigation)}
          </nav>
          <nav aria-label="Manage" className="mt-6">
            <p className="px-3 pb-2.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              Manage
            </p>
            {navigation(managementNavigation)}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 border-t border-white/10 px-1.5 pb-0.5 pt-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-900 text-xs font-bold text-blue-100">
            {currentUser.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs text-slate-100">
              {currentUser.name}
            </strong>
            <span className="mt-1 block truncate text-xs text-slate-400">
              {currentUser.role}
            </span>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 grid size-11 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-blue-400"
            onClick={logout}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
}
