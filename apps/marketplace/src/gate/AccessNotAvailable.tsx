// apps/marketplace/src/gate/AccessNotAvailable.tsx
import * as React from "react";
import { joinApi } from "../api/client";

// Inline styles matching @bhq/ui LoginPage for consistent auth-card styling
const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const styles = {
  container: {
    minHeight: "calc(100vh - 3.5rem)", // Account for top bar height
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
    textAlign: "center",
  } as React.CSSProperties,
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
  } as React.CSSProperties,
  body: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    marginBottom: "1.5rem",
  } as React.CSSProperties,
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  } as React.CSSProperties,
  primaryButton: {
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
  primaryButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  } as React.CSSProperties,
  secondaryLink: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    textDecoration: "none",
    textAlign: "center",
  } as React.CSSProperties,
};

/**
 * Shown when user is authenticated but not entitled to access marketplace.
 * Styled like portal auth cards - centered card with title, body, and actions.
 */
export function AccessNotAvailable() {
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      await fetch(joinApi("/api/v1/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
      });
    } catch {
      // Ignore logout errors
    } finally {
      window.location.assign("/auth/login");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Marketplace access not available</h1>
        <p style={styles.body}>
          This account is signed in, but Marketplace access is not enabled.
        </p>
        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              ...styles.primaryButton,
              ...(loggingOut ? styles.primaryButtonDisabled : {}),
            }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
          <a
            href="/auth/login"
            style={styles.secondaryLink}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "hsl(var(--brand-orange))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsl(var(--secondary))";
            }}
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
