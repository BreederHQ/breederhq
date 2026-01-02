// apps/portal/src/notifications/notificationSources.ts
// Aggregates recent activity from existing API endpoints into unified Notification format.
// Notifications are ephemeral and derived at render time, no persistence.

import { makeApi } from "@bhq/api";
import type { InvoiceDTO, AgreementDTO, OffspringPlacementDTO } from "@bhq/api";
import { getCapability, setCapability, capabilityKeys } from "../derived/capabilities";

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

// Resolve API base URL (same pattern as taskSources)
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  if (envBase.trim()) {
    return normalizeBase(envBase);
  }
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  if (windowBase) {
    return normalizeBase(windowBase);
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const api = makeApi(getApiBase());

// Helper to check if timestamp is within last N days
function isWithinDays(timestamp: string | null, days: number): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

// Single-flight promise cache for invoice notifications
let invoiceNotificationsPromise: Promise<Notification[]> | null = null;

// Fetch invoice notifications (issued or overdue in last 7 days)
async function fetchInvoiceNotifications(): Promise<Notification[]> {
  // Check capability gate first
  if (!getCapability(capabilityKeys.invoices_enabled)) {
    // Capability disabled, short-circuit without network request
    return [];
  }

  // Single-flight: if already fetching, return existing promise
  if (invoiceNotificationsPromise) {
    return invoiceNotificationsPromise;
  }

  // Create new promise
  invoiceNotificationsPromise = (async () => {
    try {
      const res = await api.finance.invoices.list({ limit: 100 });
    const invoices = res?.items || [];
    const notifications: Notification[] = [];

    for (const inv of invoices) {
      // Invoice issued notification
      if (inv.status === "ISSUED" && isWithinDays(inv.createdAt, 7)) {
        notifications.push({
          id: `invoice_issued-${inv.id}`,
          type: "invoice_issued",
          title: `Invoice #${inv.invoiceNumber} issued`,
          timestamp: inv.createdAt,
          href: `/finance/invoices/${inv.id}`,
          sourceId: inv.id,
        });
      }

      // Invoice overdue notification
      if (inv.status === "OVERDUE" && inv.dueAt && isWithinDays(inv.dueAt, 7)) {
        notifications.push({
          id: `invoice_overdue-${inv.id}`,
          type: "invoice_overdue",
          title: `Invoice #${inv.invoiceNumber} is overdue`,
          timestamp: inv.dueAt,
          href: `/finance/invoices/${inv.id}`,
          sourceId: inv.id,
        });
      }
    }

      return notifications;
    } catch (err: any) {
      // Gracefully handle 401/403 (actor context issues in portal CLIENT context)
      const status = err?.response?.status || err?.status;
      const errorCode = err?.response?.data?.error?.code || err?.code;
      if (status === 401 || status === 403 || errorCode === "ACTOR_CONTEXT_UNRESOLVABLE") {
        // Disable capability to prevent future attempts
        setCapability(capabilityKeys.invoices_enabled, false);
        // Log once, then silent
        console.warn("[notificationSources] Invoice endpoint unavailable in CLIENT context, disabling for session");
        return [];
      }
      // Log other errors but don't break
      console.warn("[notificationSources] Invoice source error:", err.message || err);
      return [];
    } finally {
      // Clear single-flight cache after request completes
      invoiceNotificationsPromise = null;
    }
  })();

  return invoiceNotificationsPromise;
}

// Fetch agreement notifications (sent or signed in last 7 days)
async function fetchAgreementNotifications(): Promise<Notification[]> {
  try {
    const res = await api.portalData.getAgreements();
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
          href: `/portal/agreements/${agr.id}`,
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
          href: `/portal/agreements/${agr.id}`,
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
async function fetchOffspringNotifications(): Promise<Notification[]> {
  try {
    const res = await api.portalData.getOffspringPlacements();
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
          href: `/portal/offspring/${pl.offspring?.id || pl.id}`,
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
async function fetchMessageNotifications(): Promise<Notification[]> {
  try {
    const res = await api.messages.threads.list();
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
            href: `/portal/messages/${thread.id}`,
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
export async function fetchAllNotifications(): Promise<Notification[]> {
  // Run all sources in parallel, each handles its own errors
  const [invoiceNotifs, agreementNotifs, offspringNotifs, messageNotifs] =
    await Promise.all([
      fetchInvoiceNotifications(),
      fetchAgreementNotifications(),
      fetchOffspringNotifications(),
      fetchMessageNotifications(),
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

// Demo mode mock notifications
interface MockNotification extends Notification {
  read: boolean;
}

function getMockNotifications(): MockNotification[] {
  return [
    {
      id: "mock-notif-1",
      type: "message_received",
      title: "New message from Sarah Thompson",
      timestamp: "2026-01-01T10:30:00Z",
      href: "/portal/messages?threadId=1",
      sourceId: 1,
      read: false,
    },
    {
      id: "mock-notif-2",
      type: "agreement_sent",
      title: "Action required: Sign Health Guarantee",
      timestamp: "2025-12-31T09:00:00Z",
      href: "/portal/agreements/2",
      sourceId: 2,
      read: false,
    },
    {
      id: "mock-notif-3",
      type: "invoice_issued",
      title: "Final payment due: $2,000",
      timestamp: "2025-12-30T14:00:00Z",
      href: "/portal/billing",
      sourceId: 1,
      read: false,
    },
    {
      id: "mock-notif-4",
      type: "offspring_ready",
      title: "Bella's pickup window confirmed",
      timestamp: "2025-12-28T11:00:00Z",
      href: "/portal/offspring/101",
      sourceId: 101,
      read: true,
    },
    {
      id: "mock-notif-5",
      type: "message_received",
      title: "New photos of Bella uploaded",
      timestamp: "2025-12-27T16:20:00Z",
      href: "/portal/messages?threadId=1",
      sourceId: 1,
      read: true,
    },
    {
      id: "mock-notif-6",
      type: "agreement_signed",
      title: "Contract signed successfully",
      timestamp: "2025-12-12T14:30:00Z",
      href: "/portal/agreements/1",
      sourceId: 1,
      read: true,
    },
  ];
}

// Hook for use in React components
export function usePortalNotifications() {
  const [notifications, setNotifications] = React.useState<(Notification & { read?: boolean })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchAllNotifications();
        if (cancelled) return;

        // If no real notifications and demo mode enabled, use mock data
        const { isPortalMockEnabled } = await import("../dev/mockFlag");
        if (result.length === 0 && isPortalMockEnabled()) {
          setNotifications(getMockNotifications());
        } else {
          setNotifications(result);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("[usePortalNotifications] Failed to fetch notifications:", err);

        // On error in demo mode, use mock data
        const { isPortalMockEnabled } = await import("../dev/mockFlag");
        if (isPortalMockEnabled()) {
          setNotifications(getMockNotifications());
          setError(null);
        } else {
          setError(err?.message || "Failed to load notifications");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { notifications, loading, error };
}

// Need to import React for the hook
import * as React from "react";
