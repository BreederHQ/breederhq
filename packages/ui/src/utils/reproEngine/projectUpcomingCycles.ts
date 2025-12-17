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

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function clampIsoToToday(iso: string, today: string): string {
  return iso < today ? today : iso;
}

export function projectUpcomingCycleStarts(
  summary: ReproSummary,
  opts: ProjectUpcomingCyclesOpts,
): { projected: ProjectedCycleStart[]; effective: ReturnType<typeof computeEffectiveCycleLenDays> } {
  const d = getSpeciesDefaults(summary.species);

  // Hard guard: callers sometimes pass undefined here, and effectiveCycleLen reads .length
  const cycleStartsAsc: string[] = Array.isArray((summary as any).cycleStartsAsc)
    ? ((summary as any).cycleStartsAsc as string[])
    : [];

  const today = String(summary.today).slice(0, 10);
  const horizonMonths = opts.horizonMonths ?? 36;
  const horizonEnd = addMonthsApprox(today, horizonMonths);
  const maxCount = opts.maxCount ?? 12;

  const effective = computeEffectiveCycleLenDays({
    species: summary.species,
    cycleStartsAsc,
  });

  const projected: ProjectedCycleStart[] = [];

  // Safety guard so we never project with 0, negative, NaN, or Infinity
  const effLenRaw = Number((effective as any)?.effectiveCycleLenDays);
  const effLen = Number.isFinite(effLenRaw) && effLenRaw > 0 ? effLenRaw : Number(d.cycleLenDays) || 1;
  if (!Number.isFinite(effLen) || effLen <= 0) {
    return { projected, effective };
  }

  const lastCycle = cycleStartsAsc.length ? cycleStartsAsc[cycleStartsAsc.length - 1] : null;

  // Optional postpartum gating. Summary may or may not include this field yet.
  // If present, it prevents projecting a next cycle earlier than postpartum likely.
  const lastBirthIso: string | null = (summary as any).lastBirthIso
    ? String((summary as any).lastBirthIso).slice(0, 10)
    : null;

  const postpartumLikely = lastBirthIso ? addDays(lastBirthIso, d.postpartumLikelyDays) : null;

  // Next-from-history (only if we have history)
  const nextFromHistory = lastCycle ? addDays(lastCycle, effLen) : null;

  // Seed selection, in priority order:
  // - history next cycle (gated by postpartum if applicable)
  // - juvenile first cycle (DOB based) (also gated by postpartum if applicable)
  // - biology from today (also gated by postpartum if applicable)
  const dobIso: string | null = summary.dob ? String(summary.dob).slice(0, 10) : null;

  let seed: string;
  let source: ProjectedCycleStart["source"];
  let explain: string;

  if (nextFromHistory) {
    const gated = maxIso(nextFromHistory, postpartumLikely);
    seed = gated ?? nextFromHistory;
    source = "HISTORY";
    explain =
      gated && gated !== nextFromHistory
        ? "Projected from last recorded cycle start and effective cycle length, then shifted later to respect postpartum likely minimum."
        : "Projected from last recorded cycle start and effective cycle length.";
  } else if (dobIso) {
    const juvenile = addDays(dobIso, d.juvenileFirstCycleLikelyDays);
    const gated = maxIso(juvenile, postpartumLikely);
    seed = gated ?? juvenile;
    source = "JUVENILE";
    explain =
      gated && gated !== juvenile
        ? "No cycle history, projected from juvenile first-cycle default, then shifted later to respect postpartum likely minimum."
        : "No cycle history, projected from juvenile first-cycle default.";
  } else {
    const bio = addDays(today, d.cycleLenDays);
    const gated = maxIso(bio, postpartumLikely);
    seed = gated ?? bio;
    source = "BIOLOGY";
    explain =
      gated && gated !== bio
        ? "No cycle history, projected from biology default, then shifted later to respect postpartum likely minimum."
        : "No cycle history, projected from biology default.";
  }

  // Step length:
  // - if we have history, use effective cycle length
  // - otherwise use biology cycle length for that species
  const stepLen = lastCycle ? effLen : d.cycleLenDays;

  let cur = seed;

  while (projected.length < maxCount && cur <= horizonEnd) {
    // Never emit dates before today
    cur = clampIsoToToday(cur, today);

    projected.push({ date: cur, source, explain });

    const next = addDays(cur, stepLen);
    if (next === cur) break;
    cur = next;
  }

  return { projected, effective };
}
