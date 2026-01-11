// apps/portal/src/hooks/useUnreadMessageCount.ts
// Hook to fetch unread message count for the portal notification badge.

import * as React from "react";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

interface UseUnreadMessageCountResult {
  unreadCount: number;
  loading: boolean;
}

/**
 * Fetches the total unread message count across all threads.
 * Polls every 30 seconds to keep the badge updated.
 */
export function useUnreadMessageCount(): UseUnreadMessageCountResult {
  const { tenantSlug, isReady } = useTenantContext();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Wait for tenant context to be ready
    if (!isReady) return;

    let cancelled = false;
    const portalFetch = createPortalFetch(tenantSlug);

    async function fetchUnreadCount() {
      try {
        const data = await portalFetch<{ threads: any[] }>("/messages/threads");
        if (cancelled) return;

        const threads = data.threads || [];
        const total = threads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
        setUnreadCount(total);
      } catch (err) {
        // Silently ignore errors for badge - not critical
        if (import.meta.env.DEV) {
          console.warn("[useUnreadMessageCount] Failed to fetch:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tenantSlug, isReady]);

  return { unreadCount, loading };
}
