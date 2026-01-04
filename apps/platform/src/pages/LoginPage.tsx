import React, { useEffect, useState, useMemo } from "react";

// BreederHQ logo - same asset used by Portal and Marketplace
import logoUrl from "@bhq/ui/assets/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Must-change password state
  const [mustChangeMode, setMustChangeMode] = useState(false);
  const [changeToken, setChangeToken] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const returnUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("returnUrl");
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "/";
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("verified") === "1") setNotice("Email verified! You can sign in now.");
  }, []);

  // Clear sensitive data on unmount
  useEffect(() => {
    return () => {
      setTempPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangeToken(null);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 403) {
        // Check if it's a must-change password error
        const data = await res.json();
        if (data.error === "must_change_password" && data.changePasswordToken) {
          // Switch to must-change mode
          setChangeToken(data.changePasswordToken);
          setMustChangeMode(true);
          setPassword(""); // Clear password field for security
          setNotice(null);
          setErr(null);
          return;
        }
        throw new Error(data.message || "Access denied");
      }

      if (!res.ok) {
        let msg = `Login failed (${res.status})`;
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      window.location.href = returnUrl;
    } catch (e: any) {
      setErr(e?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);

    // Client-side validation
    if (!tempPassword.trim()) {
      setErr("Temporary password is required");
      setBusy(false);
      return;
    }
    if (newPassword.length < 8) {
      setErr("New password must be at least 8 characters");
      setBusy(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: changeToken,
          tempPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        let msg = "Password change failed";
        if (data.error === "temp_password_incorrect") {
          msg = "Temporary password is incorrect";
        } else if (data.error === "invalid_or_expired_token") {
          msg = "Your session has expired. Please try logging in again.";
        } else if (data.error === "password_too_short") {
          msg = "New password must be at least 8 characters";
        } else if (data.message) {
          msg = data.message;
        }
        throw new Error(msg);
      }

      // Password changed successfully, now login with new password
      setNotice("Password changed successfully. Signing in...");
      setTempPassword(""); // Clear sensitive data
      setNewPassword("");
      setConfirmPassword("");
      setChangeToken(null);

      // Auto-login with new password
      const loginRes = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });

      if (!loginRes.ok) {
        throw new Error("Password changed but auto-login failed. Please sign in manually.");
      }

      window.location.href = "/";
    } catch (e: any) {
      setErr(e?.message || "Password change failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-portal-bg">
      <div className="w-full max-w-[420px]">
        {/* BreederHQ branding - matches Portal and Marketplace */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <img
            src={logoUrl}
            alt="BreederHQ"
            className="w-16 h-16 object-contain"
          />
          <h1 className="text-xl font-semibold text-white text-center">
            BreederHQ
          </h1>
          <p className="text-sm text-text-tertiary text-center max-w-[300px]">
            Breeder management software for modern breeders.
          </p>
        </div>

        {!mustChangeMode ? (
          // Normal login form
          <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {notice && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-portal-xs bg-emerald-500/10 border-l-[3px] border-emerald-500 text-emerald-300 text-sm"
                >
                  {notice}
                </div>
              )}
              {err && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-portal-xs bg-red-500/10 border-l-[3px] border-red-500 text-red-300 text-sm"
                >
                  {err}
                </div>
              )}

              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={busy}
                  aria-label="Email address"
                />
              </label>

              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  aria-label="Password"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="w-full h-10 rounded-portal-xs bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 border border-accent"
                aria-busy={busy}
              >
                {busy ? "Signing in..." : "Sign In"}
              </button>

              <a
                href="/forgot-password"
                className="text-sm text-text-secondary text-center hover:text-accent transition-colors"
              >
                Forgot password
              </a>

              <div className="text-center text-sm pt-2 border-t border-border-subtle mt-2">
                <span className="text-text-tertiary">Don't have an account? </span>
                <a
                  href="/register"
                  className="text-accent hover:text-accent-hover transition-colors font-medium"
                >
                  Create one
                </a>
              </div>
            </form>
          </div>
        ) : (
          // Must-change password form
          <div className="rounded-portal border border-border-subtle bg-portal-card p-6">
            <form onSubmit={onChangePassword} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Set your new password</h2>
                <p className="text-sm text-text-tertiary mt-1">
                  You must change your temporary password before continuing.
                </p>
              </div>

              {notice && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-portal-xs bg-emerald-500/10 border-l-[3px] border-emerald-500 text-emerald-300 text-sm"
                >
                  {notice}
                </div>
              )}
              {err && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-portal-xs bg-red-500/10 border-l-[3px] border-red-500 text-red-300 text-sm"
                >
                  {err}
                </div>
              )}

              <div className="text-sm text-text-tertiary">
                Account: <span className="text-white font-medium">{email}</span>
              </div>

              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">Temporary Password</span>
                <input
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="Enter your temporary password"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                />
              </label>

              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={busy}
                />
              </label>

              <label className="block">
                <span className="block text-sm text-text-secondary mb-1">Confirm New Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-portal-xs bg-portal-elevated border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-colors"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="w-full h-10 rounded-portal-xs bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 border border-accent"
                aria-busy={busy}
              >
                {busy ? "Updating password..." : "Set password and sign in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMustChangeMode(false);
                  setChangeToken(null);
                  setTempPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErr(null);
                }}
                className="w-full text-sm text-text-secondary hover:text-accent transition-colors"
              >
                Back to sign in
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
