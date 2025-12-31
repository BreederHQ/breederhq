// apps/portal/src/hooks/useSession.ts
// Hook to fetch and expose session data for the portal.
// Mirrors the session fetch pattern from App-Platform.tsx.

import * as React from "react";

export interface SessionUser {
  id: string;
  email?: string | null;
}

export interface SessionOrg {
  id: number;
  name?: string | null;
}

export interface SessionData {
  user?: SessionUser | null;
  org?: SessionOrg | null;
  memberships?: Array<{ organizationId: number; role?: string }>;
}

interface UseSessionResult {
  session: SessionData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch session data from /api/v1/session.
 * Returns user, org, and memberships info.
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = React.useState<SessionData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/v1/session", { credentials: "include" });
        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (res.ok && data) {
          setSession(data);
        } else {
          setSession(null);
          setError("Unable to load session");
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("[useSession] Failed to fetch session:", err);
        setError(err?.message || "Failed to load session");
        setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading, error };
}
