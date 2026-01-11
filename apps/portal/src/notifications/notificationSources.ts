// apps/portal/src/notifications/notificationSources.ts
// Aggregates recent activity from existing API endpoints into unified Notification format.
// Notifications are ephemeral and derived at render time, no persistence.

import * as React from "react";
import { getCapability, setCapability, capabilityKeys } from "../derived/capabilities";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

// Type for the fetch function we'll use
type PortalFetchFn = <T>(endpoint: string, options?: RequestInit) => Promise<T>;

// Notification types derived from existing data
export type NotificationType =
  | "message_received"
  | "invoice_issued"
  | "invoice_overdue"
  | "agreement_sent"
  | "agreement_signed"
  | "offspring_ready";

// Unified notification interface
export interface Notification {
  id: string; // Composite key: type-sourceId
  type: NotificationType;
  title: string;
  timestamp: string; // ISO datetime
  href: string; // Link to source page
  sourceId: string | number; // Original entity ID
}

// Helper to check if timestamp is within last N days
function isWithinDays(timestamp: string | null, days: number): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

// Fetch invoice notifications (issued or overdue in last 7 days)
async function fetchInvoiceNotifications(portalFetch: PortalFetchFn): Promise<Notification[]> {
  // Check capability gate first
  if (!getCapability(capabilityKeys.invoices_enabled)) {
    return [];
  }

  try {
    const res = await portalFetch<{ invoices: any[] }>("/portal/invoices");
    const invoices = res?.invoices || [];
    const notifications: Notification[] = [];

    for (const inv of invoices) {
      const status = inv.status?.toLowerCase();
      // Invoice issued notification
      if ((status === "issued" || status === "sent") && isWithinDays(inv.issuedAt || inv.createdAt, 7)) {
        notifications.push({
          id: `invoice_issued-${inv.id}`,
          type: "invoice_issued",
          title: `Invoice #${inv.invoiceNumber} issued`,
          timestamp: inv.issuedAt || inv.createdAt,
          href: `/financials?invoice=${inv.id}`,
          sourceId: inv.id,
        });
      }

      // Invoice overdue notification
      if (status === "overdue" && inv.dueAt && isWithinDays(inv.dueAt, 7)) {
        notifications.push({
          id: `invoice_overdue-${inv.id}`,
          type: "invoice_overdue",
          title: `Invoice #${inv.invoiceNumber} is overdue`,
          timestamp: inv.dueAt,
          href: `/financials?invoice=${inv.id}`,
          sourceId: inv.id,
        });
      }
    }

    return notifications;
  } catch (err: any) {
    const status = err?.status;
    if (status === 401 || status === 403) {
      setCapability(capabilityKeys.invoices_enabled, false);
      console.warn("[notificationSources] Invoice endpoint unavailable, disabling for session");
    } else {
      console.warn("[notificationSources] Invoice source error:", err.message || err);
    }
    return [];
  }
}

// Fetch agreement notifications (sent or signed in last 7 days)
async function fetchAgreementNotifications(portalFetch: PortalFetchFn): Promise<Notification[]> {
  try {
    const res = await portalFetch<{ agreements: any[] }>("/portal/agreements");
    const agreements = res?.agreements || [];
    const notifications: Notification[] = [];

    for (const agr of agreements) {
      // Agreement sent notification
      if (agr.status === "sent" && isWithinDays(agr.createdAt, 7)) {
        notifications.push({
          id: `agreement_sent-${agr.id}`,
          type: "agreement_sent",
          title: `Agreement "${agr.name}" sent for review`,
          timestamp: agr.createdAt,
          href: `/agreements/${agr.id}`,
          sourceId: agr.id,
        });
      }

      // Agreement signed notification
      if (agr.status === "signed" && agr.signedAt && isWithinDays(agr.signedAt, 7)) {
        notifications.push({
          id: `agreement_signed-${agr.id}`,
          type: "agreement_signed",
          title: `Agreement "${agr.name}" has been signed`,
          timestamp: agr.signedAt,
          href: `/agreements/${agr.id}`,
          sourceId: agr.id,
        });
      }
    }

    return notifications;
  } catch (err: any) {
    console.error("[notificationSources] Failed to fetch agreement notifications:", err);
    return [];
  }
}

