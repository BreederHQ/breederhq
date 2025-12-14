import type { ProjectUpcomingCyclesOpts, ProjectedCycleStart, ReproSummary } from "./types";
import { computeEffectiveCycleLenDays } from "./effectiveCycleLen";
import { getSpeciesDefaults } from "./defaults";

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function addMonthsApprox(iso: string, months: number): string {
  return addDays(iso, months * 30);
}

export function projectUpcomingCycleStarts(
  summary: ReproSummary,
  opts: ProjectUpcomingCyclesOpts,
): { projected: ProjectedCycleStart[]; effective: ReturnType<typeof computeEffectiveCycleLenDays> } {
  const d = getSpeciesDefaults(summary.species);
  const effective = computeEffectiveCycleLenDays({
    species: summary.species,
    cycleStartsAsc: summary.cycleStartsAsc,
  });

  const horizonMonths = opts.horizonMonths ?? 36;
  const horizonEnd = addMonthsApprox(summary.today, horizonMonths);
  const maxCount = opts.maxCount ?? 12;

  const projected: ProjectedCycleStart[] = [];

  // Safety guard so we never get a zero or NaN length
  const effLen = Number(effective.effectiveCycleLenDays || d.cycleLenDays || 1);
  if (!Number.isFinite(effLen) || effLen <= 0) {
    return { projected, effective };
  }

  const last = summary.cycleStartsAsc.length
    ? summary.cycleStartsAsc[summary.cycleStartsAsc.length - 1]
    : null;

  let seed: string;
  let source: ProjectedCycleStart["source"];
  let explain: string;

  if (last) {
    seed = addDays(last, effLen);
    source = "HISTORY";
    explain = "Projected from last recorded cycle start and effective cycle length.";
  } else if (summary.dob) {
    seed = addDays(summary.dob, d.juvenileFirstCycleLikelyDays);
    source = "JUVENILE";
    explain = "No cycle history, projected from juvenile first cycle default.";
  } else {
    seed = addDays(summary.today, d.cycleLenDays);
    source = "BIOLOGY";
    explain = "No cycle history, projected from biology default.";
  }

  let cur = seed;

  while (projected.length < maxCount) {
    // Skip stale dates before today once we have at least one result
    if (cur < summary.today && projected.length > 0) {
      cur = addDays(cur, effLen);
      continue;
    }

    // Respect the horizon for additional entries, but always allow the first one
    if (projected.length > 0 && cur > horizonEnd) {
      break;
    }

    projected.push({ date: cur, source, explain });

    const next = addDays(cur, effLen);
    if (next === cur) {
      break;
    }
    cur = next;
  }

  return { projected, effective };
}
