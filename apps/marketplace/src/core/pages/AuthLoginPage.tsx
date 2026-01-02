// apps/marketplace/src/core/pages/AuthLoginPage.tsx
// Real login page matching Client Portal auth UX.
// Uses same API endpoint: POST /api/v1/auth/login
import * as React from "react";
import { useSearchParams } from "react-router-dom";

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
    color: "hsl(var(--primary))",
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
 * Real login page with form submission.
 * Matches portal UX and uses same API endpoint.
 */
export function AuthLoginPage() {
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
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        setError("We couldn't sign you in with that email and password.");
        setLoading(false);
        return;
      }

      // Success - navigate to returnTo, let MarketplaceGate handle entitlement
      window.location.assign(returnTo);
    } catch {
      setError("We couldn't sign you in with that email and password.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Sign In</h1>
        <p style={styles.subtitle}>Sign in to access the Marketplace</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div role="alert" aria-live="polite" style={styles.error}>
              {error}
            </div>
          )}

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
            style={{
              ...styles.button,
              ...(loading || !formValid ? styles.buttonDisabled : {}),
            }}
            aria-busy={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={styles.linkRow}>
            <a
              href={`/auth/register?returnTo=${encodeURIComponent(returnTo)}`}
              style={styles.link}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "hsl(var(--brand-orange))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "hsl(var(--secondary))";
              }}
            >
              Don't have an account? Create one
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
