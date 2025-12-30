// apps/portal/src/tasks/taskSources.ts
// Aggregates actionable items from existing API endpoints into unified TaskCard format.
// Each source is a pure function that fetches and transforms data.

import { makeApi } from "@bhq/api";
import type { InvoiceDTO } from "@bhq/api";
import { buildInvoiceHref } from "../links";

// Task card interface for unified display
export interface TaskCard {
  id: string;
  type: "invoice" | "contract" | "appointment" | "document";
  title: string;
  subtitle: string;
  dueAt: string | null;
  status: "pending" | "overdue" | "upcoming";
  ctaLabel: string;
  href: string;
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
    return "http://localhost:6001/api/v1";
  }
  return normalizeBase(window.location.origin);
}

function normalizeBase(base: string): string {
  const b = base.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
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

      return {
        id: `invoice-${inv.id}`,
        type: "invoice",
        title: `Invoice #${inv.invoiceNumber}`,
        subtitle: `${formatCurrency(remaining)} due`,
        dueAt: inv.dueAt,
        status: overdue ? "overdue" : "pending",
        ctaLabel: "View Invoice",
        href: buildInvoiceHref(inv.id),
      };
    });
  } catch (err: any) {
    console.error("[taskSources] Failed to fetch invoice tasks:", err);
    return [];
  }
}

// Contract/Agreement task source (placeholder, no endpoint exists yet)
async function fetchContractTasks(): Promise<TaskCard[]> {
  // No contracts/agreements endpoint exists yet
  return [];
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

// Aggregate all task sources
export async function fetchAllTasks(): Promise<{
  tasks: TaskCard[];
  sources: { name: string; available: boolean }[];
}> {
  // Run all sources in parallel, each handles its own errors
  const [invoiceTasks, contractTasks, appointmentTasks, documentTasks] =
    await Promise.all([
      fetchInvoiceTasks(),
      fetchContractTasks(),
      fetchAppointmentTasks(),
      fetchDocumentTasks(),
    ]);

  const allTasks = [
    ...invoiceTasks,
    ...contractTasks,
    ...appointmentTasks,
    ...documentTasks,
  ];

  // Sort by status (overdue first), then by dueAt
  allTasks.sort((a, b) => {
    // Overdue items first
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
      { name: "Contracts", available: false },
      { name: "Appointments", available: false },
      { name: "Documents", available: false },
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
