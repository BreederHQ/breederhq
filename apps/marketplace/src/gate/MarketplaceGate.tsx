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
 * Backend response shape from GET /api/v1/marketplace/me:
 * {
 *   userId: string,
 *   email: string,
 *   name: string | null,
 *   actorContext: string,
 *   surface: string,
 *   entitlements: Array<{ key: string, status: string, grantedAt: Date }>,
 *   marketplaceEntitled: boolean,
 *   entitlementSource: "SUPER_ADMIN" | "ENTITLEMENT" | "STAFF_POLICY" | null
 * }
 */

/**
 * Determine if user is authenticated from /me response body.
 * Backend returns userId if authenticated.
 */
function isAuthenticated(body: any): boolean {
  if (!body) return false;
  // Backend returns userId if authenticated
  if (body.userId != null) return true;
  // Fallback for tolerant parsing
  if (body.authenticated === true || body.authenticated === "true") return true;
  if (body.user != null) return true;
  if (body.session != null) return true;
  return false;
}

/**
 * Determine if user is entitled from /me response body.
 * Backend returns `marketplaceEntitled` (not `entitled`).
 */
function isEntitled(body: any): boolean {
  if (!body) return false;
  // Backend uses marketplaceEntitled
  if (body.marketplaceEntitled === true) return true;
  // Fallback for tolerant parsing
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
  const hasLoggedRef = React.useRef(false);

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
        if (import.meta.env.DEV && !hasLoggedRef.current) {
          console.log("[marketplace/me]", { status: 401, body: null });
          hasLoggedRef.current = true;
        }
        setState({ status: "unauthenticated" });
        return;
      }

      // 403 = authenticated but not entitled
      if (res.status === 403) {
        if (import.meta.env.DEV && !hasLoggedRef.current) {
          console.log("[marketplace/me]", { status: 403, body: null });
          hasLoggedRef.current = true;
        }
        setState({ status: "not_entitled" });
        return;
      }

      // 5xx = server error
      if (res.status >= 500) {
        if (import.meta.env.DEV && !hasLoggedRef.current) {
          console.log("[marketplace/me]", { status: res.status, body: null });
          hasLoggedRef.current = true;
        }
        setState({ status: "error", message: "Unable to verify access. Try again." });
        return;
      }

      // Try to parse response body defensively
      const data = await safeReadJson(res);

      // DEV-only diagnostic trace (once per page load / retry)
      if (import.meta.env.DEV && !hasLoggedRef.current) {
        console.log("[marketplace/me]", { status: res.status, body: data });
        hasLoggedRef.current = true;
      }

      // If we couldn't parse JSON or body is null/undefined, treat as error (not unauthenticated)
      if (!data) {
        setState({ status: "error", message: "Unable to verify access. Try again." });
        return;
      }

      // Check authentication from body
      if (!isAuthenticated(data)) {
        setState({ status: "unauthenticated" });
        return;
      }

      // Check entitlement from body (uses marketplaceEntitled from backend)
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

  // Reset log flag on retry
  const handleRetry = React.useCallback(() => {
    hasLoggedRef.current = false;
    checkAccess();
  }, [checkAccess]);

  // Loading state
  if (state.status === "loading") {
    return <FullPageSkeleton />;
  }

  // Error state with retry
  if (state.status === "error") {
    return <FullPageError onRetry={handleRetry} message={state.message} />;
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
