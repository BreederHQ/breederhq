// packages/ui/src/components/Finance/BreedingPlanFinancialSummary.tsx
// Read-only financial summary rollups for breeding plans

import * as React from "react";
import { SectionCard } from "../SectionCard";
import { formatCents } from "../../utils/money";
import {
  computeRevenueSummary,
  computeDepositSummary,
  computePricingStats,
  computeDepositTiming,
  type Invoice,
  type Payment,
  type OffspringGroup,
  type Offspring,
} from "../../utils/financeRollups";

export interface BreedingPlanFinancialSummaryProps {
  invoices: Invoice[];
  payments: Payment[];
  offspringGroups?: OffspringGroup[];
  offspring?: Offspring[];
  breedingPlanId: number;
}

export function BreedingPlanFinancialSummary({
  invoices,
  payments,
  offspringGroups = [],
  offspring = [],
  breedingPlanId,
}: BreedingPlanFinancialSummaryProps) {
  // Filter invoices to only those related to this breeding plan
  const relevantInvoices = React.useMemo(() => {
    const offspringGroupIds = new Set(
      offspringGroups.filter((og) => og.breedingPlanId === breedingPlanId).map((og) => og.id)
    );
    const offspringIds = new Set(
      offspring.filter((o) => offspringGroupIds.has(o.offspringGroupId)).map((o) => o.id)
    );

    return invoices.filter(
      (inv) =>
        inv.breedingPlanId === breedingPlanId ||
        (inv.offspringGroupId && offspringGroupIds.has(inv.offspringGroupId)) ||
        (inv.offspringId && offspringIds.has(inv.offspringId))
    );
  }, [invoices, offspringGroups, offspring, breedingPlanId]);

  // Get relevant offspring for this breeding plan
  const relevantOffspring = React.useMemo(() => {
    const offspringGroupIds = new Set(
      offspringGroups.filter((og) => og.breedingPlanId === breedingPlanId).map((og) => og.id)
    );
    return offspring.filter((o) => offspringGroupIds.has(o.offspringGroupId));
  }, [offspring, offspringGroups, breedingPlanId]);

  // Compute summaries
  const revenueSummary = React.useMemo(
    () => computeRevenueSummary(relevantInvoices, payments),
    [relevantInvoices, payments]
  );

  const depositSummary = React.useMemo(
    () => computeDepositSummary(relevantInvoices, payments, relevantOffspring.length),
    [relevantInvoices, payments, relevantOffspring.length]
  );

  const pricingStats = React.useMemo(
    () => computePricingStats(relevantInvoices, relevantOffspring),
    [relevantInvoices, relevantOffspring]
  );

  // Get birth date from first offspring group with a birth date
  const birthDate = React.useMemo(() => {
    const groupsForPlan = offspringGroups.filter((og) => og.breedingPlanId === breedingPlanId);
    const groupWithBirthDate = groupsForPlan.find((og) => og.birthDate);
    return groupWithBirthDate?.birthDate;
  }, [offspringGroups, breedingPlanId]);

  const depositTiming = React.useMemo(
    () => computeDepositTiming(relevantInvoices, payments, birthDate),
    [relevantInvoices, payments, birthDate]
  );

  return (
    <SectionCard title="Financial Summary">
      <div className="space-y-4">
        {/* Revenue Summary */}
        <div>
          <h3 className="text-sm font-medium mb-2">Revenue Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-secondary">Total Invoiced</div>
              <div className="font-medium">{formatCents(revenueSummary.totalInvoicedCents)}</div>
            </div>
            <div>
              <div className="text-secondary">Total Collected</div>
              <div className="font-medium">{formatCents(revenueSummary.totalCollectedCents)}</div>
            </div>
            <div>
              <div className="text-secondary">Outstanding Balance</div>
              <div className="font-medium">{formatCents(revenueSummary.outstandingCents)}</div>
            </div>
            <div>
              <div className="text-secondary">Invoice Count</div>
              <div className="font-medium">{revenueSummary.invoiceCount}</div>
            </div>
          </div>
        </div>

        {/* Deposit Summary */}
        {depositSummary.totalDepositInvoicedCents > 0 && (
          <div className="pt-4 border-t border-hairline">
            <h3 className="text-sm font-medium mb-2">Deposit Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-secondary">Total Deposits Invoiced</div>
                <div className="font-medium">
                  {formatCents(depositSummary.totalDepositInvoicedCents)}
                </div>
              </div>
              <div>
                <div className="text-secondary">Total Deposits Collected</div>
                <div className="font-medium">
                  {formatCents(depositSummary.totalDepositCollectedCents)}
                </div>
              </div>
              <div>
                <div className="text-secondary">Deposits Outstanding</div>
                <div className="font-medium">
                  {formatCents(depositSummary.depositOutstandingCents)}
                </div>
              </div>
              {relevantOffspring.length > 0 && (
                <div>
                  <div className="text-secondary">Average Deposit per Offspring</div>
                  <div className="font-medium">
                    {formatCents(depositSummary.averageDepositPerOffspringCents)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {pricingStats.offspringWithPricing > 0 && (
          <div className="pt-4 border-t border-hairline">
            <h3 className="text-sm font-medium mb-2">Pricing per Offspring</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-secondary">Average Price</div>
                <div className="font-medium">
                  {formatCents(pricingStats.averagePricePerOffspringCents)}
                </div>
              </div>
              <div>
                <div className="text-secondary">Offspring with Pricing</div>
                <div className="font-medium">{pricingStats.offspringWithPricing}</div>
              </div>
              <div>
                <div className="text-secondary">Min Price</div>
                <div className="font-medium">{formatCents(pricingStats.minPriceCents)}</div>
              </div>
              <div>
                <div className="text-secondary">Max Price</div>
                <div className="font-medium">{formatCents(pricingStats.maxPriceCents)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Timing */}
        {depositTiming.hasSufficientData && (
          <div className="pt-4 border-t border-hairline">
            <h3 className="text-sm font-medium mb-2">Deposit Timing</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-secondary">Collected Before Birth</div>
                <div className="font-medium">{depositTiming.percentCollectedBeforeBirth}%</div>
              </div>
              <div>
                <div className="text-secondary">Collected After Birth</div>
                <div className="font-medium">{depositTiming.percentCollectedAfterBirth}%</div>
              </div>
              {depositTiming.firstDepositDate && (
                <div>
                  <div className="text-secondary">First Deposit Date</div>
                  <div className="font-medium">
                    {new Date(depositTiming.firstDepositDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {relevantInvoices.length === 0 && (
          <div className="text-sm text-secondary">
            No financial data available for this breeding plan.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
