// apps/marketplace/src/gate/MarketplaceGate.tsx
import * as React from "react";
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
  | { status: "error" };

interface MeResponse {
  authenticated: boolean;
  entitled: boolean;
  entitlementSource: "platform" | "marketplace" | "none";
}

/**
 * Single source of truth for marketplace access gating.
 * Checks /api/v1/marketplace/me and renders appropriate state.
 */
export function MarketplaceGate() {
  const [state, setState] = React.useState<GateState>({ status: "loading" });

  const checkAccess = React.useCallback(async () => {
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/v1/marketplace/me", {
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
        setState({ status: "error" });
        return;
      }

      // Try to parse response body
      let data: MeResponse | undefined;
      try {
        data = await res.json();
      } catch {
        setState({ status: "error" });
        return;
      }

      // Check authentication from body
      if (!data?.authenticated) {
        setState({ status: "unauthenticated" });
        return;
      }

      // Check entitlement from body
      if (!data?.entitled) {
        setState({ status: "not_entitled" });
        return;
      }

      // All good
      setState({ status: "entitled" });
    } catch {
      // Network error
      setState({ status: "error" });
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
    return <FullPageError onRetry={checkAccess} />;
  }

  // Unauthenticated - show auth page
  if (state.status === "unauthenticated") {
    return <MarketplaceAuthPage />;
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
