// apps/portal/src/pages/PortalActivatePage.tsx
// Portal invite activation page
// Uses GET /api/v1/portal/invites/:token to validate and display invite info
// Uses POST /api/v1/portal/invites/:token/accept to accept the invite

import * as React from "react";
import { Button } from "@bhq/ui";

interface InviteInfo {
  valid: boolean;
  orgName: string;
  maskedEmail: string;
  partyName: string;
  expiresAt: string;
}

interface ActivateState {
  status: "validating" | "ready" | "submitting" | "success" | "error";
  error: string | null;
  tenantSlug: string | null;
  invite: InviteInfo | null;
}

export default function PortalActivatePage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [state, setState] = React.useState<ActivateState>({
    status: "validating",
    error: null,
    tenantSlug: null,
    invite: null,
  });

  // Get token from URL query string
  const token = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  // Validate token on mount
  React.useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        error: "token_required",
        tenantSlug: null,
        invite: null,
      });
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/v1/portal/invites/${encodeURIComponent(token)}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.valid) {
          setState({
            status: "ready",
            error: null,
            tenantSlug: null,
            invite: data,
          });
        } else {
          setState({
            status: "error",
            error: data.error || "invalid_token",
            tenantSlug: null,
            invite: null,
          });
        }
      } catch (err: any) {
        console.error("[PortalActivatePage] Token validation failed:", err);
        setState({
          status: "error",
          error: "validation_failed",
          tenantSlug: null,
          invite: null,
        });
      }
    }

    validateToken();
  }, [token]);

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
    state.status === "ready";

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) return;

    setState((prev) => ({ ...prev, status: "submitting", error: null }));

    try {
      const res = await fetch(`/api/v1/portal/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setState((prev) => ({
          ...prev,
          status: "success",
          error: null,
          tenantSlug: data.tenantSlug,
        }));
        // Redirect to portal dashboard after short delay
        setTimeout(() => {
          window.location.href = `/t/${data.tenantSlug}/dashboard`;
        }, 1500);
      } else {
        const errorMsg = getErrorMessage(data.error);
        setState((prev) => ({
          ...prev,
          status: "ready",
          error: errorMsg,
        }));
      }
    } catch (err: any) {
      console.error("[PortalActivatePage] Activation failed:", err);
      setState((prev) => ({
        ...prev,
        status: "ready",
        error: "Network error. Please try again.",
      }));
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
      case "party_conflict":
        return "Your account is already linked to a different profile in this organization.";
      case "RATE_LIMITED":
        return "Too many attempts. Please wait a minute and try again.";
      case "validation_failed":
        return "Could not validate this link. Please try again.";
      default:
        return "Activation failed. Please try again or contact support.";
    }
  }

  // Loading state while validating
  if (state.status === "validating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page p-4">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[hsl(var(--brand-orange))] border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Validating Invitation...</h1>
          <p className="text-secondary text-sm">Please wait while we verify your invitation link.</p>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (state.status === "error" && !state.invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page p-4">
        <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-3xl">
            !
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">
            {state.error === "token_expired" ? "Link Expired" : "Invalid Link"}
          </h1>
          <p className="text-secondary text-sm">
            {getErrorMessage(state.error || "invalid_token")}
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
            &#10003;
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Account Activated!</h1>
          <p className="text-secondary text-sm mb-4">
            Your portal account is now active. Redirecting you to the dashboard...
          </p>
          <div className="animate-pulse text-sm text-secondary">Redirecting...</div>
        </div>
      </div>
    );
  }

  // Ready state - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--brand-orange))]/10 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-3xl">
            &#128274;
          </div>
          <h1 className="text-xl font-semibold text-primary mb-2">Activate Your Portal Account</h1>
          {state.invite && (
            <div className="mt-3 p-3 rounded-lg bg-page border border-hairline text-sm">
              <p className="text-secondary">
                You have been invited to join the client portal for:
              </p>
              <p className="font-medium text-primary mt-1">{state.invite.orgName}</p>
              <p className="text-tertiary text-xs mt-1">
                Invitation for: {state.invite.maskedEmail}
              </p>
            </div>
          )}
          <p className="text-secondary text-sm mt-4">
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
              disabled={state.status === "submitting"}
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
              disabled={state.status === "submitting"}
            />
          </div>

          {passwordError && <div className="text-sm text-red-500">{passwordError}</div>}

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
            disabled={!canSubmit || state.status === "submitting"}
          >
            {state.status === "submitting" ? "Activating..." : "Activate Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
