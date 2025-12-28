// apps/finance/src/FinanceHome.tsx
// Finance Home - guidance, summaries, and quick actions

import * as React from "react";
import { Card, Button, SectionCard } from "@bhq/ui";
import { InvoiceCreateModal, ExpenseModal } from "@bhq/ui/components/Finance";
import { formatCents } from "@bhq/ui/utils/money";
import { Plus, ArrowRight } from "lucide-react";
import type { FinanceApi } from "./api";

type Props = {
  api: FinanceApi;
  onNavigate: (view: "invoices" | "expenses") => void;
};

export default function FinanceHome({ api, onNavigate }: Props) {
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [showExpenseModal, setShowExpenseModal] = React.useState(false);
  const [summary, setSummary] = React.useState<{
    totalOutstanding: number;
    totalInvoiced: number;
    totalCollected: number;
    programExpensesThisMonth: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Load summary stats
  const loadSummary = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load outstanding invoices
      const outstandingRes = await api.finance.invoices.list({
        limit: 1000,
        offset: 0,
        status: "ISSUED,PARTIALLY_PAID",
      });
      const totalOutstanding = outstandingRes.items.reduce(
        (sum: number, inv: any) => sum + (inv.balanceCents || 0),
        0
      );

      // Load all invoices for total invoiced/collected
      const allInvoicesRes = await api.finance.invoices.list({ limit: 1000, offset: 0 });
      const totalInvoiced = allInvoicesRes.items.reduce(
        (sum: number, inv: any) => sum + (inv.totalCents || 0),
        0
      );
      const totalCollected = allInvoicesRes.items.reduce(
        (sum: number, inv: any) => sum + ((inv.totalCents || 0) - (inv.balanceCents || 0)),
        0
      );

      // Load program expenses this month
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const expensesRes = await api.finance.expenses.list({
        limit: 1000,
        offset: 0,
        incurredAtFrom: firstOfMonth.toISOString().slice(0, 10),
        incurredAtTo: firstOfNextMonth.toISOString().slice(0, 10),
      });
      const programExpensesThisMonth = expensesRes.items
        .filter((exp: any) => !exp.animalId && !exp.offspringGroupId && !exp.breedingPlanId)
        .reduce((sum: number, exp: any) => sum + (exp.amountCents || 0), 0);

      setSummary({
        totalOutstanding,
        totalInvoiced,
        totalCollected,
        programExpensesThisMonth,
      });
    } catch (err) {
      console.error("Failed to load summary:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setShowExpenseModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
        <Button onClick={() => setShowInvoiceModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Guidance Section */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Getting Started</h2>
        <div className="space-y-3 text-sm text-secondary">
          <p>
            <strong>Invoices and expenses</strong> are typically created from the entities they're
            associated with for proper tracking and financial rollups:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Contacts</strong> - Create invoices for services provided to clients
            </li>
            <li>
              <strong>Organizations</strong> - Track business-to-business transactions
            </li>
            <li>
              <strong>Animals</strong> - Record vet expenses, breeding fees, and other animal-specific costs
            </li>
            <li>
              <strong>Offspring Groups</strong> - Track litter-related expenses and puppy deposits
            </li>
            <li>
              <strong>Breeding Plans</strong> - Manage breeding program finances with automatic rollups
            </li>
          </ul>
          <p className="pt-2">
            This <strong>Finance Hub</strong> provides a tenant-wide view of all invoices and expenses,
            global invoice creation, and the ability to record program-level expenses that aren't tied
            to specific animals or breeding plans.
          </p>
        </div>

        <div className="pt-4 border-t border-hairline">
          <h3 className="text-sm font-medium mb-3">Quick Links to Modules</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button variant="ghost" className="justify-start" onClick={() => window.location.href = "/contacts"}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Contacts
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => window.location.href = "/organizations"}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Organizations
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => window.location.href = "/animals"}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Animals
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => window.location.href = "/offspring-groups"}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Offspring Groups
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => window.location.href = "/breeding"}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Breeding Plans
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Outstanding Invoices</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.totalOutstanding || 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.totalInvoiced || 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Total Collected</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.totalCollected || 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Program Expenses (MTD)</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.programExpensesThisMonth || 0)}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <SectionCard title="View All Transactions">
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => onNavigate("invoices")}>
            <ArrowRight className="h-4 w-4 mr-2" />
            View All Invoices
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onNavigate("expenses")}>
            <ArrowRight className="h-4 w-4 mr-2" />
            View All Expenses
          </Button>
        </div>
      </SectionCard>

      {/* Modals */}
      <InvoiceCreateModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={() => {
          setShowInvoiceModal(false);
          loadSummary();
        }}
        api={api}
      />

      <ExpenseModal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => {
          setShowExpenseModal(false);
          loadSummary();
        }}
        api={api}
      />
    </div>
  );
}
