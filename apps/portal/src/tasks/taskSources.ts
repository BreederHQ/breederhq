// apps/portal/src/tasks/taskSources.ts
// Aggregates actionable items from existing API endpoints into unified TaskCard format.
// Each source is a pure function that fetches and transforms data.

import { makeApi } from "@bhq/api";
import type { InvoiceDTO, AgreementDTO, OffspringPlacementDTO, ContractStatus, PlacementStatus } from "@bhq/api";
import { buildInvoiceHref } from "../links";

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

// Resolve API base URL (same pattern as MessagesPage/PortalDashboard)
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
    // Use relative path so Vite proxy handles it (preserves cookies)
    // Return empty string since resource paths already include /api/v1
    return "";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  // Strip trailing slashes and /api/v1 suffix since resource paths include it
  return base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

const api = makeApi(getApiBase());

// Format currency from cents
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// Check if a date is overdue
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due < now;
}

// Invoice task source
// Fetches invoices with status ISSUED, PARTIALLY_PAID, or OVERDUE
async function fetchInvoiceTasks(): Promise<TaskCard[]> {
  try {
    // Fetch all invoices and filter client-side for actionable ones
    const res = await api.finance.invoices.list({ limit: 100 });
    const invoices = res?.items || [];

    // Filter to actionable statuses (unpaid invoices that need attention)
    const actionable = invoices.filter((inv: InvoiceDTO) =>
      ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status)
    );

    return actionable.map((inv: InvoiceDTO): TaskCard => {
      const overdue = inv.status === "OVERDUE" || isOverdue(inv.dueAt);
      const remaining = inv.balanceCents ?? (inv.totalCents - inv.paidCents);

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

      // Check for linked message thread (not yet available in API)
      // When InvoiceDTO gains a threadId field, use buildThreadHref() here
      const hasThreadLink = false; // Placeholder: (inv as any).threadId != null
      const secondaryAction = hasThreadLink
        ? { label: "Message", href: "/marketing/messages" } // Will use buildThreadHref(inv.threadId) when available
        : null;

      return {
        id: `invoice-${inv.id}`,
        type: "invoice",
        title: `Invoice #${inv.invoiceNumber}`,
        subtitle: `${formatCurrency(remaining)} due`,
        dueAt: inv.dueAt,
        status: overdue ? "overdue" : "pending",
        ctaLabel: "View Invoice",
        href: buildInvoiceHref(inv.id),
        secondaryAction,
        note: noteText,
        urgency: overdue ? "action_required" : "upcoming",
      };
    });
  } catch (err: any) {
    // Gracefully handle 401/403 (actor context issues in portal CLIENT context)
    const status = err?.response?.status || err?.status;
    const errorCode = err?.response?.data?.error?.code || err?.code;
    if (status === 401 || status === 403 || errorCode === "ACTOR_CONTEXT_UNRESOLVABLE") {
      // Source unavailable in this context, return empty silently
      return [];
    }
    // Log other errors but don't break
    console.warn("[taskSources] Invoice source unavailable:", err.message || err);
    return [];
  }
}

// Agreement task source
// Fetches agreements with status "sent" or "viewed" (unsigned/pending)
async function fetchContractTasks(): Promise<TaskCard[]> {
  try {
    const res = await api.portalData.getAgreements();
    const agreements = res?.agreements || [];

    // Filter to actionable statuses (unsigned agreements that need attention)
    const actionable = agreements.filter((agr: AgreementDTO) =>
      ["sent", "viewed"].includes(agr.status)
    );

    return actionable.map((agr: AgreementDTO): TaskCard => {
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
        href: `/portal/agreements/${agr.id}`,
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

// Appointment task source (placeholder, no endpoint exists yet)
async function fetchAppointmentTasks(): Promise<TaskCard[]> {
  // No scheduling/appointments endpoint exists yet
  return [];
}

// Document task source (placeholder, no endpoint exists yet)
async function fetchDocumentTasks(): Promise<TaskCard[]> {
  // No documents endpoint exists yet
  return [];
}

// Offspring task source
// Fetches offspring with placement status READY_FOR_PICKUP or FULLY_PAID
async function fetchOffspringTasks(): Promise<TaskCard[]> {
  try {
    const res = await api.portalData.getOffspringPlacements();
    const placements = res?.placements || [];

    // Filter to actionable statuses (ready for pickup or fully paid awaiting pickup)
    const actionable = placements.filter((pl: OffspringPlacementDTO) =>
      ["READY_FOR_PICKUP", "FULLY_PAID"].includes(pl.placementStatus)
    );

    return actionable.map((pl: OffspringPlacementDTO): TaskCard => {
      const isReadyForPickup = pl.placementStatus === "READY_FOR_PICKUP";
      const offspringName = pl.offspring?.name || "Unnamed offspring";
      const offspringLabel = pl.offspringGroupLabel || pl.offspringGroupCode;

      // Build descriptive subtitle
      let subtitle = offspringLabel;
      if (pl.offspring?.sex) {
        subtitle += ` - ${pl.offspring.sex}`;
      }

      // Build contextual note
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
        dueAt: null, // Offspring don't have strict due dates
        status: "upcoming",
        ctaLabel: "View Details",
        href: `/portal/offspring/${pl.offspring?.id || pl.id}`,
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
export async function fetchAllTasks(): Promise<{
  tasks: TaskCard[];
  sources: { name: string; available: boolean }[];
}> {
  // Run all sources in parallel, each handles its own errors
  const [invoiceTasks, contractTasks, appointmentTasks, documentTasks, offspringTasks] =
    await Promise.all([
      fetchInvoiceTasks(),
      fetchContractTasks(),
      fetchAppointmentTasks(),
      fetchDocumentTasks(),
      fetchOffspringTasks(),
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
    // Priority order: action_required > upcoming > completed
    const urgencyOrder = { action_required: 0, upcoming: 1, completed: 2 };
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    // Within same urgency, overdue items first
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;

    // Then by due date (soonest first)
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
  const [tasks, setTasks] = React.useState<TaskCard[]>([]);
  const [sources, setSources] = React.useState<
    { name: string; available: boolean }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchAllTasks();
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
  }, []);

  return { tasks, sources, loading, error };
}

// Need to import React for the hook
import * as React from "react";
