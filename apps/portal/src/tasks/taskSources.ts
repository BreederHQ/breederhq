// apps/portal/src/tasks/taskSources.ts
// Aggregates actionable items from existing API endpoints into unified TaskCard format.
// Each source is a pure function that fetches and transforms data.

import * as React from "react";
import { getCapability, setCapability, capabilityKeys } from "../derived/capabilities";
import { createPortalFetch, useTenantContext } from "../derived/tenantContext";

// Type for the fetch function we'll use
type PortalFetchFn = <T>(endpoint: string, options?: RequestInit) => Promise<T>;

// Secondary action for task cards (e.g., Message CTA)
export interface TaskSecondaryAction {
  label: string;
  href: string;
}

// Task card interface for unified display
export interface TaskCard {
  id: string;
  type: "invoice" | "contract" | "appointment" | "document" | "offspring";
  title: string;
  subtitle: string;
  dueAt: string | null;
  status: "pending" | "overdue" | "upcoming";
  ctaLabel: string;
  href: string;
  // Optional secondary action (e.g., link to message thread)
  secondaryAction?: TaskSecondaryAction | null;
  // Optional note shown below subtitle
  note?: string | null;
  // Urgency level for grouping
  urgency: "action_required" | "upcoming" | "completed";
}

// Format currency (portal API returns dollars, not cents)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Check if a date is overdue
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due < now;
}

// Invoice task source
async function fetchInvoiceTasks(portalFetch: PortalFetchFn): Promise<TaskCard[]> {
  // Check capability gate first
  if (!getCapability(capabilityKeys.invoices_enabled)) {
    return [];
  }

  try {
    const res = await portalFetch<{ invoices: any[] }>("/portal/invoices");
    const invoices = res?.invoices || [];

    // Filter to actionable statuses (unpaid invoices that need attention)
    const actionable = invoices.filter((inv: any) => {
      const status = inv.status?.toLowerCase();
      return ["issued", "partially_paid", "overdue", "sent"].includes(status);
    });

    return actionable.map((inv: any): TaskCard => {
      const status = inv.status?.toLowerCase();
      const overdue = status === "overdue" || isOverdue(inv.dueAt);
      const remaining = inv.amountDue ?? (inv.total - (inv.amountPaid || 0));

      // Calculate days to due for note
      let noteText: string | null = null;
      if (inv.dueAt) {
        const due = new Date(inv.dueAt);
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const daysToDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysToDue < 0) {
          const daysOverdue = Math.abs(daysToDue);
          noteText = `Past due by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`;
        } else if (daysToDue === 0) {
          noteText = "Due today";
        } else if (daysToDue === 1) {
          noteText = "Due tomorrow";
        } else if (daysToDue <= 7) {
          noteText = `Due in ${daysToDue} days`;
        }
      }

      return {
        id: `invoice-${inv.id}`,
        type: "invoice",
        title: `Invoice #${inv.invoiceNumber}`,
        subtitle: `${formatCurrency(remaining)} due`,
        dueAt: inv.dueAt,
        status: overdue ? "overdue" : "pending",
        ctaLabel: "View Invoice",
        href: `/financials?invoice=${inv.id}`,
        secondaryAction: null,
        note: noteText,
        urgency: overdue ? "action_required" : "upcoming",
      };
    });
  } catch (err: any) {
    const status = err?.status;
    if (status === 401 || status === 403) {
      setCapability(capabilityKeys.invoices_enabled, false);
      console.warn("[taskSources] Invoice endpoint unavailable, disabling for session");
    } else {
      console.warn("[taskSources] Invoice source error:", err.message || err);
    }
    return [];
  }
}

// Agreement task source
async function fetchContractTasks(portalFetch: PortalFetchFn): Promise<TaskCard[]> {
  try {
    const res = await portalFetch<{ agreements: any[] }>("/portal/agreements");
    const agreements = res?.agreements || [];

    // Filter to actionable statuses (unsigned agreements that need attention)
    const actionable = agreements.filter((agr: any) =>
      ["sent", "viewed"].includes(agr.status)
    );

    return actionable.map((agr: any): TaskCard => {
      const overdue = isOverdue(agr.expirationDate);

      // Calculate days until expiration for note
      let noteText: string | null = null;
      if (agr.expirationDate) {
        const exp = new Date(agr.expirationDate);
        const now = new Date();
        const diffMs = exp.getTime() - now.getTime();
        const daysToExp = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysToExp < 0) {
          noteText = "Agreement has expired";
        } else if (daysToExp === 0) {
          noteText = "Expires today";
        } else if (daysToExp === 1) {
          noteText = "Expires tomorrow";
        } else if (daysToExp <= 7) {
          noteText = `Expires in ${daysToExp} days`;
        } else if (agr.status === "viewed") {
          noteText = "You have viewed this agreement";
        } else if (agr.status === "sent") {
          noteText = "Waiting for your review";
        }
      } else if (agr.status === "viewed") {
        noteText = "You have viewed this agreement";
      } else if (agr.status === "sent") {
        noteText = "Waiting for your review";
      }

      return {
        id: `agreement-${agr.id}`,
        type: "contract",
        title: agr.name,
        subtitle: `${agr.role} - ${agr.status}`,
        dueAt: agr.expirationDate,
        status: overdue ? "overdue" : "pending",
        ctaLabel: "View Agreement",
        href: `/agreements/${agr.id}`,
        secondaryAction: null,
        note: noteText,
        urgency: overdue ? "action_required" : "upcoming",
      };
    });
  } catch (err: any) {
    console.error("[taskSources] Failed to fetch agreement tasks:", err);
    return [];
  }
}

