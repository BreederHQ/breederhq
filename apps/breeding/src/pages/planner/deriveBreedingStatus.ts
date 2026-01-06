// apps/breeding/src/pages/planner/deriveBreedingStatus.ts
// Status derivation logic for planner components

export type Status =
  | "PLANNING"
  | "COMMITTED"
  | "BRED"
  | "BIRTHED"
  | "WEANED"
  | "PLACEMENT_STARTED"
  | "PLACEMENT_COMPLETED"
  | "COMPLETE"
  | "CANCELED";

export const STATUS_ORDER: Status[] = [
  "PLANNING",
  "COMMITTED",
  "BRED",
  "BIRTHED",
  "WEANED",
  "PLACEMENT_STARTED",
  "PLACEMENT_COMPLETED",
  "COMPLETE",
  "CANCELED",
];

export const STATUS_LABELS: Record<Status, string> = {
  PLANNING: "Planning",
  COMMITTED: "Committed",
  BRED: "Bred",
  BIRTHED: "Birthed",
  WEANED: "Weaned",
  PLACEMENT_STARTED: "Placement Started",
  PLACEMENT_COMPLETED: "Placement Completed",
  COMPLETE: "Complete",
  CANCELED: "Canceled",
};

// Backend status values - these should match what the API/database (Prisma) uses
// Backend enum: PLANNING, COMMITTED, CYCLE_EXPECTED, HORMONE_TESTING, BRED, PREGNANT, BIRTHED, WEANED, PLACEMENT, COMPLETE, CANCELED
export type BackendStatus =
  | "PLANNING"
  | "COMMITTED"
  | "CYCLE_EXPECTED"
  | "HORMONE_TESTING"
  | "BRED"
  | "PREGNANT"
  | "BIRTHED"
  | "WEANED"
  | "PLACEMENT"
  | "COMPLETE"
  | "CANCELED";

// Map frontend status to backend status
// Frontend uses more granular PLACEMENT_STARTED/PLACEMENT_COMPLETED, backend uses just PLACEMENT
const STATUS_TO_BACKEND: Record<Status, BackendStatus> = {
  PLANNING: "PLANNING",
  COMMITTED: "COMMITTED",
  BRED: "BRED",
  BIRTHED: "BIRTHED",
  WEANED: "WEANED",
  PLACEMENT_STARTED: "PLACEMENT",  // Backend uses PLACEMENT for both
  PLACEMENT_COMPLETED: "PLACEMENT", // Backend uses PLACEMENT for both
  COMPLETE: "COMPLETE",
  CANCELED: "CANCELED",
};

// Map backend status to frontend status
const BACKEND_TO_STATUS: Record<BackendStatus, Status> = {
  PLANNING: "PLANNING",
  COMMITTED: "COMMITTED",
  CYCLE_EXPECTED: "COMMITTED", // Map to closest frontend equivalent
  HORMONE_TESTING: "COMMITTED", // Map to closest frontend equivalent
  BRED: "BRED",
  PREGNANT: "BIRTHED", // Pregnant means expecting birth
  BIRTHED: "BIRTHED",
  WEANED: "WEANED",
  PLACEMENT: "PLACEMENT_STARTED", // Backend PLACEMENT maps to frontend PLACEMENT_STARTED
  COMPLETE: "COMPLETE",
  CANCELED: "CANCELED",
};

/** Convert frontend status to backend API value */
export function toBackendStatus(status: Status | string): BackendStatus {
  const normalized = (status ?? "").toUpperCase() as Status;
  return STATUS_TO_BACKEND[normalized] ?? (normalized as BackendStatus);
}

/** Convert backend API status to frontend value */
export function fromBackendStatus(status: BackendStatus | string): Status {
  const normalized = (status ?? "").toUpperCase() as BackendStatus;
  return BACKEND_TO_STATUS[normalized] ?? (normalized as Status);
}

export function deriveBreedingStatus(p: {
  name?: string | null;
  species?: string | null;
  damId?: number | null;
  sireId?: number | null;
  lockedCycleStart?: string | null;
  cycleStartDateActual?: string | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  status?: string | null;
}): Status {
  // Status is NOT auto-derived from dates.
  // User must explicitly click "Advance to X Phase" button to change status.
  // This function now only returns the current explicit status, or derives
  // the initial PLANNING/COMMITTED state based on prerequisites.

  const explicit = (p.status ?? "").toUpperCase() as Status;

  // If we have an explicit status that's a valid phase, preserve it
  if (STATUS_ORDER.includes(explicit)) {
    return explicit;
  }

  // Only derive PLANNING vs COMMITTED based on prerequisites (for new plans)
  const hasBasics = Boolean((p.name ?? "").trim() && (p.species ?? "").trim() && p.damId != null);
  const hasCommitPrereqs = hasBasics && p.sireId != null && (p.lockedCycleStart ?? "").trim();

  if (hasCommitPrereqs) return "COMMITTED";
  return "PLANNING";
}
