// packages/ui/src/components/Finance/FinanceTab.tsx
// Reusable Finance tab component for displaying invoices and expenses

import * as React from "react";
import { SectionCard, Badge, Button } from "@bhq/ui";
import { formatCents } from "../../utils/money";
import { InvoiceDetailDrawer } from "./InvoiceDetailDrawer";
import { InvoiceCreateModal } from "./InvoiceCreateModal";
import { ExpenseModal } from "./ExpenseModal";
import { BreedingPlanFinancialSummary } from "./BreedingPlanFinancialSummary";
import type { Invoice, Payment, OffspringGroup, Offspring } from "../../utils/financeRollups";

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
  // Optional breeding plan rollup data
  showBreedingPlanSummary?: boolean;
  offspringGroups?: OffspringGroup[];
  offspring?: Offspring[];
}

export function FinanceTab({
  invoiceFilters = {},
  expenseFilters = {},
  hideCreateActions = false,
  defaultAnchor,
  api,
  onCreateInvoice,
  onCreateExpense,
  showBreedingPlanSummary = false,
  offspringGroups = [],
  offspring = [],
}: FinanceTabProps) {
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = React.useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<any | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promises: Promise<any>[] = [
        api.finance.invoices.list({ ...invoiceFilters, limit: 50 }),
        api.finance.expenses.list({ ...expenseFilters, limit: 50 }),
      ];

      // If showing breeding plan summary, also fetch all payments for rollup calculations
      if (showBreedingPlanSummary && defaultAnchor?.breedingPlanId) {
        promises.push(api.finance.payments.list({ limit: 1000 }));
      }

      const results = await Promise.all(promises);
      const invRes = results[0];
      const expRes = results[1];
      const payRes = results[2];

      // Sort invoices by issuedAt desc (newest first), fallback to createdAt
      const sortedInvoices = (invRes?.items || []).sort((a: any, b: any) => {
        const aDate = a.issuedAt || a.createdAt;
        const bDate = b.issuedAt || b.createdAt;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // Sort expenses by incurredAt desc (newest first), fallback to createdAt
      const sortedExpenses = (expRes?.items || []).sort((a: any, b: any) => {
        const aDate = a.incurredAt || a.createdAt;
        const bDate = b.incurredAt || b.createdAt;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setInvoices(sortedInvoices);
      setExpenses(sortedExpenses);
      if (payRes) {
        setPayments(payRes?.items || []);
      }
    } catch (err: any) {
      console.error("Failed to load finance data:", err);
      setError(err?.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [api, invoiceFilters, expenseFilters, showBreedingPlanSummary, defaultAnchor?.breedingPlanId]);

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
      {/* Breeding Plan Financial Summary */}
      {showBreedingPlanSummary && defaultAnchor?.breedingPlanId && (
        <BreedingPlanFinancialSummary
          invoices={invoices as Invoice[]}
          payments={payments as Payment[]}
          offspringGroups={offspringGroups}
          offspring={offspring}
          breedingPlanId={defaultAnchor.breedingPlanId}
        />
      )}

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
          !hideCreateActions ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onCreateExpense) {
                  onCreateExpense();
                } else {
                  setSelectedExpense(null);
                  setExpenseModalOpen(true);
                }
              }}
            >
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
                  <th className="text-right py-2 pr-3 font-medium">Actions</th>
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
                    <td className="py-2 pr-3 text-right">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setSelectedExpense(exp);
                          setExpenseModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
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

      {/* Expense Modal (Create/Edit) */}
      <ExpenseModal
        open={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={() => {
          loadData();
        }}
        api={api}
        expense={selectedExpense}
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
