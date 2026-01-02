// apps/portal/src/components/AuthGate.tsx
// Hard auth gate for Portal. Blocks ALL render until session is verified.
// Enforces CLIENT role. Redirects unauthenticated users to /login.
// Blocks non-CLIENT users at /blocked.

import * as React from "react";
import { Skeleton } from "../design/Skeleton";
import { HeaderBar } from "../design/HeaderBar";
import { PageContainer } from "../design/PageContainer";

interface AuthGateProps {
  children: React.ReactNode;
  publicPaths?: string[];
}

interface SessionCheckResult {
  status: "loading" | "authenticated" | "unauthenticated" | "blocked";
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

async function checkSession(): Promise<SessionCheckResult> {
  try {
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

      if (!data?.user?.id) {
        return { status: "unauthenticated", error: "no_user" };
      }

      // Check for CLIENT role in memberships
      // Use membershipRole (new field) instead of role (legacy field)
      const memberships = data.memberships || [];
      const hasClientRole = memberships.some(
        (m: any) => m.membershipRole?.toUpperCase() === "CLIENT" && m.membershipStatus?.toUpperCase() === "ACTIVE"
      );

      if (!hasClientRole) {
        return { status: "blocked", error: "not_client" };
      }

      return { status: "authenticated" };
    }

    if (res.status === 401 || res.status === 403) {
      return { status: "unauthenticated", error: `http_${res.status}` };
    }

    return { status: "unauthenticated", error: `http_${res.status}` };
  } catch (err: any) {
    console.error("[AuthGate] Session check failed:", err);
    return { status: "unauthenticated", error: "network_error" };
  }
}

function redirectToLogin(): void {
  const currentPath = window.location.pathname + window.location.search;
  const returnUrl = encodeURIComponent(currentPath);
  window.location.replace(`/login?returnUrl=${returnUrl}`);
}

function redirectToBlocked(): void {
  window.location.replace("/blocked");
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--portal-bg)" }}>
      <HeaderBar>
        <Skeleton width="120px" height="24px" />
        <div style={{ flex: 1 }} />
        <Skeleton width="80px" height="24px" />
      </HeaderBar>
      <PageContainer>
        <Skeleton width="200px" height="32px" />
        <div style={{ marginTop: "var(--portal-space-4)" }}>
          <Skeleton width="100%" height="120px" />
        </div>
        <div style={{ marginTop: "var(--portal-space-3)" }}>
          <Skeleton width="100%" height="120px" />
        </div>
      </PageContainer>
    </div>
  );
}

export function AuthGate({ children, publicPaths = [] }: AuthGateProps) {
  const [sessionState, setSessionState] = React.useState<SessionCheckResult>({
    status: "loading",
  });

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPublic = isPublicPath(pathname, publicPaths);

  React.useEffect(() => {
    if (isPublic) {
      setSessionState({ status: "authenticated" });
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

  // Loading state - show skeleton
  if (sessionState.status === "loading") {
    return <LoadingSkeleton />;
  }

  // Blocked (non-CLIENT role) - redirect to /blocked
  if (sessionState.status === "blocked") {
    redirectToBlocked();
    return <LoadingSkeleton />;
  }

  // Unauthenticated - redirect to login
  if (sessionState.status === "unauthenticated") {
    redirectToLogin();
    return <LoadingSkeleton />;
  }

  // Authenticated CLIENT - render children
  return <>{children}</>;
}

export default AuthGate;
