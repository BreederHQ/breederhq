import * as React from "react";
import { Tooltip } from "@bhq/ui";

type CycleAlertBadgeProps = {
  daysUntilExpected: number;
  size?: "sm" | "md";
  dotOnly?: boolean;
};

/**
 * CycleAlertBadge - Shows when a female is approaching or past expected heat cycle
 *
 * - Yellow dot: Within 14 days of expected cycle
 * - Amber dot: Cycle is overdue (past expected date)
 */
export function CycleAlertBadge({
  daysUntilExpected,
  size = "md",
  dotOnly = false,
}: CycleAlertBadgeProps) {
  const isOverdue = daysUntilExpected < 0;
  const needsAttention = daysUntilExpected <= 14 && daysUntilExpected >= -14;

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
 */
export function calculateDaysUntilCycle(
  cycleStartDates: string[] | null | undefined,
  cycleLengthOverride: number | null | undefined,
  species: string
): number | null {
  if (!cycleStartDates || cycleStartDates.length === 0) return null;

  // Species default cycle lengths (days)
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

  return daysUntil;
}
