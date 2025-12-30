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
  membershipCount: number;
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

  // Derive org fields
  const orgName = session?.org?.name || null;
  const orgId = session?.org?.id ?? null;

  // Tenant ID from window global (set by App-Platform.tsx)
  const tenantId = typeof window !== "undefined"
    ? ((window as any).__BHQ_TENANT_ID__ as number | undefined) ?? null
    : null;

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
    membershipCount,
  };
}
