// apps/marketplace/src/pages/NotEntitledPage.tsx
// Shown when user is authenticated but lacks MARKETPLACE_ACCESS entitlement.
// Simple page with no retry button - user needs to subscribe or be granted access.

import * as React from "react";

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
  card: {
    borderRadius: "0.75rem",
    border: "1px solid hsl(var(--hairline))",
    backgroundColor: "hsl(var(--surface))",
    padding: "2rem",
    width: "100%",
    maxWidth: "28rem",
    boxSizing: "border-box",
    textAlign: "center",
  } as React.CSSProperties,
  icon: {
    width: "3rem",
    height: "3rem",
    margin: "0 auto 1rem",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--brand-orange) / 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  } as React.CSSProperties,
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  } as React.CSSProperties,
  text: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
  } as React.CSSProperties,
  logoutButton: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  } as React.CSSProperties,
};

interface Props {
  onLogout?: () => void;
}

export function NotEntitledPage({ onLogout }: Props) {
  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors
    }
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>
          <span role="img" aria-label="locked">🔒</span>
        </div>
        <h1 style={styles.heading}>Access Not Available</h1>
        <p style={styles.text}>
          Your account does not have access to the Marketplace.
          If you believe this is an error, please contact support.
        </p>
        <button type="button" style={styles.logoutButton} onClick={handleLogout}>
          Sign out and try a different account
        </button>
      </div>
    </div>
  );
}
