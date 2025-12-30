// apps/portal/src/pages/PortalBillingPage.tsx
import * as React from "react";
import { PageHeader, Button, Badge } from "@bhq/ui";
import { mockInvoices, type PortalInvoice } from "../mock";

/* ───────────────── Invoice Row ───────────────── */

function InvoiceRow({ invoice }: { invoice: PortalInvoice }) {
  const statusVariants: Record<PortalInvoice["status"], "amber" | "green" | "red"> = {
    pending: "amber",
    paid: "green",
    overdue: "red",
  };

  const statusLabels: Record<PortalInvoice["status"], string> = {
    pending: "Pending",
    paid: "Paid",
    overdue: "Overdue",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface/50 hover:bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[invoice.status]}>
              {statusLabels[invoice.status]}
            </Badge>
            <span className="text-xs text-secondary">Due: {invoice.dueDate}</span>
          </div>
          <div className="font-medium text-primary mt-2">{invoice.description}</div>
          <p className="text-lg font-semibold text-primary mt-1">
            {formatCurrency(invoice.amount)}
          </p>
        </div>
        {invoice.status === "pending" && (
          <Button variant="primary" size="sm">
            Pay Now
          </Button>
        )}
        {invoice.status === "paid" && (
          <Button variant="secondary" size="sm">
            Download
          </Button>
        )}
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

/* ───────────────── Main Component ───────────────── */

export default function PortalBillingPage() {
  const pendingCount = mockInvoices.filter((i) => i.status === "pending").length;
  const totalPending = mockInvoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);

  const handleBackClick = () => {
    window.history.pushState(null, "", "/portal");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Billing and Transactions"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} pending invoice${pendingCount !== 1 ? "s" : ""} totaling $${totalPending.toFixed(2)}`
            : "No outstanding balance"
        }
        actions={
          <Button variant="secondary" onClick={handleBackClick}>
            Back to Portal
          </Button>
        }
      />

      <div className="mt-8">
        {mockInvoices.length === 0 ? (
          <EmptyInvoices />
        ) : (
          <div className="space-y-3">
            {mockInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
