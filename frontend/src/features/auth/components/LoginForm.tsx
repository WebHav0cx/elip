import { ROUTES, buildRoute } from "../../../routes";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { demoAccounts } from "../services/authService";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(buildRoute(ROUTES.DASHBOARD), { replace: true });
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Email address
        </span>
        <span className="mt-2 flex h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-500">
          <Mail className="size-4 text-slate-400" aria-hidden="true" />
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none sm:text-sm"
          />
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <span className="mt-2 flex h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-500">
          <LockKeyhole className="size-4 text-slate-400" aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 max-w-full max-lg:text-base max-lg:min-h-11 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 grid size-11 shrink-0 place-items-center text-slate-500 hover:text-slate-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </span>
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
      >
        {loading && <LoaderCircle className="size-4 animate-spin" />}
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Demo accounts
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Password for active accounts: Demo123!
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {demoAccounts.slice(0, 4).map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("Demo123!");
                setError("");
              }}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer max-lg:min-h-11 max-lg:min-w-11 rounded-md border border-slate-200 bg-white p-2 text-left hover:border-blue-300 hover:bg-blue-50"
            >
              <strong className="block text-xs text-slate-800">
                {account.role}
              </strong>
              <span className="mt-1 block truncate text-xs text-slate-500">
                {account.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
