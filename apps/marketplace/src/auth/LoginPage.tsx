// apps/marketplace/src/auth/LoginPage.tsx
// Login page matching Portal design with BreederHQ branding.
// Uses API endpoint: POST /api/v1/auth/login
// Post-auth verification: calls GET /api/v1/marketplace/me to confirm session
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { joinApi, safeReadJson } from "../api/client";

// BreederHQ logo - same asset used by portal
import logoUrl from "@bhq/ui/assets/logo.png";

/**
 * Safely decode and validate returnTo parameter.
 * Only allows paths starting with "/" (prevents open redirect).
 */
function getSafeReturnTo(searchParams: URLSearchParams): string {
  const returnTo = searchParams.get("returnTo");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return "/";
}

/**
 * Determine if user is authenticated from /me response body.
 * Backend returns userId if authenticated.
 */
function isAuthenticated(body: any): boolean {
  if (!body) return false;
  if (body.userId != null) return true;
  if (body.authenticated === true || body.authenticated === "true") return true;
  if (body.user != null) return true;
  if (body.session != null) return true;
  return false;
}

/**
 * Login page matching Portal design.
 * Shows BreederHQ branding, then card with email/password form.
 */
export function LoginPage() {
  const [searchParams] = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const formValid = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    setError(null);
    setLoading(true);

    try {
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (xsrf) {
        headers["x-csrf-token"] = decodeURIComponent(xsrf);
      }

      // Step 1: Login
      const loginRes = await fetch(joinApi("/api/v1/auth/login"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginRes.ok) {
        setError("We couldn't sign you in with that email and password.");
        setLoading(false);
        return;
      }

      setError(null);

      // Step 2: Post-auth verification - confirm session is valid
      const meRes = await fetch(joinApi("/api/v1/marketplace/me"), {
        method: "GET",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!meRes.ok) {
        window.location.assign("/");
        return;
      }

      const meData = await safeReadJson(meRes);

      if (!meData) {
        window.location.assign("/");
        return;
      }

      const authenticated = isAuthenticated(meData);

      if (authenticated) {
        window.location.assign(returnTo);
      } else {
        window.location.assign("/");
      }
    } catch {
      setError("We couldn't sign you in with that email and password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-portal-bg">
      <div className="w-full max-w-[420px]">
        {/* BreederHQ branding - matches Portal */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <img
            src={logoUrl}
            alt="BreederHQ"
            className="w-16 h-16 object-contain"
          />
          <h1 className="text-xl font-semibold text-white text-center">
            BreederHQ
          </h1>
          <h2 className="text-base font-medium text-text-secondary text-center">
            Marketplace
          </h2>
          <p className="text-sm text-text-tertiary text-center max-w-[300px]">
            Browse animals, connect with breeders, and find services.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-portal-xs bg-red-500/10 border-l-[3px] border-red-500 text-red-300 text-sm"
              >
                {error}
              </div>
            )}

            <label className="block">
              <span className="block text-sm text-text-secondary mb-1">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
                aria-label="Email address"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-text-secondary mb-1">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                placeholder="Your password"
                autoComplete="current-password"
                required
                disabled={loading}
                aria-label="Password"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full h-10 rounded-portal-xs bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 border border-accent"
              aria-busy={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <a
              href="/auth/forgot-password"
              className="text-sm text-text-secondary text-center hover:text-accent transition-colors"
            >
              Forgot password
            </a>

            <div className="text-center text-sm pt-2 border-t border-border-subtle mt-2">
              <span className="text-text-tertiary">Don't have an account? </span>
              <a
                href={`/auth/register?returnTo=${encodeURIComponent(returnTo)}`}
                className="text-accent hover:text-accent-hover transition-colors font-medium"
              >
                Create one
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
