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
// Phase 6 (PLACEMENT_STARTED) and Phase 7 (PLACEMENT_COMPLETED) both map to backend PLACEMENT
// We differentiate them in fromBackendStatus using placementStartDateActual presence
const STATUS_TO_BACKEND: Record<Status, BackendStatus> = {
  PLANNING: "PLANNING",
  COMMITTED: "COMMITTED",
  BRED: "BRED",
  BIRTHED: "BIRTHED",
  WEANED: "WEANED",
  PLACEMENT_STARTED: "PLACEMENT",   // Phase 6: Beginning placement, entering start date
  PLACEMENT_COMPLETED: "PLACEMENT", // Phase 7: Placement in progress, entering completed date
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
  PLACEMENT: "PLACEMENT_STARTED", // Backend PLACEMENT can be phase 6 or 7 (see fromBackendStatus)
  COMPLETE: "COMPLETE",
  CANCELED: "CANCELED",
};

/** Convert frontend status to backend API value */
export function toBackendStatus(status: Status | string): BackendStatus {
  const normalized = (status ?? "").toUpperCase() as Status;
  return STATUS_TO_BACKEND[normalized] ?? (normalized as BackendStatus);
}

/** Convert backend API status to frontend value */
export function fromBackendStatus(
  status: BackendStatus | string,
  context?: { placementStartDateActual?: string | null; placementCompletedDateActual?: string | null }
): Status {
  const normalized = (status ?? "").toUpperCase() as BackendStatus;
  const baseStatus = BACKEND_TO_STATUS[normalized] ?? (normalized as Status);

  // Special handling for PLACEMENT: determine if PLACEMENT_STARTED or PLACEMENT_COMPLETED
  // Phase 6 (PLACEMENT_STARTED) and Phase 7 (PLACEMENT_COMPLETED) both have backend status PLACEMENT
  // Differentiate by checking if placement start date has been entered
  if (normalized === "PLACEMENT" && context) {
    // If placement start date exists, user is in Phase 7 (PLACEMENT_COMPLETED)
    // They've clicked "Advance to Phase 7" and can now enter placement completed date
    if (context.placementStartDateActual) {
      return "PLACEMENT_COMPLETED";
    }
    // Otherwise, Phase 6 (PLACEMENT_STARTED) - waiting to enter placement start date
    return "PLACEMENT_STARTED";
  }

  return baseStatus;
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
  // Status derivation logic:
  // 1. Check if explicit status is still valid based on available dates
  // 2. If explicit status requirements are NOT met, regress to highest valid status
  // 3. For new plans without explicit status, derive from prerequisites

  const explicit = (p.status ?? "").toUpperCase() as Status;

  // Helper to check if a date field has a value
  const hasDate = (d: string | null | undefined): boolean => Boolean((d ?? "").toString().trim());

  // Check prerequisites for each status
  const hasBasics = Boolean((p.name ?? "").trim() && (p.species ?? "").trim() && p.damId != null);
  const hasCommitPrereqs = hasBasics && p.sireId != null && hasDate(p.lockedCycleStart);
  const hasCycleStart = hasDate(p.cycleStartDateActual);
  const hasBreedDate = hasDate(p.breedDateActual);
  const hasBirthDate = hasDate(p.birthDateActual);
  const hasWeanedDate = hasDate(p.weanedDateActual);
  const hasPlacementStart = hasDate(p.placementStartDateActual);
  const hasPlacementCompleted = hasDate(p.placementCompletedDateActual);
  const hasCompleted = hasDate(p.completedDateActual);

  // Validate explicit status against available data
  // If the status requires data that's missing, regress to the highest valid status
  if (STATUS_ORDER.includes(explicit)) {
    // COMPLETE requires placement completed
    if (explicit === "COMPLETE" && !hasPlacementCompleted) {
      // Regress - fall through to find valid status
    }
    // PLACEMENT_COMPLETED requires placement started
    else if (explicit === "PLACEMENT_COMPLETED" && !hasPlacementStart) {
      // Regress
    }
    // PLACEMENT_STARTED requires weaned date
    else if (explicit === "PLACEMENT_STARTED" && !hasWeanedDate) {
      // Regress
    }
    // WEANED requires birth date
    else if (explicit === "WEANED" && !hasBirthDate) {
      // Regress
    }
    // BIRTHED requires breed date
    else if (explicit === "BIRTHED" && !hasBreedDate) {
      // Regress
    }
    // BRED requires cycle start actual date
    else if (explicit === "BRED" && !hasCycleStart) {
      // Regress
    }
    // COMMITTED requires locked cycle AND basic prerequisites
    else if (explicit === "COMMITTED" && !hasCommitPrereqs) {
      // Regress to PLANNING
      return "PLANNING";
    }
    // CANCELED is always valid once set
    else if (explicit === "CANCELED") {
      return "CANCELED";
    }
    // Status is valid for available data
    else {
      return explicit;
    }
  }

  // Either no explicit status OR explicit status was invalid - derive from available data
  // Find the highest valid status based on available dates
  if (hasCompleted && hasPlacementCompleted) return "COMPLETE";
  if (hasPlacementCompleted && hasPlacementStart) return "PLACEMENT_COMPLETED";
  if (hasPlacementStart && hasWeanedDate) return "PLACEMENT_STARTED";
  if (hasWeanedDate && hasBirthDate) return "WEANED";
  if (hasBirthDate && hasBreedDate) return "BIRTHED";
  if (hasBreedDate && hasCycleStart) return "BRED";
  if (hasCycleStart && hasCommitPrereqs) return "COMMITTED";
  if (hasCommitPrereqs) return "COMMITTED";
  return "PLANNING";
}
