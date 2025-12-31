// apps/portal/src/pages/PortalActivatePage.tsx
// Portal invite activation page

import * as React from "react";
import { Button } from "@bhq/ui";

interface ActivateState {
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  tenantSlug: string | null;
}

export default function PortalActivatePage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [state, setState] = React.useState<ActivateState>({
    status: "idle",
    error: null,
    tenantSlug: null,
  });

  // Get token from URL query string
  const token = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  const passwordError = React.useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return "Password must be at least 8 characters";
    if (confirmPassword && password !== confirmPassword) return "Passwords do not match";
    return null;
  }, [password, confirmPassword]);

  const canSubmit =
    token &&
    password.length >= 8 &&
    password === confirmPassword &&
    state.status !== "loading";

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) return;

    setState({ status: "loading", error: null, tenantSlug: null });

    try {
      const res = await fetch("/api/v1/portal/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setState({ status: "success", error: null, tenantSlug: data.tenantSlug });
        // Redirect to portal dashboard after short delay
        setTimeout(() => {
          window.location.href = `/t/${data.tenantSlug}/dashboard`;
        }, 1500);
      } else {
        const errorMsg = getErrorMessage(data.error);
        setState({ status: "error", error: errorMsg, tenantSlug: null });
      }
    } catch (err: any) {
      console.error("[PortalActivatePage] Activation failed:", err);
      setState({
        status: "error",
        error: "Network error. Please try again.",
        tenantSlug: null,
      });
    }
  }

  function getErrorMessage(code: string): string {
    switch (code) {
      case "token_required":
        return "Activation token is missing.";
      case "invalid_token":
        return "This activation link is invalid.";
      case "token_expired":
        return "This activation link has expired. Please request a new one.";
      case "token_already_used":
        return "This activation link has already been used.";
      case "staff_suppression":
        return "Staff members cannot use client portal invites for the same organization.";
      case "membership_suspended":
        return "Your portal access has been suspended. Please contact support.";
      default:
        return "Activation failed. Please try again or contact support.";
    }
  }

  // Show error if no token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page p-4">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
            !
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Invalid Link</h1>
          <p className="text-secondary text-sm">
            This activation link is missing required information. Please check your email
            for the correct link or request a new invitation.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (state.status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page p-4">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Account Activated!</h1>
          <p className="text-secondary text-sm mb-4">
            Your portal account is now active. Redirecting you to the dashboard...
          </p>
          <div className="animate-pulse text-sm text-secondary">
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-3xl">
            🔐
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Activate Your Portal Account</h1>
          <p className="text-secondary text-sm">
            Set a password to complete your account setup.
          </p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-surface text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              minLength={8}
              required
              disabled={state.status === "loading"}
            />
            <p className="mt-1 text-xs text-secondary">At least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-surface text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
              minLength={8}
              required
              disabled={state.status === "loading"}
            />
          </div>

          {passwordError && (
            <div className="text-sm text-red-500">{passwordError}</div>
          )}

          {state.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={!canSubmit}
          >
            {state.status === "loading" ? "Activating..." : "Activate Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
