// packages/ui/src/components/Finance/FinanceTab.tsx
// Reusable Finance tab component for displaying invoices and expenses

import * as React from "react";
import { SectionCard, Badge, Button } from "@bhq/ui";
import { formatCents } from "../../utils/money";
import { InvoiceDetailDrawer } from "./InvoiceDetailDrawer";
import { InvoiceCreateModal } from "./InvoiceCreateModal";

export interface FinanceTabProps {
  invoiceFilters?: Record<string, any>;
  expenseFilters?: Record<string, any>;
  hideCreateActions?: boolean;
  defaultAnchor?: {
    animalId?: number;
    offspringGroupId?: number;
    breedingPlanId?: number;
  };
  api: any; // The finance API client
  onCreateInvoice?: () => void;
  onCreateExpense?: () => void;
}

export function FinanceTab({
  invoiceFilters = {},
  expenseFilters = {},
  hideCreateActions = false,
  defaultAnchor,
  api,
  onCreateInvoice,
  onCreateExpense,
}: FinanceTabProps) {
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, expRes] = await Promise.all([
        api.finance.invoices.list({ ...invoiceFilters, limit: 50 }),
        api.finance.expenses.list({ ...expenseFilters, limit: 50 }),
      ]);
      setInvoices(invRes?.items || []);
      setExpenses(expRes?.items || []);
    } catch (err: any) {
      console.error("Failed to load finance data:", err);
      setError(err?.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [api, invoiceFilters, expenseFilters]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SectionCard title="Finances">
          <div className="text-sm text-secondary">Loading...</div>
        </SectionCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <SectionCard title="Finances">
          <div className="text-sm text-red-400 mb-2">{error}</div>
          <Button size="sm" variant="outline" onClick={loadData}>
            Retry
          </Button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Invoices */}
      <SectionCard
        title="Invoices"
        right={
          !hideCreateActions ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onCreateInvoice) {
                  onCreateInvoice();
                } else {
                  setCreateInvoiceOpen(true);
                }
              }}
            >
              Create Invoice
            </Button>
          ) : undefined
        }
      >
        {invoices.length === 0 ? (
          <div className="text-sm text-secondary">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-hairline">
                <tr>
                  <th className="text-left py-2 pr-3 font-medium">Invoice #</th>
                  <th className="text-left py-2 pr-3 font-medium">Status</th>
                  <th className="text-right py-2 pr-3 font-medium">Total</th>
                  <th className="text-right py-2 pr-3 font-medium">Balance</th>
                  <th className="text-left py-2 pr-3 font-medium">Due Date</th>
                  <th className="text-right py-2 pr-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-hairline/60">
                    <td className="py-2 pr-3">{inv.invoiceNumber || "—"}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={inv.status === "PAID" ? "success" : "default"}>
                        {inv.status || "—"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-right">{formatCents(inv.totalCents)}</td>
                    <td className="py-2 pr-3 text-right">{formatCents(inv.balanceCents)}</td>
                    <td className="py-2 pr-3">
                      {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Button size="xs" variant="ghost" onClick={() => setSelectedInvoice(inv)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Expenses */}
      <SectionCard
        title="Expenses"
        right={
          !hideCreateActions && onCreateExpense ? (
            <Button size="sm" variant="outline" onClick={onCreateExpense}>
              Create Expense
            </Button>
          ) : undefined
        }
      >
        {expenses.length === 0 ? (
          <div className="text-sm text-secondary">No expenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-hairline">
                <tr>
                  <th className="text-left py-2 pr-3 font-medium">Category</th>
                  <th className="text-left py-2 pr-3 font-medium">Description</th>
                  <th className="text-right py-2 pr-3 font-medium">Amount</th>
                  <th className="text-left py-2 pr-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-hairline/60">
                    <td className="py-2 pr-3">{exp.category || "—"}</td>
                    <td className="py-2 pr-3">{exp.description || exp.notes || "—"}</td>
                    <td className="py-2 pr-3 text-right">{formatCents(exp.amountCents)}</td>
                    <td className="py-2 pr-3">
                      {exp.incurredAt ? new Date(exp.incurredAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Invoice Create Modal */}
      <InvoiceCreateModal
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onSuccess={() => {
          loadData();
        }}
        api={api}
        defaultAnchor={defaultAnchor}
      />

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        invoice={selectedInvoice}
        api={api}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onVoid={() => {
          setSelectedInvoice(null);
          loadData();
        }}
        onAddPayment={() => {
          // TODO: Open payment creation modal
          console.log("Add payment for invoice:", selectedInvoice);
        }}
      />
    </div>
  );
}
