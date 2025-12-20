import React, { useEffect, useState } from "react";

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
      window.location.href = "/";
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      {!mustChangeMode ? (
        // Normal login form
        <form onSubmit={onSubmit} className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h1 className="text-xl font-semibold">Sign in</h1>

          {notice && (
            <div className="text-sm rounded-md border border-emerald-800/40 bg-emerald-950/30 p-2">{notice}</div>
          )}
          {err && (
            <div className="text-sm rounded-md border border-red-800/40 bg-red-950/30 p-2">{err}</div>
          )}

          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
              autoComplete="current-password"
              placeholder="Your password"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full h-10 rounded-md bg-white text-black font-medium hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

        </form>
      ) : (
        // Must-change password form
        <form onSubmit={onChangePassword} className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Set your new password</h1>
            <p className="text-sm text-neutral-400 mt-1">
              You must change your temporary password before continuing.
            </p>
          </div>

          {notice && (
            <div className="text-sm rounded-md border border-emerald-800/40 bg-emerald-950/30 p-2">{notice}</div>
          )}
          {err && (
            <div className="text-sm rounded-md border border-red-800/40 bg-red-950/30 p-2">{err}</div>
          )}

          <div className="text-sm text-neutral-400">
            Account: <span className="text-white font-medium">{email}</span>
          </div>

          <label className="block text-sm">
            Temporary Password
            <input
              type="password"
              required
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
              autoComplete="current-password"
              placeholder="Enter your temporary password"
            />
          </label>

          <label className="block text-sm">
            New Password
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
            />
          </label>

          <label className="block text-sm">
            Confirm New Password
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-neutral-800 bg-neutral-900 px-3"
              autoComplete="new-password"
              placeholder="Re-enter new password"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full h-10 rounded-md bg-white text-black font-medium hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Updating password…" : "Set password and sign in"}
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
            className="w-full text-sm text-neutral-400 hover:text-white"
          >
            ← Back to sign in
          </button>

        </form>
      )}
    </div>
  );
}
