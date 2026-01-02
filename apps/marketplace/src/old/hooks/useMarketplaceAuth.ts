// apps/marketplace/src/hooks/useMarketplaceAuth.ts
// Hook to check marketplace auth state using /api/v1/marketplace/me endpoint.
//
// The marketplace surface requires:
// 1. Valid session cookie
// 2. Either MARKETPLACE_ACCESS entitlement OR STAFF membership (policy-based)
//
// Response from /marketplace/me:
// - 200: authenticated and entitled (returns marketplaceEntitled: true)
// - 401: not authenticated
// - 403: authenticated but not entitled (SURFACE_ACCESS_DENIED)

import * as React from "react";

export interface MarketplaceAuthState {
  loading: boolean;
  authenticated: boolean;
  entitled: boolean;
  error: "not_authenticated" | "not_entitled" | "network_error" | null;
  entitlementSource?: "SUPER_ADMIN" | "ENTITLEMENT" | "STAFF_POLICY" | null;
}

/**
 * Check marketplace authentication and entitlement status.
 * Uses /api/v1/marketplace/me for accurate entitlement checking.
 */
export function useMarketplaceAuth(): MarketplaceAuthState {
  const [state, setState] = React.useState<MarketplaceAuthState>({
    loading: true,
    authenticated: false,
    entitled: false,
    error: null,
    entitlementSource: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/v1/marketplace/me", {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" },
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setState({
            loading: false,
            authenticated: true,
            entitled: data.marketplaceEntitled === true,
            error: data.marketplaceEntitled ? null : "not_entitled",
            entitlementSource: data.entitlementSource || null,
          });
        } else if (res.status === 401) {
          setState({
            loading: false,
            authenticated: false,
            entitled: false,
            error: "not_authenticated",
            entitlementSource: null,
          });
        } else if (res.status === 403) {
          // Has session but lacks entitlement (blocked at middleware level)
          setState({
            loading: false,
            authenticated: true,
            entitled: false,
            error: "not_entitled",
            entitlementSource: null,
          });
        } else {
          setState({
            loading: false,
            authenticated: false,
            entitled: false,
            error: "network_error",
            entitlementSource: null,
          });
        }
      } catch {
        if (cancelled) return;
        setState({
          loading: false,
          authenticated: false,
          entitled: false,
          error: "network_error",
          entitlementSource: null,
        });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
