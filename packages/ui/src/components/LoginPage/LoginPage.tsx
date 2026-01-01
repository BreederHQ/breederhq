// packages/ui/src/components/LoginPage/LoginPage.tsx
// Shared login UI component used by platform, portal, and marketplace.
// Uses inline styles to ensure consistent rendering across apps with different Tailwind versions.

import * as React from "react";

export interface LoginPageProps {
  /**
   * Called after successful login.
   * Defaults to redirecting to "/" if not provided.
   */
  onSuccess?: () => void;
  /**
   * Optional URL to redirect to after login. Used if onSuccess is not provided.
   * Defaults to "/".
   */
  returnUrl?: string;
  /**
   * Optional subtitle text shown below the heading.
   * E.g., "Client Portal" or "Marketplace"
   */
  subtitle?: string;
}

// Inline styles to avoid dependency on Tailwind class generation in consuming apps
const fontStack = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    backgroundColor: "hsl(var(--page))",
    color: "hsl(var(--primary))",
    fontFamily: fontStack,
  } as React.CSSProperties,
  form: {
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
    marginBottom: "1rem",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
    marginTop: "-0.5rem",
    marginBottom: "1rem",
  } as React.CSSProperties,
  label: {
    display: "block",
    marginBottom: "0.75rem",
  } as React.CSSProperties,
  labelLast: {
    display: "block",
    marginBottom: "1rem",
  } as React.CSSProperties,
  labelText: {
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
  } as React.CSSProperties,
  input: {
    marginTop: "0.25rem",
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
    marginBottom: "0.75rem",
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
};

/**
 * Shared login page component matching the platform login UI exactly.
 * Used by platform, portal, and marketplace apps.
 */
export const LoginPage = React.memo(function LoginPage({
  onSuccess,
  returnUrl = "/",
  subtitle,
}: LoginPageProps) {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setWorking(true);
    try {
      const email = emailRef.current?.value?.trim() || "";
      const password = pwRef.current?.value || "";
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const r = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        let msg = "Invalid credentials";
        try {
          const j = await r.json();
          if (j?.message) msg = j.message;
        } catch {
          /* ignore */
        }
        setErr(msg);
        return;
      }
      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.assign(returnUrl);
      }
    } catch {
      setErr("Network error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="auth-page" style={styles.page}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h1 style={styles.heading}>Sign In</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        <label style={styles.label}>
          <span style={styles.labelText}>Email</span>
          <input
            ref={emailRef}
            type="email"
            defaultValue=""
            style={styles.input}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>
        <label style={styles.labelLast}>
          <span style={styles.labelText}>Password</span>
          <input
            ref={pwRef}
            type="password"
            defaultValue=""
            style={styles.input}
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </label>
        {err && <div style={styles.error}>{err}</div>}
        <button type="submit" disabled={working} style={styles.button}>
          {working ? "Signing In…" : "Sign In"}
        </button>
      </form>
    </div>
  );
});
