// packages/ui/src/components/VaccinationTracker/VaccinationAlertBadge.tsx
// Small badge component that shows vaccination alert status

import * as React from "react";
import { AlertTriangle, XCircle } from "lucide-react";
import type { VaccinationStatus } from "@bhq/api";

export interface VaccinationAlertBadgeProps {
  /** Count of expired vaccinations */
  expiredCount: number;
  /** Count of due soon vaccinations */
  dueSoonCount: number;
  /** Size of the badge */
  size?: "sm" | "md";
  /** Whether to show as a dot only (no count) */
  dotOnly?: boolean;
}

/**
 * Badge that shows vaccination alert status
 * - Red for expired
 * - Amber for due soon
 * - Nothing if all current
 */
export function VaccinationAlertBadge({
  expiredCount,
  dueSoonCount,
  size = "sm",
  dotOnly = false,
}: VaccinationAlertBadgeProps) {
  const hasExpired = expiredCount > 0;
  const hasDueSoon = dueSoonCount > 0;

  if (!hasExpired && !hasDueSoon) return null;

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  if (dotOnly) {
    // Just a colored dot
    return (
      <span
        className={`inline-block rounded-full animate-pulse ${dotSize} ${
          hasExpired
            ? "bg-red-500"
            : "bg-amber-500"
        }`}
        title={
          hasExpired
            ? `${expiredCount} expired vaccination${expiredCount !== 1 ? "s" : ""}`
            : `${dueSoonCount} vaccination${dueSoonCount !== 1 ? "s" : ""} due soon`
        }
      />
    );
  }

  // Icon with optional count
  if (hasExpired) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-red-500 animate-pulse"
        title={`${expiredCount} expired vaccination${expiredCount !== 1 ? "s" : ""}`}
      >
        <XCircle className={iconSize} />
        {expiredCount > 1 && <span className="text-[10px] font-medium">{expiredCount}</span>}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500 animate-pulse"
      title={`${dueSoonCount} vaccination${dueSoonCount !== 1 ? "s" : ""} due soon`}
    >
      <AlertTriangle className={iconSize} />
      {dueSoonCount > 1 && <span className="text-[10px] font-medium">{dueSoonCount}</span>}
    </span>
  );
}

/**
 * Hook to calculate vaccination alert counts from records
 */
export function useVaccinationAlertCounts(
  statuses: VaccinationStatus[]
): { expiredCount: number; dueSoonCount: number } {
  return React.useMemo(() => {
    let expiredCount = 0;
    let dueSoonCount = 0;

    for (const status of statuses) {
      if (status === "expired") expiredCount++;
      else if (status === "due_soon") dueSoonCount++;
    }

    return { expiredCount, dueSoonCount };
  }, [statuses]);
}
