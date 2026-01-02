// apps/breeding/src/pages/planner/deriveBreedingStatus.ts
// Status derivation logic for planner components

export type Status =
  | "PLANNING"
  | "COMMITTED"
  | "BRED"
  | "BIRTHED"
  | "WEANED"
  | "HOMING_STARTED"
  | "COMPLETE"
  | "CANCELED";

export const STATUS_ORDER: Status[] = [
  "PLANNING",
  "COMMITTED",
  "BRED",
  "BIRTHED",
  "WEANED",
  "HOMING_STARTED",
  "COMPLETE",
  "CANCELED",
];

export const STATUS_LABELS: Record<Status, string> = {
  PLANNING: "Planning",
  COMMITTED: "Committed",
  BRED: "Bred",
  BIRTHED: "Birthed",
  WEANED: "Weaned",
  HOMING_STARTED: "Homing Started",
  COMPLETE: "Complete",
  CANCELED: "Canceled",
};

export function deriveBreedingStatus(p: {
  name?: string | null;
  species?: string | null;
  damId?: number | null;
  sireId?: number | null;
  lockedCycleStart?: string | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  status?: string | null;
}): Status {
  const explicit = (p.status ?? "").toUpperCase();
  if (explicit === "CANCELED") return "CANCELED";

  if (p.completedDateActual?.trim()) return "COMPLETE";
  if ((p.placementCompletedDateActual ?? p.placementStartDateActual)?.trim()) return "HOMING_STARTED";
  if (p.weanedDateActual?.trim()) return "WEANED";
  if (p.birthDateActual?.trim()) return "BIRTHED";
  if (p.breedDateActual?.trim()) return "BRED";

  const hasBasics = Boolean((p.name ?? "").trim() && (p.species ?? "").trim() && p.damId != null);
  const hasCommitPrereqs = hasBasics && p.sireId != null && (p.lockedCycleStart ?? "").trim();

  if (hasCommitPrereqs) return "COMMITTED";
  return "PLANNING";
}
