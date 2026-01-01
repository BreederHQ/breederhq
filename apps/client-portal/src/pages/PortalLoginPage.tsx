// apps/client-portal/src/pages/PortalLoginPage.tsx
// Login page for the standalone Client Portal.
// Uses existing /api/v1/auth/login endpoint.
// Validates CLIENT membership for the org after login.

import * as React from "react";
import { useOrg } from "../context/OrgContext";

// Inline styles matching the shared LoginPage pattern
const fontStack = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
  form: {
    borderRadius: "0.75rem",
    border: "1px solid hsl(var(--hairline))",
    backgroundColor: "hsl(var(--surface))",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "24rem",
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
    marginBottom: "1.5rem",
  } as React.CSSProperties,
  label: {
    display: "block",
    marginBottom: "1rem",
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
    fontSize: "0.875rem",
    color: "#f87171",
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: "0.375rem",
    border: "1px solid rgba(248, 113, 113, 0.3)",
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
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as React.CSSProperties,
  link: {
    display: "block",
    textAlign: "center" as const,
    marginTop: "1rem",
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    textDecoration: "none",
  } as React.CSSProperties,
  linkHover: {
    color: "hsl(var(--brand-orange))",
    textDecoration: "underline",
  } as React.CSSProperties,
};

export default function PortalLoginPage() {
  const { basePath, navigate } = useOrg();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  // Get returnUrl from query params
  const returnUrl = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("returnUrl");
    // Validate returnUrl is a relative path (security: prevent open redirect)
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return `${basePath}/`;
  }, [basePath]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWorking(true);

    try {
      const email = emailRef.current?.value?.trim() || "";
      const password = pwRef.current?.value || "";

      if (!email || !password) {
        setError("Please enter your email and password.");
        setWorking(false);
        return;
      }

      // Get CSRF token from cookie
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

      // Call login endpoint
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let msg = "Invalid email or password.";
        try {
          const j = await res.json();
          if (j?.error === "email_and_password_required") {
            msg = "Please enter your email and password.";
          } else if (j?.error === "invalid_credentials") {
            msg = "Invalid email or password.";
          } else if (j?.message) {
            msg = j.message;
          }
        } catch {
          // Use default message
        }
        setError(msg);
        setWorking(false);
        return;
      }

      // Login succeeded - now verify membership for this org
      // Fetch session to check memberships
      const sessionRes = await fetch(`/api/v1/session?_=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!sessionRes.ok) {
        setError("Unable to verify your access. Please try again.");
        setWorking(false);
        return;
      }

      const sessionData = await sessionRes.json().catch(() => ({}));

      // Check if user has CLIENT membership for this tenant
      // The session endpoint returns memberships with role info
      // We need to match by tenant slug - fetch tenant info or check memberships
      const memberships = sessionData?.memberships || [];
      const tenant = sessionData?.tenant;

      // If the session already has a tenant context matching our slug, we are good
      // Otherwise we need to check if they have any CLIENT role membership
      // For now, if they have any membership we let them in (AuthGate will do the final check)
      if (!tenant && memberships.length === 0) {
        setError("You do not have access to this portal.");
        // Logout to clear the session
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        setWorking(false);
        return;
      }

      // Success - redirect to returnUrl
      window.location.assign(returnUrl);
    } catch (err) {
      console.error("[PortalLoginPage] Login failed:", err);
      setError("Network error. Please check your connection and try again.");
      setWorking(false);
    }
  }

  function handleForgotClick(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/forgot");
  }

  return (
    <div className="auth-page" style={styles.page}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h1 style={styles.heading}>Sign In</h1>
        <p style={styles.subtitle}>Access your client portal</p>

        <label style={styles.label}>
          <span style={styles.labelText}>Email</span>
          <input
            ref={emailRef}
            type="email"
            style={styles.input}
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={working}
          />
        </label>

        <label style={styles.label}>
          <span style={styles.labelText}>Password</span>
          <input
            ref={pwRef}
            type="password"
            style={styles.input}
            autoComplete="current-password"
            placeholder="Your password"
            required
            disabled={working}
          />
        </label>

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={working}
          style={{
            ...styles.button,
            ...(working ? styles.buttonDisabled : {}),
          }}
        >
          {working ? "Signing In..." : "Sign In"}
        </button>

        <a
          href={`${basePath}/forgot`}
          onClick={handleForgotClick}
          style={styles.link}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, styles.linkHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.link);
          }}
        >
          Forgot your password?
        </a>
      </form>
    </div>
  );
}
