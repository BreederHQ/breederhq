// apps/portal/src/components/AuthGate.tsx
// Hard auth gate for Portal. Blocks ALL render until session is verified.
// Unauthenticated users are redirected to /login with returnUrl.

import * as React from "react";

interface AuthGateProps {
  children: React.ReactNode;
  /** Routes that don't require auth (e.g., /activate, /login) */
  publicPaths?: string[];
}

interface SessionCheckResult {
  status: "loading" | "authenticated" | "unauthenticated";
  error?: string;
}

/**
 * Check if current path matches any public path pattern.
 * Supports exact matches and prefix matches (e.g., /activate matches /activate?token=xxx)
 */
function isPublicPath(pathname: string, publicPaths: string[]): boolean {
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  for (const publicPath of publicPaths) {
    const normalizedPublic = publicPath.toLowerCase().replace(/\/+$/, "") || "/";

    // Exact match
    if (normalizedPath === normalizedPublic) return true;

    // Prefix match (e.g., /activate matches /activate?token=xxx when normalized)
    if (normalizedPath.startsWith(normalizedPublic + "/")) return true;
    if (normalizedPath.startsWith(normalizedPublic + "?")) return true;
  }

  return false;
}

/**
 * Verify session with the API.
 * Returns authenticated if session is valid, unauthenticated if 401/403.
 */
async function checkSession(): Promise<SessionCheckResult> {
  try {
    const res = await fetch("/api/v1/session", {
      credentials: "include",
      cache: "no-store",
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
 * Redirect to login with returnUrl preserved.
 */
function redirectToLogin(): void {
  const currentPath = window.location.pathname + window.location.search;
  const returnUrl = encodeURIComponent(currentPath);
  window.location.replace(`/login?returnUrl=${returnUrl}`);
}

/**
 * AuthGate: Blocks render until session is verified.
 *
 * - On public paths: renders children immediately
 * - On protected paths: shows loading, then either children (authenticated) or redirects to /login
 */
export function AuthGate({ children, publicPaths = [] }: AuthGateProps) {
  const [sessionState, setSessionState] = React.useState<SessionCheckResult>({
    status: "loading",
  });

  // Determine if current path is public
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPublic = isPublicPath(pathname, publicPaths);

  React.useEffect(() => {
    // Skip auth check for public paths
    if (isPublic) {
      setSessionState({ status: "authenticated" }); // Allow render
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await checkSession();
      if (cancelled) return;
      setSessionState(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [isPublic]);

  // Public paths render immediately
  if (isPublic) {
    return <>{children}</>;
  }

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
    // Use effect to redirect to avoid render issues
    redirectToLogin();

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
