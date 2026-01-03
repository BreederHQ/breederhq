// apps/marketplace/src/auth/AuthPage.tsx
// Auth page for marketplace - matches Portal login design with BreederHQ branding.
import * as React from "react";
import { joinApi, safeReadJson } from "../api/client";

// BreederHQ logo - same asset used by portal
import logoUrl from "@bhq/ui/assets/logo.png";

interface Props {
  /** The path the user was trying to access, computed by MarketplaceGate */
  returnToPath: string;
}

/**
 * Determine if user is authenticated from /me response body.
 */
function isAuthenticated(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const obj = body as Record<string, unknown>;
  if (obj.userId != null) return true;
  if (obj.authenticated === true || obj.authenticated === "true") return true;
  if (obj.user != null) return true;
  if (obj.session != null) return true;
  return false;
}

/**
 * Auth page matching Portal login design.
 * Shows BreederHQ branding with login form directly (no intermediate choice page).
 */
export function AuthPage({ returnToPath }: Props) {
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
        window.location.assign(returnToPath);
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
                href={`/auth/register?returnTo=${encodeURIComponent(returnToPath)}`}
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
