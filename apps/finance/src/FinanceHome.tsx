// apps/finance/src/FinanceHome.tsx
// Finance Home - guidance, summaries, and quick actions

import * as React from "react";
import { Card, SectionCard } from "@bhq/ui";
import { formatCents } from "@bhq/ui/utils/money";
import type { FinanceApi } from "./api";

type Props = {
  api: FinanceApi;
};

export default function FinanceHome({ api }: Props) {
  const [summary, setSummary] = React.useState<{
    outstandingTotalCents: number;
    invoicedMtdCents: number;
    collectedMtdCents: number;
    expensesMtdCents: number;
    depositsOutstandingCents: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Load summary stats from server
  const loadSummary = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.finance.summary();
      setSummary(data);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <a
              href="/contacts"
              className="group rounded-lg border border-hairline bg-surface p-4 hover:border-[hsl(var(--brand-orange))]/30 transition-colors cursor-pointer no-underline"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
                  📇
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary mb-0.5">Contacts</div>
                  <p className="text-xs text-secondary">Manage client relationships</p>
                </div>
              </div>
            </a>

            <a
              href="/organizations"
              className="group rounded-lg border border-hairline bg-surface p-4 hover:border-[hsl(var(--brand-orange))]/30 transition-colors cursor-pointer no-underline"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
                  🏤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary mb-0.5">Organizations</div>
                  <p className="text-xs text-secondary">Business accounts</p>
                </div>
              </div>
            </a>

            <a
              href="/animals"
              className="group rounded-lg border border-hairline bg-surface p-4 hover:border-[hsl(var(--brand-orange))]/30 transition-colors cursor-pointer no-underline"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
                  🐾
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary mb-0.5">Animals</div>
                  <p className="text-xs text-secondary">Track animal expenses</p>
                </div>
              </div>
            </a>

            <a
              href="/offspring-groups"
              className="group rounded-lg border border-hairline bg-surface p-4 hover:border-[hsl(var(--brand-orange))]/30 transition-colors cursor-pointer no-underline"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
                  🍼
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary mb-0.5">Offspring Groups</div>
                  <p className="text-xs text-secondary">Litter finances</p>
                </div>
              </div>
            </a>

            <a
              href="/breeding"
              className="group rounded-lg border border-hairline bg-surface p-4 hover:border-[hsl(var(--brand-orange))]/30 transition-colors cursor-pointer no-underline"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
                  🧬
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary mb-0.5">Breeding Plans</div>
                  <p className="text-xs text-secondary">Program rollups</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Outstanding Invoices</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.outstandingTotalCents || 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Invoiced (MTD)</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.invoicedMtdCents || 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Collected (MTD)</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.collectedMtdCents || 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-secondary mb-1">Expenses (MTD)</div>
          <div className="text-2xl font-bold">
            {loading ? "—" : formatCents(summary?.expensesMtdCents || 0)}
          </div>
        </Card>
      </div>

    </div>
  );
}