// Appointment task source (placeholder)
async function fetchAppointmentTasks(_portalFetch: PortalFetchFn): Promise<TaskCard[]> {
  return [];
}

// Document task source (placeholder)
async function fetchDocumentTasks(_portalFetch: PortalFetchFn): Promise<TaskCard[]> {
  return [];
}

// Offspring task source
async function fetchOffspringTasks(portalFetch: PortalFetchFn): Promise<TaskCard[]> {
  try {
    const res = await portalFetch<{ placements: any[] }>("/portal/placements");
    const placements = res?.placements || [];

    // Filter to actionable statuses
    const actionable = placements.filter((pl: any) =>
      ["READY_FOR_PICKUP", "FULLY_PAID"].includes(pl.placementStatus)
    );

    return actionable.map((pl: any): TaskCard => {
      const isReadyForPickup = pl.placementStatus === "READY_FOR_PICKUP";
      const offspringName = pl.offspring?.name || "Unnamed offspring";
      const offspringLabel = pl.offspringGroupLabel || pl.offspringGroupCode;

      let subtitle = offspringLabel;
      if (pl.offspring?.sex) {
        subtitle += ` - ${pl.offspring.sex}`;
      }

      let noteText: string | null = null;
      if (isReadyForPickup) {
        noteText = "Ready for pickup - schedule with us";
      } else if (pl.placementStatus === "FULLY_PAID") {
        noteText = "Fully paid - awaiting pickup schedule";
      }

      return {
        id: `offspring-${pl.id}`,
        type: "offspring",
        title: offspringName,
        subtitle,
        dueAt: null,
        status: "upcoming",
        ctaLabel: "View Details",
        href: `/offspring/${pl.offspring?.id || pl.id}`,
        secondaryAction: null,
        note: noteText,
        urgency: isReadyForPickup ? "action_required" : "upcoming",
      };
    });
  } catch (err: any) {
    console.error("[taskSources] Failed to fetch offspring tasks:", err);
    return [];
  }
}

// Aggregate all task sources
export async function fetchAllTasks(tenantSlug: string | null): Promise<{
  tasks: TaskCard[];
  sources: { name: string; available: boolean }[];
}> {
  // Create a bound fetch function with the tenant slug
  const portalFetch = createPortalFetch(tenantSlug);

  // Run all sources in parallel
  const [invoiceTasks, contractTasks, appointmentTasks, documentTasks, offspringTasks] =
    await Promise.all([
      fetchInvoiceTasks(portalFetch),
      fetchContractTasks(portalFetch),
      fetchAppointmentTasks(portalFetch),
      fetchDocumentTasks(portalFetch),
      fetchOffspringTasks(portalFetch),
    ]);

  const allTasks = [
    ...invoiceTasks,
    ...contractTasks,
    ...appointmentTasks,
    ...documentTasks,
    ...offspringTasks,
  ];

  // Sort by urgency first, then by status (overdue first), then by dueAt
  allTasks.sort((a, b) => {
    const urgencyOrder = { action_required: 0, upcoming: 1, completed: 2 };
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;

    if (a.dueAt && b.dueAt) {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    }
    if (a.dueAt && !b.dueAt) return -1;
    if (!a.dueAt && b.dueAt) return 1;

    return 0;
  });

  return {
    tasks: allTasks,
    sources: [
      { name: "Invoices", available: true },
      { name: "Contracts", available: true },
      { name: "Appointments", available: false },
      { name: "Documents", available: false },
      { name: "Offspring", available: true },
    ],
  };
}

// Hook for use in React components
export function usePortalTasks() {
  const { tenantSlug, isReady } = useTenantContext();
  const [tasks, setTasks] = React.useState<TaskCard[]>([]);
  const [sources, setSources] = React.useState<{ name: string; available: boolean }[]>([]);
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
        const result = await fetchAllTasks(tenantSlug);
        if (cancelled) return;

        setTasks(result.tasks);
        setSources(result.sources);
      } catch (err: any) {
        if (cancelled) return;
        console.error("[usePortalTasks] Failed to fetch tasks:", err);
        setError(err?.message || "Failed to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, isReady]);

  return { tasks, sources, loading, error };
}
