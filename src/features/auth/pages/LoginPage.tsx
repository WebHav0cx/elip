import { Route } from "lucide-react";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <main className={"grid min-h-dvh min-w-0 bg-slate-50 lg:grid-cols-balanced"}>
      <section className={"hidden bg-slate-900 p-12 text-slate-100 lg:flex lg:flex-col lg:justify-between"}>
        <div className={"flex items-center gap-3"}>
          <span className={"grid size-11 place-items-center rounded-lg bg-blue-600"}>
            <Route className={"size-6"} />
          </span>
          <div>
            <strong className={"block text-sm tracking-widest"}>ELIP</strong>
            <span className={"text-xs text-slate-400"}>LOGISTICS COMMAND CENTRE</span>
          </div>
        </div>
        <div className={"max-w-xl"}>
          <p className={"text-sm font-semibold uppercase tracking-widest text-blue-400"}>
            Electoral Logistics Intelligence Platform
          </p>
          <h1 className={"mt-5 text-4xl font-semibold leading-tight"}>
            Shared situational awareness for logistics operations.
          </h1>
          <p className={"mt-5 max-w-lg text-base leading-7 text-slate-400"}>
            Monitor deliveries, review intelligence, coordinate resources and compare planning
            scenarios through role-specific workspaces.
          </p>
        </div>
      </section>
      <section className={"flex min-w-0 items-start justify-center px-4 py-6 sm:p-8 lg:items-center lg:p-10"}>
        <div className={"w-full min-w-0 max-w-md"}>
          <div className={"mb-8 flex items-center gap-3 lg:hidden"}>
            <span className={"grid size-10 place-items-center rounded-lg bg-blue-600 text-white"}>
              <Route className={"size-5"} />
            </span>
            <strong className={"text-sm tracking-widest text-slate-900"}>ELIP</strong>
          </div>
          <p className={"text-sm font-semibold text-blue-600"}>Secure workspace access</p>
          <h2 className={"mt-2 text-3xl font-semibold tracking-tight text-slate-900"}>
            Sign in to ELIP
          </h2>
          <p className={"mt-2 text-sm leading-6 text-slate-500"}>
            Your demonstration account determines the workspace and permissions available to you.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
