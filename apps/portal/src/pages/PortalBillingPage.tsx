// apps/portal/src/pages/PortalBillingPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { makeApi } from "@bhq/api";
import type { InvoiceDTO, InvoiceStatus } from "@bhq/api";

/* ───────────────── API Setup ───────────────── */

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

/* ───────────────── Helpers ───────────────── */

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ───────────────── Invoice Row ───────────────── */

function InvoiceRow({ invoice }: { invoice: InvoiceDTO }) {
  const statusVariants: Record<InvoiceStatus, "neutral" | "amber" | "green" | "red"> = {
    DRAFT: "neutral",
    ISSUED: "amber",
    PARTIALLY_PAID: "amber",
    PAID: "green",
    OVERDUE: "red",
    VOID: "neutral",
  };

  const statusLabels: Record<InvoiceStatus, string> = {
    DRAFT: "Draft",
    ISSUED: "Issued",
    PARTIALLY_PAID: "Partial",
    PAID: "Paid",
    OVERDUE: "Overdue",
    VOID: "Void",
  };

  const handleViewInvoice = () => {
    // Navigate to canonical Finance invoices page
    window.location.href = `/finance/invoices?invoice=${invoice.id}`;
  };

  const isPending = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status);
  const balanceDue = invoice.balanceCents ?? (invoice.totalCents - invoice.paidCents);

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariants[invoice.status]}>
              {statusLabels[invoice.status]}
            </Badge>
            <span className="text-sm font-medium text-primary">
              #{invoice.invoiceNumber}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-secondary">Issued:</span>{" "}
              <span className="text-primary">{formatDate(invoice.issuedAt)}</span>
            </div>
            <div>
              <span className="text-secondary">Due:</span>{" "}
              <span className="text-primary">{formatDate(invoice.dueAt)}</span>
            </div>
            <div>
              <span className="text-secondary">Total:</span>{" "}
              <span className="text-primary">{formatCurrency(invoice.totalCents)}</span>
            </div>
            {isPending && balanceDue > 0 && (
              <div>
                <span className="text-secondary">Balance:</span>{" "}
                <span className="text-primary font-medium">{formatCurrency(balanceDue)}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleViewInvoice}>
          View Invoice
        </Button>
      </div>
    </div>
  );
}

/* ───────────────── Empty State ───────────────── */

function EmptyInvoices() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-3xl">
        💳
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">No invoices</h3>
      <p className="text-sm text-secondary max-w-sm mx-auto">
        When you have invoices or payments due, they will appear here.
      </p>
    </div>
  );
}

/* ───────────────── Loading State ───────────────── */

function LoadingInvoices() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-strong flex items-center justify-center text-2xl animate-pulse">
        💳
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">Loading invoices...</h3>
      <p className="text-sm text-secondary">Fetching your billing history</p>
    </div>
  );
}

/* ───────────────── Hook ───────────────── */

function useInvoices() {
  const [invoices, setInvoices] = React.useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await api.finance.invoices.list({ limit: 100 });
        if (cancelled) return;

        // Filter out DRAFT and VOID invoices for portal view
        const visible = (res?.items || []).filter(
          (inv) => !["DRAFT", "VOID"].includes(inv.status)
        );

        // Sort by status priority then by due date
        visible.sort((a, b) => {
          const statusPriority: Record<InvoiceStatus, number> = {
            OVERDUE: 0,
            ISSUED: 1,
            PARTIALLY_PAID: 2,
            PAID: 3,
            DRAFT: 4,
            VOID: 5,
          };
          const pa = statusPriority[a.status] ?? 4;
          const pb = statusPriority[b.status] ?? 4;
          if (pa !== pb) return pa - pb;

          // Then by due date (soonest first)
          if (a.dueAt && b.dueAt) {
            return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
          }
          if (a.dueAt && !b.dueAt) return -1;
          if (!a.dueAt && b.dueAt) return 1;
          return 0;
        });

        setInvoices(visible);
      } catch (err: any) {
        if (cancelled) return;
        console.error("[PortalBillingPage] Failed to fetch invoices:", err);
        setError(err?.message || "Failed to load invoices");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { invoices, loading, error };
}

/* ───────────────── Main Component ───────────────── */

export default function PortalBillingPage() {
  const { invoices, loading, error } = useInvoices();

  const pendingInvoices = invoices.filter((inv) =>
    ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status)
  );
  const pendingCount = pendingInvoices.length;
  const totalPendingCents = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.balanceCents ?? (inv.totalCents - inv.paidCents)),
    0
  );

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const getSubtitle = () => {
    if (loading) return "Loading...";
    if (invoices.length === 0) return "No invoices";
    if (pendingCount === 0) return "No outstanding balance";
    return `${pendingCount} pending invoice${pendingCount !== 1 ? "s" : ""} totaling ${formatCurrency(totalPendingCents)}`;
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Billing and Transactions"
        subtitle={getSubtitle()}
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <LoadingInvoices />
        ) : invoices.length === 0 ? (
          <EmptyInvoices />
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <InvoiceRow key={String(invoice.id)} invoice={invoice} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
