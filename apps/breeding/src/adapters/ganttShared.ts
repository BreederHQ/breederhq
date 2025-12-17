// apps/breeding/src/adapters/ganttShared.ts
import type { BHQGanttStage } from "@bhq/ui/components/Gantt/Gantt";

export type StageKey =
  | "preBreeding"
  | "hormoneTesting"
  | "breeding"
  | "birth"
  | "postBirthCare"
  | "placement"
  | "placementExtended";

export const STAGE_ORDER: StageKey[] = [
  "preBreeding",
  "hormoneTesting",
  "breeding",
  "birth",
  "postBirthCare",
  "placement",
  "placementExtended",
];

// Visual defaults only. No biology math here.
export function defaultStageVisuals(): Array<{ key: StageKey; label: string; baseColor: string; hatchLikely?: boolean }> {
  return [
    { key: "preBreeding", label: "Pre-breeding Heat", baseColor: "hsl(var(--brand-blue, 215 90% 60%))", hatchLikely: true },
    { key: "hormoneTesting", label: "Hormone Testing", baseColor: "hsl(var(--brand-orange, 36 100% 50%))", hatchLikely: true },
    { key: "breeding", label: "Breeding", baseColor: "hsl(var(--brand-purple, 265 85% 65%))", hatchLikely: true },
    { key: "birth", label: "Birth", baseColor: "hsl(var(--brand-pink, 345 80% 55%))", hatchLikely: true },
    { key: "postBirthCare", label: "Post-birth Care", baseColor: "hsl(var(--brand-green, 150 70% 45%))", hatchLikely: true },
    { key: "placement", label: "Placement", baseColor: "hsl(var(--brand-teal, 175 70% 42%))", hatchLikely: true },
    { key: "placementExtended", label: "Placement, Extended", baseColor: "hsl(var(--brand-slate, 215 20% 45%))" },
  ];
}

export const GANTT_STAGES: BHQGanttStage[] = defaultStageVisuals().map((s) => ({
  key: s.key,
  label: s.label,
  baseColor: s.baseColor,
  hatchLikely: !!s.hatchLikely,
}));

// Local helper only, used by UI horizon math in a few spots.
// No breedingMath dependency.
export function monthsBetween(a: Date, b: Date): number {
  const ay = a.getUTCFullYear();
  const am = a.getUTCMonth();
  const by = b.getUTCFullYear();
  const bm = b.getUTCMonth();
  return (by - ay) * 12 + (bm - am);
}
