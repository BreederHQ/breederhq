// apps/breeding/src/components/FoalingAlertBadge.tsx
// Badge component that shows foaling milestone alert status (overdue/upcoming)

import * as React from "react";
import { AlertTriangle, XCircle, Calendar } from "lucide-react";

export interface FoalingAlertState {
  /** Count of overdue milestones (pre-birth milestones past due and birth not recorded) */
  overdueCount: number;
  /** Count of milestones due soon (within 7 days) */
  dueSoonCount: number;
  /** Whether there are any issues to alert */
  hasIssues: boolean;
}

export interface FoalingAlertBadgeProps {
  /** Count of overdue milestones */
  overdueCount: number;
  /** Count of due soon milestones */
  dueSoonCount: number;
  /** Size of the badge */
  size?: "sm" | "md";
  /** Whether to show as a dot only (no count) */
  dotOnly?: boolean;
}

/**
 * Badge that shows foaling milestone alert status
 * - Red for overdue
 * - Amber for due soon
 * - Nothing if all current
 */
export function FoalingAlertBadge({
  overdueCount,
  dueSoonCount,
  size = "sm",
  dotOnly = false,
}: FoalingAlertBadgeProps) {
  const hasOverdue = overdueCount > 0;
  const hasDueSoon = dueSoonCount > 0;

  if (!hasOverdue && !hasDueSoon) return null;

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  if (dotOnly) {
    // Just a colored dot
    return (
      <span
        className={`inline-block rounded-full animate-pulse ${dotSize} ${
          hasOverdue ? "bg-red-500" : "bg-amber-500"
        }`}
        title={
          hasOverdue
            ? `${overdueCount} overdue milestone${overdueCount !== 1 ? "s" : ""}`
            : `${dueSoonCount} milestone${dueSoonCount !== 1 ? "s" : ""} due soon`
        }
      />
    );
  }

  // Icon with optional count
  if (hasOverdue) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-red-500 animate-pulse"
        title={`${overdueCount} overdue milestone${overdueCount !== 1 ? "s" : ""}`}
      >
        <XCircle className={iconSize} />
        {overdueCount > 1 && (
          <span className="text-[10px] font-medium">{overdueCount}</span>
        )}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500 animate-pulse"
      title={`${dueSoonCount} milestone${dueSoonCount !== 1 ? "s" : ""} due soon`}
    >
      <AlertTriangle className={iconSize} />
      {dueSoonCount > 1 && (
        <span className="text-[10px] font-medium">{dueSoonCount}</span>
      )}
    </span>
  );
}

/**
 * Calculate foaling alert state from milestones
 * @param milestones - Array of milestone objects with isCompleted, scheduledDate, type
 * @param actualBreedDate - Actual breed date (milestones only relevant after breeding)
 * @param actualBirthDate - Actual birth date if foaled, null otherwise
 * @returns FoalingAlertState with counts and hasIssues flag
 */
export function calculateFoalingAlerts(
  milestones: Array<{
    isCompleted: boolean;
    scheduledDate: string;
    type: string;
  }>,
  actualBreedDate: string | null,
  actualBirthDate: string | null
): FoalingAlertState {
  // If the mare has foaled, no alerts for pre-birth milestones
  if (actualBirthDate) {
    return { overdueCount: 0, dueSoonCount: 0, hasIssues: false };
  }

  // If the mare has NOT been bred yet, milestones are not relevant
  // (they're calculated from expected dates, not actual breeding)
  if (!actualBreedDate) {
    return { overdueCount: 0, dueSoonCount: 0, hasIssues: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let overdueCount = 0;
  let dueSoonCount = 0;

  for (const milestone of milestones) {
    if (milestone.isCompleted) continue;

    const scheduledDate = new Date(milestone.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);

    // Skip post-birth milestones (e.g., OVERDUE_VET_CALL_350D)
    // These are only relevant after expected birth date
    if (milestone.type === "OVERDUE_VET_CALL_350D") continue;

    if (scheduledDate < today) {
      overdueCount++;
    } else if (scheduledDate <= sevenDaysFromNow) {
      dueSoonCount++;
    }
  }

  return {
    overdueCount,
    dueSoonCount,
    hasIssues: overdueCount > 0 || dueSoonCount > 0,
  };
}

export default FoalingAlertBadge;
