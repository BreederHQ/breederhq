import * as React from "react";
import { Tooltip } from "@bhq/ui";

// Species default cycle lengths (days) - used for threshold calculation
const SPECIES_CYCLE_LENGTHS: Record<string, number> = {
  DOG: 180,
  CAT: 21,
  HORSE: 21,
  GOAT: 21,
  SHEEP: 17,
  PIG: 21,
  CATTLE: 21,
  RABBIT: 15,
  ALPACA: 14,
  LLAMA: 14,
};

/**
 * Calculate species-aware alert threshold
 * - For long-cycle species (DOG ~180 days): 14 days is reasonable (~8% of cycle)
 * - For short-cycle species (21 days): use ~30% of cycle length (6-7 days)
 */
function getAlertThreshold(species?: string, cycleLengthDays?: number): number {
  const cycleLen = cycleLengthDays || SPECIES_CYCLE_LENGTHS[species?.toUpperCase() || "DOG"] || 180;

  // For long cycles (>60 days), use 14 days
  // For short cycles, use ~30% of cycle (min 5 days, max 14 days)
  if (cycleLen > 60) {
    return 14;
  }
  return Math.max(5, Math.min(14, Math.round(cycleLen * 0.3)));
}

type CycleAlertBadgeProps = {
  daysUntilExpected: number;
  size?: "sm" | "md";
  dotOnly?: boolean;
  /** Species code for threshold calculation */
  species?: string;
  /** Actual cycle length if known (overrides species default) */
  cycleLengthDays?: number;
};

/**
 * CycleAlertBadge - Shows when a female is approaching or past expected heat cycle
 *
 * - Yellow dot: Within threshold of expected cycle (species-aware)
 * - Amber dot: Cycle is overdue (past expected date)
 *
 * Threshold is species-aware:
 * - Dogs (~180 day cycle): 14 days
 * - Horses/Goats/etc (~21 day cycle): ~6 days
 */
export function CycleAlertBadge({
  daysUntilExpected,
  size = "md",
  dotOnly = false,
  species,
  cycleLengthDays,
}: CycleAlertBadgeProps) {
  const threshold = getAlertThreshold(species, cycleLengthDays);
  const isOverdue = daysUntilExpected < 0;
  const needsAttention = daysUntilExpected <= threshold && daysUntilExpected >= -threshold;

  if (!needsAttention) return null;

  const color = isOverdue ? "bg-amber-500" : "bg-yellow-400";
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  const tooltipContent = (
    <div className="text-xs">
      <div className="font-medium">
        {isOverdue
          ? `Heat cycle ${Math.abs(daysUntilExpected)} days overdue`
          : `Heat expected in ${daysUntilExpected} days`}
      </div>
      <div className="text-secondary mt-1">
        Watch for signs of heat and record when it starts
      </div>
    </div>
  );

  if (dotOnly) {
    return (
      <Tooltip content={tooltipContent}>
        <span className={`${dotSize} ${color} rounded-full inline-block animate-pulse`} />
      </Tooltip>
    );
  }

  return (
    <Tooltip content={tooltipContent}>
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        isOverdue
          ? "bg-amber-900/40 border border-amber-500/50 text-amber-300"
          : "bg-yellow-900/40 border border-yellow-500/50 text-yellow-300"
      }`}>
        <span className={`${dotSize} ${color} rounded-full animate-pulse`} />
        {isOverdue ? "Overdue" : `${daysUntilExpected}d`}
      </span>
    </Tooltip>
  );
}

/**
 * Helper to calculate days until next expected heat cycle
 * Returns an object with daysUntil and the calculated threshold for "needs attention"
 */
export function calculateDaysUntilCycle(
  cycleStartDates: string[] | null | undefined,
  cycleLengthOverride: number | null | undefined,
  species: string
): { daysUntil: number; threshold: number; cycleLengthDays: number } | null {
  if (!cycleStartDates || cycleStartDates.length === 0) return null;

  const cycleLengthDays = cycleLengthOverride || SPECIES_CYCLE_LENGTHS[species?.toUpperCase()] || 180;

  // Get most recent cycle start
  const sortedDates = [...cycleStartDates].sort();
  const lastCycleStart = new Date(sortedDates[sortedDates.length - 1]);

  // Calculate next expected
  const nextExpected = new Date(lastCycleStart);
  nextExpected.setDate(nextExpected.getDate() + cycleLengthDays);

  // Days until next expected
  const now = new Date();
  const daysUntil = Math.ceil((nextExpected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Get the alert threshold for this species
  const threshold = getAlertThreshold(species, cycleLengthDays);

  return { daysUntil, threshold, cycleLengthDays };
}

// Export the threshold helper for external use
export { getAlertThreshold };
