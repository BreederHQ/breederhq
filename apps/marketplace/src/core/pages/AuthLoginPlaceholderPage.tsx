// apps/marketplace/src/core/pages/AuthLoginPlaceholderPage.tsx
// Placeholder login page with consistent auth styling.
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
    marginBottom: "1.5rem",
  } as React.CSSProperties,
  backLink: {
    display: "inline-block",
    fontSize: "0.875rem",
    color: "hsl(var(--brand-orange))",
    textDecoration: "none",
  } as React.CSSProperties,
};

/**
 * Placeholder login page. Shows heading and back link.
 * No real authentication implemented in this phase.
 */
export function AuthLoginPlaceholderPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Login</h1>
        <a href={returnTo} style={styles.backLink}>
          Back to Marketplace
        </a>
      </div>
    </div>
  );
}
