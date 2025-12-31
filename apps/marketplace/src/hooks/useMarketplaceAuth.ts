// apps/marketplace/src/hooks/useMarketplaceAuth.ts
// Hook to check marketplace auth state.
//
// The marketplace surface requires:
// 1. Valid session cookie
// 2. UserEntitlement(MARKETPLACE_ACCESS, ACTIVE)
//
// If either is missing, the backend returns 401/403.

import * as React from "react";

export interface MarketplaceAuthState {
  loading: boolean;
  authenticated: boolean;
  error: string | null;
}

/**
 * Check marketplace authentication status.
 * Makes a lightweight request to validate session + entitlement.
 */
export function useMarketplaceAuth(): MarketplaceAuthState {
  const [state, setState] = React.useState<MarketplaceAuthState>({
    loading: true,
    authenticated: false,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Try to fetch session info - if user doesn't have entitlement, this will 403
        const res = await fetch("/api/v1/session", { credentials: "include" });

        if (cancelled) return;

        if (res.ok) {
          setState({ loading: false, authenticated: true, error: null });
        } else if (res.status === 401) {
          setState({ loading: false, authenticated: false, error: "not_authenticated" });
        } else if (res.status === 403) {
          // Has session but lacks entitlement
          setState({ loading: false, authenticated: false, error: "no_entitlement" });
        } else {
          setState({ loading: false, authenticated: false, error: "unknown_error" });
        }
      } catch (err: any) {
        if (cancelled) return;
        setState({ loading: false, authenticated: false, error: err?.message || "network_error" });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
