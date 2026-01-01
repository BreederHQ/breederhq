// apps/marketplace/src/pages/MarketplaceAuthPage.tsx
// Auth page for marketplace access with login and register modes.
// Registration grants MARKETPLACE_ACCESS entitlement automatically.

import * as React from "react";

interface Props {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  onSuccess: () => void;
}

// Inline styles matching the shared LoginPage for consistency
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
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  } as React.CSSProperties,
  switchRow: {
    marginTop: "1rem",
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--secondary))",
  } as React.CSSProperties,
  switchLink: {
    color: "hsl(var(--brand-orange))",
    cursor: "pointer",
    textDecoration: "underline",
    background: "none",
    border: "none",
    font: "inherit",
    padding: 0,
  } as React.CSSProperties,
};

export function MarketplaceAuthPage({ mode, onModeChange, onSuccess }: Props) {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const pwRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setWorking(true);

    try {
      const email = emailRef.current?.value?.trim() || "";
      const password = pwRef.current?.value || "";
      const name = nameRef.current?.value?.trim() || undefined;

      // Get CSRF token from cookie
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (xsrf) {
        headers["x-csrf-token"] = decodeURIComponent(xsrf);
      }

      if (isRegister) {
        // Register endpoint - creates user and grants MARKETPLACE_ACCESS
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
          let msg = "Registration failed";
          try {
            const j = await res.json();
            if (j?.error === "password_too_short") msg = "Password must be at least 8 characters";
            else if (j?.message) msg = j.message;
            else if (j?.error) msg = j.error;
          } catch { /* ignore */ }
          setErr(msg);
          return;
        }

        // After registration, auto-login
        const loginRes = await fetch("/api/v1/auth/login", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) {
          // Registration succeeded but login failed - still redirect to login
          onModeChange("login");
          setErr("Account created. Please sign in.");
          return;
        }
      } else {
        // Login endpoint
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          let msg = "Invalid credentials";
          try {
            const j = await res.json();
            if (j?.message) msg = j.message;
            else if (j?.error) msg = j.error;
          } catch { /* ignore */ }
          setErr(msg);
          return;
        }
      }

      // Success - trigger auth re-check
      onSuccess();
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="auth-page" style={styles.page}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h1 style={styles.heading}>
          {isRegister ? "Create Account" : "Sign In"}
        </h1>
        <p style={styles.subtitle}>
          {isRegister
            ? "Join the Marketplace to browse breeding programs"
            : "Sign in to access the Marketplace"}
        </p>

        {isRegister && (
          <label style={styles.label}>
            <span style={styles.labelText}>Name (optional)</span>
            <input
              ref={nameRef}
              type="text"
              defaultValue=""
              style={styles.input}
              autoComplete="name"
              placeholder="Your name"
            />
          </label>
        )}

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
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "At least 8 characters" : "Your password"}
            minLength={isRegister ? 8 : undefined}
            required
          />
        </label>

        {err && <div style={styles.error}>{err}</div>}

        <button
          type="submit"
          disabled={working}
          style={{
            ...styles.button,
            ...(working ? styles.buttonDisabled : {}),
          }}
        >
          {working
            ? (isRegister ? "Creating Account…" : "Signing In…")
            : (isRegister ? "Create Account" : "Sign In")}
        </button>

        <div style={styles.switchRow as React.CSSProperties}>
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                style={styles.switchLink}
                onClick={() => {
                  setErr(null);
                  onModeChange("login");
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                style={styles.switchLink}
                onClick={() => {
                  setErr(null);
                  onModeChange("register");
                }}
              >
                Create one
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
