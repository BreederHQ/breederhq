// packages/ui/src/utils/vaccinationStatus.ts
// Vaccination status calculation utilities

import type { VaccinationStatus } from "@bhq/api";

/** Threshold for "due soon" warning (in days) */
const DUE_SOON_THRESHOLD_DAYS = 30;

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate the difference in days between two dates
 * Returns positive if target is in the future, negative if in the past
 */
function differenceInDays(target: Date, from: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((target.getTime() - from.getTime()) / msPerDay);
}

export interface VaccinationStatusResult {
  /** Current status of the vaccination */
  status: VaccinationStatus;
  /** When this vaccination expires (ISO string) */
  expiresAt: string;
  /** Days remaining until expiration (negative if expired) */
  daysRemaining: number;
  /** Human-readable status text */
  statusText: string;
}

/**
 * Calculate vaccination status based on administration date and interval
 *
 * @param administeredAt - ISO date string when vaccination was given
 * @param intervalMonths - Standard interval in months (from protocol)
 * @param expiresAtOverride - Optional explicit expiration date override
 * @returns Status calculation result
 */
export function calculateVaccinationStatus(
  administeredAt: string,
  intervalMonths: number,
  expiresAtOverride?: string
): VaccinationStatusResult {
  const administered = new Date(administeredAt);

  // Calculate expiration date
  const expires = expiresAtOverride
    ? new Date(expiresAtOverride)
    : addMonths(administered, intervalMonths);

  const now = new Date();
  const daysRemaining = differenceInDays(expires, now);

  let status: VaccinationStatus;
  let statusText: string;

  if (daysRemaining < 0) {
    status = "expired";
    const daysOverdue = Math.abs(daysRemaining);
    if (daysOverdue === 1) {
      statusText = "Expired yesterday";
    } else if (daysOverdue < 30) {
      statusText = `Expired ${daysOverdue} days ago`;
    } else if (daysOverdue < 365) {
      const months = Math.floor(daysOverdue / 30);
      statusText = `Expired ${months} month${months !== 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(daysOverdue / 365);
      statusText = `Expired ${years} year${years !== 1 ? "s" : ""} ago`;
    }
  } else if (daysRemaining <= DUE_SOON_THRESHOLD_DAYS) {
    status = "due_soon";
    if (daysRemaining === 0) {
      statusText = "Expires today";
    } else if (daysRemaining === 1) {
      statusText = "Expires tomorrow";
    } else {
      statusText = `Due in ${daysRemaining} days`;
    }
  } else {
    status = "current";
    if (daysRemaining < 30) {
      statusText = `Valid for ${daysRemaining} days`;
    } else if (daysRemaining < 365) {
      const months = Math.floor(daysRemaining / 30);
      statusText = `Valid for ${months} month${months !== 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(daysRemaining / 365);
      const remainingMonths = Math.floor((daysRemaining % 365) / 30);
      if (remainingMonths > 0) {
        statusText = `Valid for ${years}y ${remainingMonths}m`;
      } else {
        statusText = `Valid for ${years} year${years !== 1 ? "s" : ""}`;
      }
    }
  }

  return {
    status,
    expiresAt: expires.toISOString().split("T")[0],
    daysRemaining,
    statusText,
  };
}

/**
 * Format an expiration date for display
 */
export function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an administration date for display
 */
export function formatAdministeredDate(administeredAt: string): string {
  const date = new Date(administeredAt);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get sort priority for vaccination status (for ordering)
 * Lower number = higher priority (show first)
 */
export function getStatusPriority(status: VaccinationStatus): number {
  switch (status) {
    case "expired":
      return 1;
    case "due_soon":
      return 2;
    case "not_recorded":
      return 3;
    case "current":
      return 4;
    default:
      return 5;
  }
}

/**
 * Sort vaccination records by urgency (expired/due_soon first)
 */
export function sortByUrgency<T extends { status: VaccinationStatus; daysRemaining?: number }>(
  records: T[]
): T[] {
  return [...records].sort((a, b) => {
    const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (priorityDiff !== 0) return priorityDiff;

    // Within same status, sort by days remaining (most urgent first)
    const aDays = a.daysRemaining ?? 0;
    const bDays = b.daysRemaining ?? 0;
    return aDays - bDays;
  });
}

/**
 * Calculate summary statistics for a list of vaccination records
 */
export function calculateVaccinationSummary(
  records: Array<{ status: VaccinationStatus; protocolKey: string; expiresAt?: string; daysRemaining?: number }>,
  protocols: Array<{ key: string; name: string }>
): {
  current: number;
  dueSoon: number;
  expired: number;
  notRecorded: number;
  nextDue?: { protocolKey: string; protocolName: string; daysRemaining: number; expiresAt: string };
} {
  const current = records.filter((r) => r.status === "current").length;
  const dueSoon = records.filter((r) => r.status === "due_soon").length;
  const expired = records.filter((r) => r.status === "expired").length;
  const notRecorded = records.filter((r) => r.status === "not_recorded").length;

  // Find the next vaccination due
  const upcoming = records
    .filter((r) => r.status === "due_soon" || r.status === "current")
    .filter((r) => r.daysRemaining !== undefined)
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));

  let nextDue: { protocolKey: string; protocolName: string; daysRemaining: number; expiresAt: string } | undefined;

  if (upcoming.length > 0) {
    const next = upcoming[0];
    const protocol = protocols.find((p) => p.key === next.protocolKey);
    if (protocol && next.expiresAt && next.daysRemaining !== undefined) {
      nextDue = {
        protocolKey: next.protocolKey,
        protocolName: protocol.name,
        daysRemaining: next.daysRemaining,
        expiresAt: next.expiresAt,
      };
    }
  }

  return { current, dueSoon, expired, notRecorded, nextDue };
}
