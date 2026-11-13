import { ROUTES, buildRoute } from "../../routes";
import { ArrowLeft, ShieldX } from "lucide-react";
import { useNavigate } from "react-router";

export function AccessDenied() {
  const navigate = useNavigate();
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
          <ShieldX className="size-6" />
        </span>
        <h1 className="mt-4 mb-1 text-xl font-semibold tracking-tight text-slate-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your role does not permit access to this workspace. Backend permission
          enforcement remains authoritative when connected.
        </p>
        <button
          onClick={() =>
            navigate(buildRoute(ROUTES.DASHBOARD), { replace: true })
          }
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft className="size-4" /> Return to overview
        </button>
      </section>
    </main>
  );
}
