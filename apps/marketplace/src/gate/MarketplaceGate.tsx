// apps/marketplace/src/gate/MarketplaceGate.tsx
// Auth/entitlement gate for marketplace access
//
// This component handles authentication and entitlement checks.
// Route definitions live in routes/MarketplaceRoutes.tsx.

import * as React from "react";
import { useLocation } from "react-router-dom";
import { apiGet, ApiError } from "../api/client";
import { getUserMessage } from "../api/errors";
import { AuthPage } from "../auth/AuthPage";
import { MarketplaceLayout } from "../layout/MarketplaceLayout";
import { AccessNotAvailable } from "./AccessNotAvailable";
import { MarketplaceRoutes } from "../routes/MarketplaceRoutes";

type GateStatus = "loading" | "unauthenticated" | "not_entitled" | "entitled" | "error";

type GateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "not_entitled" }
  | { status: "entitled" }
  | { status: "error"; message: string };

/**
 * Context for gate state - allows components to check if they're inside an entitled gate.
 * This is used for DEV-only warnings and ensuring demo mode requires entitlement.
 */
interface GateContextValue {
  status: GateStatus;
  isEntitled: boolean;
  userProfile: MarketplaceUserProfile | null;
}

const GateContext = React.createContext<GateContextValue | null>(null);

/**
 * Hook to get the current gate status.
 * Returns null if not inside a MarketplaceGate.
 */
export function useGateStatus(): GateContextValue | null {
  return React.useContext(GateContext);
}

/**
 * Hook to check if user is entitled.
 * For use in hooks/components that should only run when entitled.
 */
export function useIsEntitled(): boolean {
  const ctx = React.useContext(GateContext);
  return ctx?.isEntitled ?? false;
}

/**
 * Hook to get the current user's profile.
 * Returns null if not authenticated or not inside a MarketplaceGate.
 */
export function useUserProfile(): MarketplaceUserProfile | null {
  const ctx = React.useContext(GateContext);
  return ctx?.userProfile ?? null;
}

/**
 * Backend response shape from GET /api/v1/marketplace/me.
 */
interface MarketplaceMeResponse {
  userId?: string;
  marketplaceEntitled?: boolean;
  entitlementSource?: string | null;
  email?: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  surface?: string;
  actorContext?: string;
  entitlements?: Array<{ key: string; status: string; grantedAt: string }>;
  error?: string;
  message?: string;
}

/**
 * User profile data available to marketplace components.
 */
export interface MarketplaceUserProfile {
  userId: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

/**
 * Full page loading skeleton.
 */
function GateLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-portal-bg flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <div className="h-8 bg-border-default rounded animate-pulse w-1/2 mx-auto" />
        <div className="h-4 bg-border-default rounded animate-pulse w-3/4 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Full page error with retry.
 */
function GateError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-portal-bg flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-text-secondary mb-4">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
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
  const [userProfile, setUserProfile] = React.useState<MarketplaceUserProfile | null>(null);

  // Compute the path the user was trying to access (for returnTo)
  const attemptedPath = location.pathname + location.search + location.hash;

  const checkAccess = React.useCallback(async () => {
    setState({ status: "loading" });
    setUserProfile(null);

    try {
      const { data } = await apiGet<MarketplaceMeResponse>(
        "/api/v1/marketplace/me"
      );

      // Check authentication from body (userId present = authenticated)
      const authenticated = !!data?.userId;

      if (!authenticated) {
        setState({ status: "unauthenticated" });
        return;
      }

      // Store user profile data
      setUserProfile({
        userId: data.userId!,
        email: data.email || "",
        name: data.name || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
      });

      // Check entitlement from body (uses marketplaceEntitled from backend)
      const entitled = data?.marketplaceEntitled === true;

      if (!entitled) {
        setState({ status: "not_entitled" });
        return;
      }

      // All good
      setState({ status: "entitled" });
    } catch (err) {
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
      const message = getUserMessage(err);
      setState({ status: "error", message });
    }
  }, []);

  React.useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleRetry = React.useCallback(() => {
    checkAccess();
  }, [checkAccess]);

  // Compute context value
  const contextValue = React.useMemo<GateContextValue>(
    () => ({
      status: state.status,
      isEntitled: state.status === "entitled",
      userProfile,
    }),
    [state.status, userProfile]
  );

  // Loading state - no context provided, no routes rendered, no data fetches
  if (state.status === "loading") {
    return <GateLoadingSkeleton />;
  }

  // Error state with retry
  if (state.status === "error") {
    return <GateError message={state.message} onRetry={handleRetry} />;
  }

  // Unauthenticated - show auth page with returnTo path
  // Note: AuthPage is outside the context as it shouldn't access protected data
  if (state.status === "unauthenticated") {
    return <AuthPage returnToPath={attemptedPath} />;
  }

  // Authenticated but not entitled
  if (state.status === "not_entitled") {
    return (
      <GateContext.Provider value={contextValue}>
        <MarketplaceLayout authenticated={true}>
          <DevGateBanner status={state.status} />
          <AccessNotAvailable />
        </MarketplaceLayout>
      </GateContext.Provider>
    );
  }

  // Entitled - show routes inside shell with context
  return (
    <GateContext.Provider value={contextValue}>
      <MarketplaceLayout authenticated={true}>
        <DevGateBanner status={state.status} />
        <MarketplaceRoutes />
      </MarketplaceLayout>
    </GateContext.Provider>
  );
}

/**
 * DEV-only banner showing gate status for debugging.
 * Only renders in development mode.
 * Also adds a data-gate-status attribute used by the API client for DEV warnings.
 */
function DevGateBanner({ status }: { status: GateStatus }) {
  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const statusColors: Record<GateStatus, string> = {
    loading: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    unauthenticated: "bg-red-500/20 text-red-300 border-red-500/30",
    not_entitled: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    entitled: "bg-green-500/20 text-green-300 border-green-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div
      data-gate-status={status}
      className={`fixed top-0 right-0 z-50 px-3 py-1 text-xs font-mono border-l border-b rounded-bl ${statusColors[status]}`}
    >
      DEV: gate={status}
    </div>
  );
}
