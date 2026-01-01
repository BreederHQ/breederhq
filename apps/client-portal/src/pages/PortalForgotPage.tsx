// apps/client-portal/src/pages/PortalForgotPage.tsx
// Forgot password page for the standalone Client Portal.
// Uses existing /api/v1/auth/forgot-password endpoint.
// Always shows neutral success message to prevent email enumeration.

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
    lineHeight: 1.5,
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
  success: {
    fontSize: "0.875rem",
    color: "#4ade80",
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: "0.375rem",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    lineHeight: 1.5,
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
};

export default function PortalForgotPage() {
  const { basePath, navigate } = useOrg();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [working, setWorking] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setWorking(true);

    try {
      const email = emailRef.current?.value?.trim() || "";

      if (!email) {
        setError("Please enter your email address.");
        setWorking(false);
        return;
      }

      // Get CSRF token from cookie
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

      // Call forgot password endpoint
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email }),
      });

      // Always show success to prevent email enumeration
      // The backend already handles this, but we enforce it here too
      if (res.ok || res.status === 400) {
        setSuccess(true);
      } else if (res.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        // Still show success to prevent enumeration
        setSuccess(true);
      }
    } catch (err) {
      console.error("[PortalForgotPage] Request failed:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setWorking(false);
    }
  }

  function handleBackClick(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/login");
  }

  return (
    <div className="auth-page" style={styles.page}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h1 style={styles.heading}>Reset Password</h1>
        <p style={styles.subtitle}>
          Enter your email address and we will send you instructions to reset your password.
        </p>

        {success ? (
          <>
            <div style={styles.success}>
              If an account exists with that email address, you will receive password reset instructions shortly.
            </div>
            <a
              href={`${basePath}/login`}
              onClick={handleBackClick}
              style={styles.link}
            >
              Return to sign in
            </a>
          </>
        ) : (
          <>
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

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={working}
              style={{
                ...styles.button,
                ...(working ? styles.buttonDisabled : {}),
              }}
            >
              {working ? "Sending..." : "Send Reset Instructions"}
            </button>

            <a
              href={`${basePath}/login`}
              onClick={handleBackClick}
              style={styles.link}
            >
              Back to sign in
            </a>
          </>
        )}
      </form>
    </div>
  );
}
