// apps/client-portal/src/components/AuthGate.tsx
// Hard auth gate for Client Portal. Blocks ALL render until session is verified.
// Unauthenticated users are redirected to /p/:orgSlug/login with returnUrl.

import * as React from "react";
import { useOrg } from "../context/OrgContext";

interface AuthGateProps {
  orgSlug: string;
  children: React.ReactNode;
}

interface SessionCheckResult {
  status: "loading" | "authenticated" | "unauthenticated";
  error?: string;
}

/**
 * Verify session with the API.
 * Returns authenticated if session is valid, unauthenticated if 401/403.
 */
async function checkSession(): Promise<SessionCheckResult> {
  try {
    // Add cache-busting timestamp to prevent any caching
    const res = await fetch(`/api/v1/session?_=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      // Verify we got actual user data, not just an empty response
      if (data?.user?.id) {
        return { status: "authenticated" };
      }
      // Session endpoint returned OK but no user - treat as unauthenticated
      return { status: "unauthenticated", error: "no_user" };
    }

    if (res.status === 401 || res.status === 403) {
      return { status: "unauthenticated", error: `http_${res.status}` };
    }

    // Other errors - treat as unauthenticated to be safe
    return { status: "unauthenticated", error: `http_${res.status}` };
  } catch (err: any) {
    console.error("[AuthGate] Session check failed:", err);
    // Network errors - treat as unauthenticated to be safe
    return { status: "unauthenticated", error: "network_error" };
  }
}

/**
 * AuthGate: Blocks render until session is verified.
 * Shows loading, then either children (authenticated) or redirects to login.
 */
export function AuthGate({ orgSlug, children }: AuthGateProps) {
  const { basePath } = useOrg();
  const [sessionState, setSessionState] = React.useState<SessionCheckResult>({
    status: "loading",
  });

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await checkSession();
      if (cancelled) return;
      setSessionState(result);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Loading state - show minimal spinner
  if (sessionState.status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-page text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[hsl(var(--brand-orange))] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-secondary">Verifying session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated - redirect to login
  if (sessionState.status === "unauthenticated") {
    // Build returnUrl from current path
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = encodeURIComponent(currentPath);
    const loginUrl = `${basePath}/login?returnUrl=${returnUrl}`;

    // Redirect
    window.location.replace(loginUrl);

    // Show brief message while redirecting
    return (
      <div className="min-h-screen grid place-items-center bg-page text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[hsl(var(--brand-orange))] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-secondary">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}

export default AuthGate;
