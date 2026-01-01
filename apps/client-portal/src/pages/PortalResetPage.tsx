// apps/client-portal/src/pages/PortalResetPage.tsx
// Password reset page for the standalone Client Portal.
// Uses existing /api/v1/auth/reset-password endpoint.
// Validates token via GET first, then accepts new password via POST.

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
  hint: {
    fontSize: "0.75rem",
    color: "hsl(var(--secondary))",
    marginTop: "0.25rem",
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
  spinner: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1rem",
  } as React.CSSProperties,
  spinnerCircle: {
    width: "2rem",
    height: "2rem",
    border: "2px solid hsl(var(--brand-orange))",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  } as React.CSSProperties,
};

type PageState = "validating" | "ready" | "submitting" | "success" | "invalid";

export default function PortalResetPage() {
  const { basePath, navigate } = useOrg();
  const pwRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState<PageState>("validating");
  const [error, setError] = React.useState<string | null>(null);

  // Get token from URL query string
  const token = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  // Validate token on mount
  React.useEffect(() => {
    if (!token) {
      setState("invalid");
      setError("Reset link is missing or invalid.");
      return;
    }

    async function validateToken() {
      try {
        // GET endpoint validates without consuming the token
        const res = await fetch(`/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`, {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          setState("ready");
        } else {
          setState("invalid");
          setError("This reset link is invalid or has expired. Please request a new one.");
        }
      } catch (err) {
        console.error("[PortalResetPage] Token validation failed:", err);
        setState("invalid");
        setError("Unable to validate reset link. Please try again.");
      }
    }

    validateToken();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const password = pwRef.current?.value || "";
    const confirm = confirmRef.current?.value || "";

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setState("submitting");

    try {
      // Get CSRF token from cookie
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setState("success");
        // Redirect to login after short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setState("ready");

        if (data.error === "password_too_short") {
          setError("Password must be at least 8 characters.");
        } else if (data.error === "invalid_or_expired_token") {
          setState("invalid");
          setError("This reset link has expired. Please request a new one.");
        } else {
          setError(data.message || "Unable to reset password. Please try again.");
        }
      }
    } catch (err) {
      console.error("[PortalResetPage] Reset failed:", err);
      setState("ready");
      setError("Network error. Please check your connection and try again.");
    }
  }

  function handleLoginClick(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/login");
  }

  function handleForgotClick(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/forgot");
  }

  // Validating state
  if (state === "validating") {
    return (
      <div className="auth-page" style={styles.page}>
        <div style={styles.form}>
          <div style={styles.spinner}>
            <div style={styles.spinnerCircle} />
            <span style={{ fontSize: "0.875rem", color: "hsl(var(--secondary))" }}>
              Validating reset link...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (state === "invalid") {
    return (
      <div className="auth-page" style={styles.page}>
        <div style={styles.form}>
          <h1 style={styles.heading}>Invalid Link</h1>
          <div style={styles.error}>{error}</div>
          <a
            href={`${basePath}/forgot`}
            onClick={handleForgotClick}
            style={styles.link}
          >
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <div className="auth-page" style={styles.page}>
        <div style={styles.form}>
          <h1 style={styles.heading}>Password Reset</h1>
          <div style={styles.success}>
            Your password has been reset successfully. Redirecting to sign in...
          </div>
          <a
            href={`${basePath}/login`}
            onClick={handleLoginClick}
            style={styles.link}
          >
            Sign in now
          </a>
        </div>
      </div>
    );
  }

  // Ready/submitting state - show form
  return (
    <div className="auth-page" style={styles.page}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h1 style={styles.heading}>Set New Password</h1>
        <p style={styles.subtitle}>
          Enter your new password below.
        </p>

        <label style={styles.label}>
          <span style={styles.labelText}>New Password</span>
          <input
            ref={pwRef}
            type="password"
            style={styles.input}
            autoComplete="new-password"
            placeholder="Enter new password"
            required
            minLength={8}
            disabled={state === "submitting"}
          />
          <p style={styles.hint}>At least 8 characters</p>
        </label>

        <label style={styles.label}>
          <span style={styles.labelText}>Confirm Password</span>
          <input
            ref={confirmRef}
            type="password"
            style={styles.input}
            autoComplete="new-password"
            placeholder="Confirm new password"
            required
            minLength={8}
            disabled={state === "submitting"}
          />
        </label>

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={state === "submitting"}
          style={{
            ...styles.button,
            ...(state === "submitting" ? styles.buttonDisabled : {}),
          }}
        >
          {state === "submitting" ? "Resetting..." : "Reset Password"}
        </button>

        <a
          href={`${basePath}/login`}
          onClick={handleLoginClick}
          style={styles.link}
        >
          Back to sign in
        </a>
      </form>
    </div>
  );
}
