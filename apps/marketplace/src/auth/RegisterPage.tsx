// apps/marketplace/src/auth/RegisterPage.tsx
// Registration page matching Portal design with BreederHQ branding.
// Uses API endpoint: POST /api/v1/auth/register
// Post-auth verification: calls GET /api/v1/marketplace/me to confirm session
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { joinApi, safeReadJson } from "../api/client";
import { Seo } from "../seo";
import { createTosAcceptancePayload } from "@bhq/ui";

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
 * Map backend error codes to user-friendly messages.
 */
function mapRegisterError(json: { error?: string; message?: string }): string {
  if (json?.error === "first_name_required") return "First name is required.";
  if (json?.error === "last_name_required") return "Last name is required.";
  if (json?.error === "email_and_password_required")
    return "Email and password are required.";
  if (json?.error === "password_too_short")
    return "Password must be at least 8 characters.";
  if (json?.message) return json.message;
  if (json?.error) return json.error;
  return "Registration failed. Please try again.";
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
 * Real registration page with form submission.
 * After successful registration, verifies session via /marketplace/me before navigating.
 */
export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [tosAccepted, setTosAccepted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const formValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    tosAccepted;

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

      // Step 1: Register (include ToS acceptance)
      const tosPayload = createTosAcceptancePayload("marketplace", "register");
      const registerRes = await fetch(joinApi("/api/v1/auth/register"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          tosAcceptance: tosPayload,
        }),
      });

      if (!registerRes.ok) {
        let msg = "Registration failed. Please try again.";
        try {
          const json = await registerRes.json();
          msg = mapRegisterError(json);
        } catch {
          // ignore parse error
        }
        setError(msg);
        setLoading(false);
        return;
      }

      setError(null);

      // Step 2: Auto-login after successful registration
      const loginRes = await fetch(joinApi("/api/v1/auth/login"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginRes.ok) {
        window.location.assign(
          `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
        );
        return;
      }

      setError(null);

      // Step 3: Post-auth verification
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
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-portal-bg">
      <Seo
        title="Create Account"
        description="Create a BreederHQ Marketplace account to browse animals, connect with breeders, and manage your inquiries."
        path="/auth/register"
        index={true}
      />
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
            Create an account to browse animals and connect with breeders.
          </p>
        </div>

        {/* Registration card */}
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

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">
                  First name
                </span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="First"
                  autoComplete="given-name"
                  required
                  disabled={loading}
                  aria-label="First name"
                />
              </label>

              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">
                  Last name
                </span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="Last"
                  autoComplete="family-name"
                  required
                  disabled={loading}
                  aria-label="Last name"
                />
              </label>
            </div>

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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
                aria-label="Password"
              />
            </label>

            {/* Terms of Service acceptance */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-border-subtle bg-portal-elevated text-accent focus:ring-accent/30 focus:ring-offset-0 cursor-pointer"
                aria-label="Accept Terms of Service"
              />
              <span className="text-sm text-text-secondary">
                I agree to the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover underline"
                >
                  Terms of Service
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full h-10 rounded-portal-xs bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 border border-accent"
              aria-busy={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div className="text-center text-sm pt-2 border-t border-border-subtle mt-2">
              <span className="text-text-tertiary">Already have an account? </span>
              <a
                href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
                className="text-accent hover:text-accent-hover transition-colors font-medium"
              >
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
