// apps/marketplace/src/auth/RegisterPage.tsx
// Real registration page matching @bhq/ui LoginPage styling.
// Uses same API endpoint: POST /api/v1/auth/register
// Post-auth verification: calls GET /api/v1/marketplace/me to confirm session
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { joinApi, safeReadJson } from "../api/client";

// Inline styles matching @bhq/ui LoginPage for consistent rendering
const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    backgroundColor: "hsl(var(--page))",
    color: "hsl(var(--primary))",
    fontFamily: fontStack,
    padding: "1rem",
  } as React.CSSProperties,
  card: {
    borderRadius: "0.75rem",
    border: "1px solid hsl(var(--hairline))",
    backgroundColor: "hsl(var(--surface))",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "28rem",
    boxSizing: "border-box",
  } as React.CSSProperties,
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    marginBottom: "1.25rem",
  } as React.CSSProperties,
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  } as React.CSSProperties,
  label: {
    display: "block",
  } as React.CSSProperties,
  labelText: {
    display: "block",
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    marginBottom: "0.25rem",
  } as React.CSSProperties,
  input: {
    width: "100%",
    height: "2.5rem",
    padding: "0 0.75rem",
    borderRadius: "0.375rem",
    backgroundColor: "hsl(var(--surface-2))",
    border: "1px solid hsl(var(--hairline))",
    color: "inherit",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "1rem",
  } as React.CSSProperties,
  error: {
    padding: "0.75rem",
    borderRadius: "0.375rem",
    backgroundColor: "hsl(0 70% 50% / 0.1)",
    borderLeft: "3px solid hsl(0 70% 50%)",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  button: {
    height: "2.5rem",
    padding: "0 1rem",
    borderRadius: "0.375rem",
    backgroundColor: "hsl(var(--brand-orange))",
    color: "black",
    width: "100%",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "1rem",
    marginTop: "0.5rem",
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as React.CSSProperties,
  linkRow: {
    marginTop: "1rem",
    textAlign: "center",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  link: {
    color: "hsl(var(--secondary))",
    textDecoration: "none",
  } as React.CSSProperties,
  note: {
    marginTop: "1rem",
    fontSize: "0.75rem",
    color: "hsl(var(--secondary))",
    textAlign: "center",
  } as React.CSSProperties,
};

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
  if (json?.error === "email_and_password_required") return "Email and password are required.";
  if (json?.error === "password_too_short") return "Password must be at least 8 characters.";
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
  // Backend returns userId if authenticated
  if (body.userId != null) return true;
  // Fallback for tolerant parsing
  if (body.authenticated === true || body.authenticated === "true") return true;
  if (body.user != null) return true;
  if (body.session != null) return true;
  return false;
}

/**
 * Real registration page with form submission.
 * After successful registration, verifies session via /marketplace/me before navigating.
 * On any login success (200), always navigates away - never leaves user stuck.
 */
export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const formValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8;

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

      // Step 1: Register
      const registerRes = await fetch(joinApi("/api/v1/auth/register"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
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

      // Registration succeeded - clear any error
      setError(null);

      // Step 2: Auto-login after successful registration
      const loginRes = await fetch(joinApi("/api/v1/auth/login"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginRes.ok) {
        // Registration succeeded but login failed
        // Redirect to login page
        window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      // Login succeeded - clear any error
      setError(null);

      // Step 3: Post-auth verification - confirm session is valid
      // Even if this fails, we navigate away because login succeeded
      const meRes = await fetch(joinApi("/api/v1/marketplace/me"), {
        method: "GET",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });

      // If verification fails (non-2xx), still navigate to "/" - Gate will handle
      if (!meRes.ok) {
        window.location.assign("/");
        return;
      }

      // Parse response defensively
      const meData = await safeReadJson(meRes);

      // If we couldn't parse JSON, navigate anyway - Gate will handle
      if (!meData) {
        window.location.assign("/");
        return;
      }

      // Determine auth state tolerantly
      const authenticated = isAuthenticated(meData);

      // Always navigate away - login succeeded
      if (authenticated) {
        // Navigate to returnTo or "/" - Gate will check entitlement
        window.location.assign(returnTo);
      } else {
        // Edge case: login returned 200 but /me says not authenticated
        // Still navigate to "/" - Gate will show auth selector if needed
        window.location.assign("/");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Create Account</h1>
        <p style={styles.subtitle}>Create an account to browse programs and listings.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div role="alert" aria-live="polite" style={styles.error}>
              {error}
            </div>
          )}

          <label style={styles.label}>
            <span style={styles.labelText}>First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={styles.input}
              placeholder="First name"
              autoComplete="given-name"
              required
              disabled={loading}
              aria-label="First name"
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={styles.input}
              placeholder="Last name"
              autoComplete="family-name"
              required
              disabled={loading}
              aria-label="Last name"
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
              aria-label="Email address"
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
              aria-label="Password"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !formValid}
            style={{
              ...styles.button,
              ...(loading || !formValid ? styles.buttonDisabled : {}),
            }}
            aria-busy={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <div style={styles.linkRow}>
            <a
              href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
              style={styles.link}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "hsl(var(--brand-orange))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "hsl(var(--secondary))";
              }}
            >
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
