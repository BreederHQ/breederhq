// apps/portal/src/hooks/usePortalContext.ts
// Centralized session context for portal pages.
// Wraps useSession and derives common fields so pages do not parse session independently.

import { useSession, type SessionData } from "./useSession";

export interface PortalContext {
  // Raw session data
  session: SessionData | null;
  loading: boolean;
  error: string | null;

  // Derived fields for convenience
  userEmail: string | null;
  userInitial: string | null;
  orgName: string | null;
  orgId: number | null;
  tenantId: number | null;
  tenantSlug: string | null;
  membershipCount: number;
}

/**
 * Extract tenant slug from portal URL path.
 * Expected pattern: /t/:tenantSlug/...
 */
function getTenantSlugFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/t\/([a-z0-9][a-z0-9-]*)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Centralized portal context hook.
 * Calls useSession once and derives common fields for portal pages.
 */
export function usePortalContext(): PortalContext {
  const { session, loading, error } = useSession();

  // Derive user fields
  const userEmail = session?.user?.email || null;
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : null;

  // Derive org fields from tenant (backend returns tenant, not org)
  const orgName = session?.tenant?.name || null;
  const orgId = session?.tenant?.id ?? null;

  // Tenant ID from session or window global
  const tenantId = session?.tenant?.id ??
    (typeof window !== "undefined"
      ? ((window as any).__BHQ_TENANT_ID__ as number | undefined) ?? null
      : null);

  // Tenant slug: prefer session, fallback to URL path
  const tenantSlug = session?.tenant?.slug || getTenantSlugFromUrl();

  // Membership count
  const membershipCount = session?.memberships?.length ?? 0;

  return {
    session,
    loading,
    error,
    userEmail,
    userInitial,
    orgName,
    orgId,
    tenantId,
    tenantSlug,
    membershipCount,
  };
}
