// packages/ui/src/utils/weights.ts
export type WeightEntry = { date: string; value: number }; // value in current unit

export function weightTrendColor(current: WeightEntry, previous?: WeightEntry) {
  if (!previous) return "var(--text)"; // neutral
  if (current.value < previous.value) return "var(--red-600)";
  if (current.value === previous.value) return "var(--amber-600)";
  return "var(--green-600)";
}
