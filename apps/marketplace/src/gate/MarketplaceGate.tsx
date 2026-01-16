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
import { SavedListingsProvider } from "../hooks/useSavedListings";
import { MarketplaceThemeProvider } from "../context/MarketplaceThemeContext";

type GateStatus = "loading" | "unauthenticated" | "not_entitled" | "entitled" | "error";

type GateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "not_entitled" }
  | { status: "entitled" }
  | { status: "error"; message: string };

/**
 * Routes that are publicly accessible without authentication.
 * Users can browse these pages without logging in.
 * Save/contact/waitlist actions will prompt login.
 */
const PUBLIC_ROUTES = [
  "/",
  "/animals",
  "/breeders",
  "/services",
  "/programs",
  "/breeding-programs",
  "/animal-programs",
];

/**
 * Check if a path is publicly accessible.
 */
function isPublicRoute(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }
  // Prefix matches for nested public routes
  if (pathname.startsWith("/breeders/") ||
      pathname.startsWith("/programs/") ||
      pathname.startsWith("/breeding-programs/") ||
      pathname.startsWith("/animal-programs/") ||
      pathname.startsWith("/animals/")) {
    return true;
  }
  return false;
}

/**
 * Context for gate state - allows components to check if they're inside an entitled gate.
 * This is used for DEV-only warnings and ensuring demo mode requires entitlement.
 */
export interface GateContextValue {
  status: GateStatus;
  isEntitled: boolean;
  userProfile: MarketplaceUserProfile | null;
  /** Tenant ID when user is accessing via breeder portal (seller context) */
  tenantId: string | null;
  /** True when user has seller/breeder context (has tenantId) */
  isSeller: boolean;
}

export const GateContext = React.createContext<GateContextValue | null>(null);

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
 * Hook to check if user has seller/breeder context.
 * True when accessed via breeder portal with tenant context.
 * Use this to conditionally show seller-only features.
 */
export function useIsSeller(): boolean {
  const ctx = React.useContext(GateContext);
  return ctx?.isSeller ?? false;
}

/**
 * Hook to get the current tenant ID.
 * Returns null if not in seller context.
 */
export function useTenantId(): string | null {
  const ctx = React.useContext(GateContext);
  return ctx?.tenantId ?? null;
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
 * Get tenant ID from window global or localStorage.
 * This is set when marketplace is embedded in the platform portal.
 */
function getTenantId(): string | null {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    const tenantId = w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID");
    return tenantId || null;
  } catch {
    return null;
  }
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

  // Get tenant context for seller features
  const tenantId = getTenantId();

  // Compute context value
  const contextValue = React.useMemo<GateContextValue>(
    () => ({
      status: state.status,
      isEntitled: state.status === "entitled",
      userProfile,
      tenantId,
      isSeller: !!tenantId,
    }),
    [state.status, userProfile, tenantId]
  );

  // Check if current route is publicly accessible
  const currentPathIsPublic = isPublicRoute(location.pathname);

  // Loading state - no context provided, no routes rendered, no data fetches
  if (state.status === "loading") {
    return <GateLoadingSkeleton />;
  }

  // Error state with retry
  if (state.status === "error") {
    return <GateError message={state.message} onRetry={handleRetry} />;
  }

  // Unauthenticated users can browse public routes
  // Protected routes (inquiries, saved, waitlist, etc.) redirect to auth
  if (state.status === "unauthenticated") {
    // Check if marketplace requires authentication (for pre-launch deploys)
    const requireAuth = import.meta.env.VITE_MARKETPLACE_REQUIRE_AUTH === "true";

    if (currentPathIsPublic && !requireAuth) {
      // Allow anonymous browsing of public pages
      return (
        <MarketplaceThemeProvider>
          <GateContext.Provider value={contextValue}>
            <SavedListingsProvider>
              <MarketplaceLayout authenticated={false}>
                <MarketplaceRoutes />
              </MarketplaceLayout>
            </SavedListingsProvider>
          </GateContext.Provider>
        </MarketplaceThemeProvider>
      );
    }
    // Protected route - show auth page with returnTo path
    return <AuthPage returnToPath={attemptedPath} />;
  }

  // Authenticated but not entitled - allow public browsing, block protected routes
  if (state.status === "not_entitled") {
    // Check if marketplace requires authentication (for pre-launch deploys)
    const requireAuth = import.meta.env.VITE_MARKETPLACE_REQUIRE_AUTH === "true";

    if (currentPathIsPublic && !requireAuth) {
      // Allow browsing even without entitlement
      return (
        <MarketplaceThemeProvider>
          <GateContext.Provider value={contextValue}>
            <SavedListingsProvider>
              <MarketplaceLayout authenticated={true}>
                <MarketplaceRoutes />
              </MarketplaceLayout>
            </SavedListingsProvider>
          </GateContext.Provider>
        </MarketplaceThemeProvider>
      );
    }
    // Protected route without entitlement - show access denied
    return (
      <MarketplaceThemeProvider>
        <GateContext.Provider value={contextValue}>
          <SavedListingsProvider>
            <MarketplaceLayout authenticated={true}>
              <AccessNotAvailable />
            </MarketplaceLayout>
          </SavedListingsProvider>
        </GateContext.Provider>
      </MarketplaceThemeProvider>
    );
  }

  // Entitled - show all routes inside shell with context
  return (
    <MarketplaceThemeProvider>
      <GateContext.Provider value={contextValue}>
        <SavedListingsProvider>
          <MarketplaceLayout authenticated={true}>
            <MarketplaceRoutes />
          </MarketplaceLayout>
        </SavedListingsProvider>
      </GateContext.Provider>
    </MarketplaceThemeProvider>
  );
}

