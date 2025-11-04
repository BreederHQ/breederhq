// apps/breeding/src/adapters/ganttShared.ts
import type { BHQGanttStage } from "@bhq/ui/components/Gantt/Gantt";
import { monthsBetween } from "@bhq/ui/utils/breedingMath";
export { monthsBetween };

export {
  windowsFromPlan,
  windowsResultFromPlan,
  defaultStageVisuals,
} from "./planWindows";

import { defaultStageVisuals } from "./planWindows";

/** Canonical stage list for the chart */
export const GANTT_STAGES: BHQGanttStage[] = defaultStageVisuals().map((s) => ({
  key: s.key as any,
  label: s.label,
  baseColor: s.baseColor,
  hatchLikely: s.hatchLikely as boolean | undefined,
}));

/** Utility to read color for a given stage key/id */
export function colorFromId(id: string) {
  const hit = defaultStageVisuals().find((s) => s.key === id);
  return hit?.baseColor ?? "hsl(0 0% 60%)";
}
