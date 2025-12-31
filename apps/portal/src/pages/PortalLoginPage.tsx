// apps/portal/src/pages/PortalLoginPage.tsx
// Login page for the Client Portal. Handles authentication and returnUrl redirect.

import * as React from "react";

export default function PortalLoginPage() {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  // Get returnUrl from query params
  const returnUrl = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("returnUrl");
    // Validate returnUrl is a relative path (security: prevent open redirect)
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "/";
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setWorking(true);

    try {
      const email = emailRef.current?.value?.trim() || "";
      const password = pwRef.current?.value || "";

      // Get CSRF token from cookie if present
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

      const r = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        let msg = "Invalid email or password";
        try {
          const j = await r.json();
          if (j?.message) msg = j.message;
          if (j?.error) msg = j.error;
        } catch {
          // ignore parse errors
        }
        setErr(msg);
        return;
      }

      // Success - redirect to returnUrl or dashboard
      window.location.assign(returnUrl);
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-page text-primary p-4">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-hairline bg-surface p-8 w-full max-w-md"
      >
        {/* Logo/Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[hsl(var(--brand-orange))]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Client Portal</h1>
          <p className="text-sm text-secondary mt-1">Sign in to your account</p>
        </div>

        <label className="block mb-4">
          <span className="text-sm text-secondary">Email</span>
          <input
            ref={emailRef}
            type="email"
            defaultValue=""
            className="mt-1 w-full h-10 px-3 rounded-md bg-card border border-hairline focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={working}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-secondary">Password</span>
          <input
            ref={pwRef}
            type="password"
            defaultValue=""
            className="mt-1 w-full h-10 px-3 rounded-md bg-card border border-hairline focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
            autoComplete="current-password"
            placeholder="Your password"
            required
            disabled={working}
          />
        </label>

        {err && (
          <div className="text-sm text-red-400 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={working}
          className="h-10 px-4 rounded-md bg-[hsl(var(--brand-orange))] text-black font-medium w-full hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {working ? "Signing in..." : "Sign in"}
        </button>

        {/* Help text */}
        <p className="text-xs text-secondary text-center mt-6">
          Don't have an account? Contact your breeder for an invitation.
        </p>
      </form>
    </div>
  );
}