// Fetch offspring notifications (ready for pickup in last 7 days)
async function fetchOffspringNotifications(portalFetch: PortalFetchFn): Promise<Notification[]> {
  try {
    const res = await portalFetch<{ placements: any[] }>("/portal/placements");
    const placements = res?.placements || [];
    const notifications: Notification[] = [];

    for (const pl of placements) {
      // Offspring ready for pickup notification
      if (pl.placementStatus === "READY_FOR_PICKUP" && isWithinDays(pl.createdAt, 7)) {
        const offspringName = pl.offspring?.name || "Unnamed offspring";
        notifications.push({
          id: `offspring_ready-${pl.id}`,
          type: "offspring_ready",
          title: `${offspringName} is ready for pickup`,
          timestamp: pl.createdAt,
          href: `/offspring/${pl.offspring?.id || pl.id}`,
          sourceId: pl.id,
        });
      }
    }

    return notifications;
  } catch (err: any) {
    console.error("[notificationSources] Failed to fetch offspring notifications:", err);
    return [];
  }
}

// Fetch message notifications (new messages in last 7 days)
async function fetchMessageNotifications(portalFetch: PortalFetchFn): Promise<Notification[]> {
  try {
    const res = await portalFetch<{ threads: any[] }>("/messages/threads");
    const threads = res?.threads || [];
    const notifications: Notification[] = [];

    for (const thread of threads) {
      // New message notification (unread count > 0 and recent activity)
      if (thread.unreadCount && thread.unreadCount > 0) {
        const lastActivity = thread.updatedAt || thread.createdAt;
        if (isWithinDays(lastActivity, 7)) {
          notifications.push({
            id: `message_received-${thread.id}`,
            type: "message_received",
            title: `New message in "${thread.subject || "conversation"}"`,
            timestamp: lastActivity,
            href: `/messages/${thread.id}`,
            sourceId: thread.id,
          });
        }
      }
    }

    return notifications;
  } catch (err: any) {
    console.error("[notificationSources] Failed to fetch message notifications:", err);
    return [];
  }
}

// Aggregate all notification sources
export async function fetchAllNotifications(tenantSlug: string | null): Promise<Notification[]> {
  // Create a bound fetch function with the tenant slug
  const portalFetch = createPortalFetch(tenantSlug);

  // Run all sources in parallel, each handles its own errors
  const [invoiceNotifs, agreementNotifs, offspringNotifs, messageNotifs] =
    await Promise.all([
      fetchInvoiceNotifications(portalFetch),
      fetchAgreementNotifications(portalFetch),
      fetchOffspringNotifications(portalFetch),
      fetchMessageNotifications(portalFetch),
    ]);

  const allNotifications = [
    ...invoiceNotifs,
    ...agreementNotifs,
    ...offspringNotifs,
    ...messageNotifs,
  ];

  // Deduplicate by id (composite key ensures uniqueness)
  const seen = new Set<string>();
  const deduplicated = allNotifications.filter((notif) => {
    if (seen.has(notif.id)) return false;
    seen.add(notif.id);
    return true;
  });

  // Sort by timestamp (most recent first)
  deduplicated.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return deduplicated;
}

// Hook for use in React components
export function usePortalNotifications() {
  const { tenantSlug, isReady } = useTenantContext();
  const [notifications, setNotifications] = React.useState<(Notification & { read?: boolean })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Wait for tenant context to be ready before fetching
    if (!isReady) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchAllNotifications(tenantSlug);
        if (cancelled) return;

        setNotifications(result);
      } catch (err: any) {
        if (cancelled) return;
        console.error("[usePortalNotifications] Failed to fetch notifications:", err);
        setError(err?.message || "Failed to load notifications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, isReady]);

  return { notifications, loading, error };
}
