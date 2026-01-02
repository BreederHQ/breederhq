// apps/marketplace/src/auth/LoginPage.tsx
// Real login page with Tailwind styling.
// Uses API endpoint: POST /api/v1/auth/login
// Post-auth verification: calls GET /api/v1/marketplace/me to confirm session
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { joinApi, safeReadJson } from "../api/client";

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
 * Real login page with form submission.
 * After successful login, verifies session via /marketplace/me before navigating.
 * On any login success (200), always navigates away - never leaves user stuck.
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
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-gradient-to-b from-gray-900 to-black">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Sign In</h1>
          <p className="text-white/60 text-sm mb-6">
            Sign in to access the Marketplace
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-lg bg-red-500/10 border-l-2 border-red-500 text-red-300 text-sm"
              >
                {error}
              </div>
            )}

            <label className="block">
              <span className="block text-sm text-white/60 mb-1">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-50"
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
                aria-label="Email address"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-white/60 mb-1">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-50"
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
              className="w-full h-10 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 mt-2"
              aria-busy={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="text-center text-sm pt-2">
              <a
                href={`/auth/register?returnTo=${encodeURIComponent(returnTo)}`}
                className="text-white/50 hover:text-orange-400 transition-colors"
              >
                Don't have an account? Create one
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
