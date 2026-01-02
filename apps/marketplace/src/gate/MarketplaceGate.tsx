// apps/marketplace/src/gate/MarketplaceGate.tsx
import * as React from "react";
import { useLocation } from "react-router-dom";
import { apiGet } from "../shared/http/apiClient";
import { ApiError } from "../shared/http/ApiError";
import { getUserFacingMessage } from "../shared/errors/userMessages";
import { MarketplaceAuthPage } from "../shells/standalone/MarketplaceAuthPage";
import { StandaloneShell } from "../shells/standalone/StandaloneShell";
import { AccessNotAvailable } from "./AccessNotAvailable";
import { MarketplaceRoutes } from "../core/MarketplaceRoutes";

type GateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "not_entitled" }
  | { status: "entitled" }
  | { status: "error"; message: string };

/**
 * Backend response shape from GET /api/v1/marketplace/me.
 */
interface MarketplaceMeResponse {
  userId?: string;
  marketplaceEntitled?: boolean;
  entitlementSource?: string | null;
  email?: string;
  name?: string | null;
  surface?: string;
  actorContext?: string;
  entitlements?: Array<{ key: string; status: string; grantedAt: string }>;
  error?: string;
  message?: string;
}

/**
 * Full page loading skeleton.
 */
function GateLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <div className="h-8 bg-white/10 rounded animate-pulse w-1/2 mx-auto" />
        <div className="h-4 bg-white/10 rounded animate-pulse w-3/4 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Full page error with retry.
 */
function GateError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-white/70 mb-4">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
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
      const { data, status } = await apiGet<MarketplaceMeResponse>(
        "/api/v1/marketplace/me"
      );

      // DEV-only diagnostic trace (once per page load / retry)
      if (import.meta.env.DEV && !hasLoggedRef.current) {
        console.log("[marketplace/me]", { status, body: data });
        hasLoggedRef.current = true;
      }

      // Check authentication from body (userId present = authenticated)
      const authenticated = !!data?.userId;

      if (!authenticated) {
        setState({ status: "unauthenticated" });
        return;
      }

      // Check entitlement from body (uses marketplaceEntitled from backend)
      const entitled = data?.marketplaceEntitled === true;

      if (!entitled) {
        setState({ status: "not_entitled" });
        return;
      }

      // All good
      setState({ status: "entitled" });
    } catch (err) {
      // DEV-only diagnostic trace for errors
      if (import.meta.env.DEV && !hasLoggedRef.current) {
        if (err instanceof ApiError) {
          console.log("[marketplace/me]", { status: err.status, body: null, error: err.code });
        }
        hasLoggedRef.current = true;
      }

      if (err instanceof ApiError) {
        // 401 = unauthenticated
        if (err.status === 401) {
          setState({ status: "unauthenticated" });
          return;
        }

        // 403 = authenticated but not entitled (blocked)
        if (err.status === 403) {
          setState({ status: "not_entitled" });
          return;
        }
      }

      // Other errors - show error state with user-facing message
      const message = getUserFacingMessage(err, "Unable to verify access. Try again.");
      setState({ status: "error", message });
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
    return <GateLoadingSkeleton />;
  }

  // Error state with retry
  if (state.status === "error") {
    return <GateError message={state.message} onRetry={handleRetry} />;
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
