// apps/breeding/src/components/FoalingCountdownBadge.tsx
// Badge component that shows countdown to expected foaling date

import * as React from "react";
import { Baby, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export type FoalingStatus =
  | "PLANNING" // No dates set
  | "EXPECTING" // Has expected date but > 30 days away
  | "MONITORING" // 14-30 days until expected
  | "IMMINENT" // < 14 days until expected
  | "DUE_TODAY" // Expected date is today
  | "OVERDUE" // Past expected date
  | "FOALED"; // Birth recorded

export interface FoalingCountdownBadgeProps {
  /** Expected birth date (ISO string) */
  expectedBirthDate: string | null;
  /** Actual birth date if foaled (ISO string) */
  birthDateActual: string | null;
  /** Actual breed date (ISO string) - needed to know if pregnancy is confirmed */
  breedDateActual?: string | null;
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Show just the badge or include label */
  showLabel?: boolean;
}

/**
 * Calculate foaling status and days until/overdue
 */
export function calculateFoalingStatus(
  expectedBirthDate: string | null,
  birthDateActual: string | null,
  breedDateActual?: string | null
): { status: FoalingStatus; daysUntil: number | null } {
  // Already foaled
  if (birthDateActual) {
    return { status: "FOALED", daysUntil: null };
  }

  // No expected date or not bred yet
  if (!expectedBirthDate) {
    return { status: "PLANNING", daysUntil: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expected = new Date(expectedBirthDate);
  expected.setHours(0, 0, 0, 0);

  const diffTime = expected.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { status: "OVERDUE", daysUntil };
  }
  if (daysUntil === 0) {
    return { status: "DUE_TODAY", daysUntil: 0 };
  }
  if (daysUntil <= 14) {
    return { status: "IMMINENT", daysUntil };
  }
  if (daysUntil <= 30) {
    return { status: "MONITORING", daysUntil };
  }
  return { status: "EXPECTING", daysUntil };
}

const STATUS_STYLES: Record<
  FoalingStatus,
  { bg: string; text: string; border: string; icon: React.ElementType }
> = {
  PLANNING: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/30",
    icon: Clock,
  },
  EXPECTING: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: Clock,
  },
  MONITORING: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: Clock,
  },
  IMMINENT: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/40",
    icon: Baby,
  },
  DUE_TODAY: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/50",
    icon: Baby,
  },
  OVERDUE: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/50",
    icon: AlertTriangle,
  },
  FOALED: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
};

/**
 * Badge showing countdown to expected foaling date
 * - Blue for 30+ days
 * - Amber for 14-30 days (monitoring)
 * - Orange for < 14 days (imminent)
 * - Red for due today or overdue
 * - Green for foaled
 */
export function FoalingCountdownBadge({
  expectedBirthDate,
  birthDateActual,
  breedDateActual,
  size = "sm",
  showLabel = true,
}: FoalingCountdownBadgeProps) {
  const { status, daysUntil } = calculateFoalingStatus(
    expectedBirthDate,
    birthDateActual,
    breedDateActual
  );

  // Don't show badge for planning status (no dates)
  if (status === "PLANNING") return null;

  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  let label: string;
  switch (status) {
    case "FOALED":
      label = "Foaled";
      break;
    case "DUE_TODAY":
      label = "Due Today";
      break;
    case "OVERDUE":
      label = daysUntil !== null ? `${Math.abs(daysUntil)}d overdue` : "Overdue";
      break;
    case "IMMINENT":
      label = daysUntil !== null ? `${daysUntil}d` : "Imminent";
      break;
    case "MONITORING":
      label = daysUntil !== null ? `${daysUntil}d` : "Monitoring";
      break;
    default:
      label = daysUntil !== null ? `${daysUntil}d` : "";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${style.bg} ${style.text} ${style.border}`}
      title={getTooltip(status, daysUntil, expectedBirthDate)}
    >
      <Icon className={iconSize[size]} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

function getTooltip(
  status: FoalingStatus,
  daysUntil: number | null,
  expectedBirthDate: string | null
): string {
  const formattedDate = expectedBirthDate
    ? new Date(expectedBirthDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  switch (status) {
    case "FOALED":
      return "Birth has been recorded";
    case "DUE_TODAY":
      return `Due today (${formattedDate})`;
    case "OVERDUE":
      return `${Math.abs(daysUntil || 0)} days past expected date (${formattedDate})`;
    case "IMMINENT":
      return `${daysUntil} days until expected foaling (${formattedDate})`;
    case "MONITORING":
      return `${daysUntil} days until expected foaling (${formattedDate})`;
    case "EXPECTING":
      return `Expected ${formattedDate}`;
    default:
      return "";
  }
}

export default FoalingCountdownBadge;
