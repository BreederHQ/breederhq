export type ISODate = string;
export type Species = "DOG" | "CAT" | "HORSE" | "OTHER";

export interface CycleOptions { lastN?: number; fallbackAvgDays?: number; species?: Species; rounding?: "nearest" | "floor" | "ceil"; }
export interface CycleSummary { last: ISODate | null; avgAll: number | null; avgLastN: number | null; next: ISODate | null; }

export const SPECIES_DEFAULTS: Record<Species, number> = { DOG: 180, CAT: 21, HORSE: 21, OTHER: 180 };
const MS_PER_DAY = 86_400_000;

function toUTCDateOnly(iso: ISODate): string {
  const d = new Date(iso); if (Number.isNaN(d.valueOf())) return "";
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}
function daysBetween(aISO: ISODate, bISO: ISODate): number {
  return Math.round(Math.abs(Date.parse(bISO) - Date.parse(aISO)) / MS_PER_DAY);
}
function mean(arr: number[], rounding: NonNullable<CycleOptions["rounding"]>): number | null {
  if (!arr.length) return null; const raw = arr.reduce((s, n) => s + n, 0) / arr.length;
  if (rounding === "floor") return Math.floor(raw); if (rounding === "ceil") return Math.ceil(raw); return Math.round(raw);
}

export function computeCycleSummary(inputDates: ISODate[], opts: CycleOptions = {}): CycleSummary {
  const { lastN = 3, fallbackAvgDays, species = "OTHER", rounding = "nearest" } = opts;
  const dates = inputDates.map(toUTCDateOnly).filter(Boolean).sort();
  const last = dates.at(-1) ?? null;

  const deltas: number[] = []; for (let i = 1; i < dates.length; i++) deltas.push(daysBetween(dates[i - 1], dates[i]));
  const avgAll = mean(deltas, rounding); const avgLastN = mean(deltas.slice(-lastN), rounding);
  const fallback = typeof fallbackAvgDays === "number" && fallbackAvgDays > 0 ? fallbackAvgDays : SPECIES_DEFAULTS[species] ?? SPECIES_DEFAULTS.OTHER;
  const basis = avgLastN ?? avgAll ?? fallback;

  const next = last && basis ? toUTCDateOnly(new Date(Date.parse(last) + basis * MS_PER_DAY).toISOString()) : null;
  return { last, avgAll, avgLastN, next };
}
