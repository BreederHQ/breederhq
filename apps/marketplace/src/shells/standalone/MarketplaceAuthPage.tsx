// apps/marketplace/src/shells/standalone/MarketplaceAuthPage.tsx
// Auth landing page for marketplace access. Matches @bhq/ui LoginPage styling.
import * as React from "react";

interface Props {
  /** The path the user was trying to access, computed by MarketplaceGate */
  returnToPath: string;
}

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
    marginBottom: "1.5rem",
  } as React.CSSProperties,
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  } as React.CSSProperties,
  primaryButton: {
    display: "block",
    height: "2.5rem",
    lineHeight: "2.5rem",
    padding: "0 1rem",
    borderRadius: "0.375rem",
    backgroundColor: "hsl(var(--brand-orange))",
    color: "black",
    width: "100%",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "1rem",
    textAlign: "center",
    textDecoration: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
  secondaryButton: {
    display: "block",
    height: "2.5rem",
    lineHeight: "2.375rem", // Accounting for border
    padding: "0 1rem",
    borderRadius: "0.375rem",
    backgroundColor: "hsl(var(--surface-2))",
    color: "hsl(var(--primary))",
    width: "100%",
    border: "1px solid hsl(var(--hairline))",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "1rem",
    textAlign: "center",
    textDecoration: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
};

/**
 * Auth landing page shown when user is not authenticated.
 * Provides links to login/register with returnTo preserved.
 */
export function MarketplaceAuthPage({ returnToPath }: Props) {
  const encodedReturnTo = encodeURIComponent(returnToPath);

  const signInUrl = `/auth/login?returnTo=${encodedReturnTo}`;
  const createAccountUrl = `/auth/register?returnTo=${encodedReturnTo}`;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Sign in to Marketplace</h1>
        <p style={styles.subtitle}>Access breeder programs and listings</p>

        <div style={styles.buttonContainer}>
          <a href={signInUrl} style={styles.primaryButton}>
            Sign in
          </a>
          <a href={createAccountUrl} style={styles.secondaryButton}>
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}
