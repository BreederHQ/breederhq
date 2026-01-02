// apps/marketplace/src/gate/MarketplaceGate.tsx
import * as React from "react";
import { useLocation } from "react-router-dom";
import { joinApi } from "../shared/http/baseUrl";
import { safeReadJson } from "../shared/http/safeJson";
import { FullPageSkeleton } from "../shared/ui/FullPageSkeleton";
import { FullPageError } from "../shared/ui/FullPageError";
import { MarketplaceAuthPage } from "../shells/standalone/MarketplaceAuthPage";
import { StandaloneShell } from "../shells/standalone/StandaloneShell";
import { AccessNotAvailable } from "./AccessNotAvailable";
import { MarketplaceRoutes } from "../core/MarketplaceRoutes";

type GateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "not_entitled" }
  | { status: "entitled" }
  | { status: "error"; message?: string };

/**
 * Determine if user is authenticated from /me response body.
 * Tolerant of different response shapes.
 */
function isAuthenticated(body: any): boolean {
  if (!body) return false;
  if (body.authenticated === true || body.authenticated === "true") return true;
  if (body.user != null) return true;
  if (body.session != null) return true;
  return false;
}

/**
 * Determine if user is entitled from /me response body.
 * Tolerant of different response shapes.
 */
function isEntitled(body: any): boolean {
  if (!body) return false;
  if (body.entitled === true || body.entitled === "true") return true;
  return false;
}

/**
 * Single source of truth for marketplace access gating.
 * Checks /api/v1/marketplace/me and renders appropriate state.
 */
export function MarketplaceGate() {
  const location = useLocation();
  const [state, setState] = React.useState<GateState>({ status: "loading" });

  // Compute the path the user was trying to access (for returnTo)
  const attemptedPath = location.pathname + location.search + location.hash;

  const checkAccess = React.useCallback(async () => {
    setState({ status: "loading" });

    try {
      const res = await fetch(joinApi("/api/v1/marketplace/me"), {
        method: "GET",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });

      // 401 = unauthenticated
      if (res.status === 401) {
        setState({ status: "unauthenticated" });
        return;
      }

      // 403 = authenticated but not entitled
      if (res.status === 403) {
        setState({ status: "not_entitled" });
        return;
      }

      // 5xx = server error
      if (res.status >= 500) {
        setState({ status: "error", message: "Unable to verify access. Try again." });
        return;
      }

      // Try to parse response body defensively
      const data = await safeReadJson(res);

      // If we couldn't parse JSON or body is null/undefined, treat as error (not unauthenticated)
      if (!data) {
        setState({ status: "error", message: "Unable to verify access. Try again." });
        return;
      }

      // Check authentication from body tolerantly
      if (!isAuthenticated(data)) {
        setState({ status: "unauthenticated" });
        return;
      }

      // Check entitlement from body tolerantly
      if (!isEntitled(data)) {
        setState({ status: "not_entitled" });
        return;
      }

      // All good
      setState({ status: "entitled" });
    } catch {
      // Network error
      setState({ status: "error", message: "Unable to verify access. Try again." });
    }
  }, []);

  React.useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Loading state
  if (state.status === "loading") {
    return <FullPageSkeleton />;
  }

  // Error state with retry
  if (state.status === "error") {
    return <FullPageError onRetry={checkAccess} message={state.message} />;
  }

  // Unauthenticated - show auth page with returnTo path
  if (state.status === "unauthenticated") {
    return <MarketplaceAuthPage returnToPath={attemptedPath} />;
  }

  // Authenticated but not entitled
  if (state.status === "not_entitled") {
    return (
      <StandaloneShell authenticated={true}>
        <AccessNotAvailable />
      </StandaloneShell>
    );
  }

  // Entitled - show routes inside shell
  return (
    <StandaloneShell authenticated={true}>
      <MarketplaceRoutes />
    </StandaloneShell>
  );
}
