// apps/portal/src/components/AuthGate.tsx
// Hard auth gate for Portal. Blocks ALL render until session is verified.
// Enforces CLIENT role. Redirects unauthenticated users to /login.
// Blocks non-CLIENT users at /blocked.
// Provides tenant context to children via TenantProvider.

import * as React from "react";
import { Skeleton } from "../design/Skeleton";
import { HeaderBar } from "../design/HeaderBar";
import { PageContainer } from "../design/PageContainer";
import { setTenantContext, TenantProvider } from "../derived/tenantContext";

interface AuthGateProps {
  children: React.ReactNode;
  publicPaths?: string[];
}

interface TenantData {
  id: number;
  slug: string | null;
}

interface SessionCheckResult {
  status: "loading" | "authenticated" | "unauthenticated" | "blocked";
  error?: string;
  tenant?: TenantData | null;
}

/**
 * Check if current path matches any public path pattern.
 * Supports exact matches and prefix matches (e.g., /activate matches /activate?token=xxx)
 * Also handles tenant-prefixed paths (e.g., /t/tatooine/blocked -> /blocked)
 */
function isPublicPath(pathname: string, publicPaths: string[]): boolean {
  let normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  // Strip tenant prefix if present (e.g., /t/tatooine/blocked -> /blocked)
  const tenantPrefixMatch = normalizedPath.match(/^\/t\/[^/]+(.*)$/);
  if (tenantPrefixMatch) {
    normalizedPath = tenantPrefixMatch[1] || "/";
  }

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
        return { status: "unauthenticated", error: "no_user", tenant: null };
      }

      // Extract tenant data from session response
      const tenant: TenantData | null = data.tenant
        ? { id: data.tenant.id, slug: data.tenant.slug ?? null }
        : null;

      // Also set module-level cache for non-React consumers
      if (tenant) {
        setTenantContext(tenant.id, tenant.slug);
      }

      // Check for CLIENT role in memberships
      // Use membershipRole (new field) instead of role (legacy field)
      const memberships = data.memberships || [];
      const hasClientRole = memberships.some(
        (m: any) => m.membershipRole?.toUpperCase() === "CLIENT" && m.membershipStatus?.toUpperCase() === "ACTIVE"
      );

      if (!hasClientRole) {
        return { status: "blocked", error: "not_client", tenant };
      }

      return { status: "authenticated", tenant };
    }

    if (res.status === 401 || res.status === 403) {
      return { status: "unauthenticated", error: `http_${res.status}`, tenant: null };
    }

    return { status: "unauthenticated", error: `http_${res.status}`, tenant: null };
  } catch (err: any) {
    console.error("[AuthGate] Session check failed:", err);
    return { status: "unauthenticated", error: "network_error", tenant: null };
  }
}

/**
 * Extract tenant slug from current URL path.
 * Pattern: /t/:tenantSlug/...
 */
function getTenantSlug(): string | null {
  const match = window.location.pathname.match(/^\/t\/([^/]+)/);
  return match ? match[1] : null;
}

function redirectToLogin(): void {
  const currentPath = window.location.pathname + window.location.search;
  const returnUrl = encodeURIComponent(currentPath);
  const slug = getTenantSlug();
  // Preserve tenant prefix in redirect
  const loginPath = slug ? `/t/${slug}/login` : "/login";
  window.location.replace(`${loginPath}?returnUrl=${returnUrl}`);
}

function redirectToBlocked(): void {
  const slug = getTenantSlug();
  // Preserve tenant prefix in redirect
  const blockedPath = slug ? `/t/${slug}/blocked` : "/blocked";
  window.location.replace(blockedPath);
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

// How often to re-check session validity (in ms)
const SESSION_CHECK_INTERVAL = 30000; // 30 seconds

export function AuthGate({ children, publicPaths = [] }: AuthGateProps) {
  const [sessionState, setSessionState] = React.useState<SessionCheckResult>({
    status: "loading",
    tenant: null,
  });

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPublic = isPublicPath(pathname, publicPaths);

  // Initial session check
  React.useEffect(() => {
    if (isPublic) {
      setSessionState({ status: "authenticated", tenant: null });
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

  // Periodic session check to detect suspensions
  React.useEffect(() => {
    if (isPublic || sessionState.status !== "authenticated") {
      return;
    }

    const intervalId = setInterval(async () => {
      const result = await checkSession();
      if (result.status !== "authenticated") {
        console.log("[AuthGate] Session invalidated, redirecting...");
        setSessionState(result);
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isPublic, sessionState.status]);

  // Public paths render immediately (no tenant context needed)
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

  // Authenticated CLIENT - render children wrapped with TenantProvider
  // This ensures all children have access to tenant context via useTenantContext()
  return (
    <TenantProvider
      tenantId={sessionState.tenant?.id ?? null}
      tenantSlug={sessionState.tenant?.slug ?? null}
    >
      {children}
    </TenantProvider>
  );
}

export default AuthGate;
