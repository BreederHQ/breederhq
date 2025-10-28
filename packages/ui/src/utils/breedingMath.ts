// packages/ui/src/utils/breedingMath.ts
// Pure util: biology math + windows for Gantt and Calendar

export type Species = "DOG" | "CAT" | "HORSE";

export type DateLike = Date | string | number;

export type Range = { start: Date; end: Date }; // inclusive end-date math for bars

export type StageKey =
  | "preBreeding"
  | "hormoneTesting"
  | "breeding"
  | "whelping"
  | "puppyCare"
  | "goHomeNormal"
  | "goHomeExtended";

export type StageWindows = {
  key: StageKey;
  full: Range;
  likely?: Range;
};

export type TravelBand = {
  kind: "risk" | "unlikely";
  range: Range;
  label: string;
};

export type WindowsResult = {
  stages: StageWindows[];
  travel: TravelBand[];
  today: Date;
  horizon: Range;
};

export type CycleDefaults = {
  cycleLenDays: number;
  startBufferDays: number;
  ovulationDayFromHeatStart: number; // 12 by default
};

export const DEFAULTS: CycleDefaults = {
  cycleLenDays: 180,
  startBufferDays: 14,
  ovulationDayFromHeatStart: 12,
};

// helpers
export function toDate(d: DateLike): Date {
  return d instanceof Date ? d : new Date(d);
}

export function addDays(d: DateLike, n: number): Date {
  const dt = toDate(d);
  const out = new Date(dt);
  out.setDate(out.getDate() + n);
  return out;
}

export function clampRange(r: Range, min: Date, max: Date): Range {
  return {
    start: new Date(Math.max(r.start.getTime(), min.getTime())),
    end: new Date(Math.min(r.end.getTime(), max.getTime())),
  };
}

export function makeRange(start: DateLike, end: DateLike): Range {
  return { start: toDate(start), end: toDate(end) };
}

export function daysBetweenInclusive(a: DateLike, b: DateLike): number {
  const A = Date.UTC(toDate(a).getFullYear(), toDate(a).getMonth(), toDate(a).getDate());
  const B = Date.UTC(toDate(b).getFullYear(), toDate(b).getMonth(), toDate(b).getDate());
  return Math.floor((B - A) / 86400000) + 1;
}

// biology rules
export type HeatWindow = {
  earliestHeatStart: Date;
  latestHeatStart: Date;
};

export type PlanAnchors = {
  species: Species;
  heat: HeatWindow;
  ovulationDate?: Date | null;
};

export type StageLabels = Record<StageKey, string>;

export const DEFAULT_STAGE_LABELS: StageLabels = {
  preBreeding: "Pre-breeding Heat",
  hormoneTesting: "Hormone Testing",
  breeding: "Breeding",
  whelping: "Whelping",
  puppyCare: "Puppy Care",
  goHomeNormal: "Go Home, Normal",
  goHomeExtended: "Go Home, Extended",
};

// default order top to bottom, provided for callers that want it
export const DEFAULT_STAGE_ORDER: StageKey[] = [
  "preBreeding",
  "hormoneTesting",
  "breeding",
  "whelping",
  "puppyCare",
  "goHomeNormal",
  "goHomeExtended",
];

export function computeWindows(
  anchors: PlanAnchors,
  opts?: Partial<CycleDefaults>
): WindowsResult {
  const cfg = { ...DEFAULTS, ...opts };
  const { earliestHeatStart, latestHeatStart } = anchors.heat;
  const ovulationOffset = cfg.ovulationDayFromHeatStart;
  const today = new Date();

  const earliestOvulation = addDays(earliestHeatStart, ovulationOffset);
  const latestOvulation = addDays(latestHeatStart, ovulationOffset);

  const ovulationCenter =
    anchors.ovulationDate ??
    new Date(Math.round((earliestOvulation.getTime() + latestOvulation.getTime()) / 2));

  // Pre-breeding Heat
  const preBreedingFull = makeRange(
    earliestHeatStart,
    addDays(latestHeatStart, ovulationOffset - 1)
  );
  const heatCenter = new Date(
    Math.round((earliestHeatStart.getTime() + latestHeatStart.getTime()) / 2)
  );
  const preBreedingLikelyRaw = makeRange(addDays(heatCenter, -5), addDays(heatCenter, +5));

  // Hormone Testing
  const hormoneFull = makeRange(addDays(earliestHeatStart, 7), latestOvulation);
  const hormoneLikelyRaw = makeRange(addDays(preBreedingLikelyRaw.end, 1), addDays(preBreedingLikelyRaw.end, 7));

  // Breeding
  const breedingFull = makeRange(
    addDays(earliestHeatStart, ovulationOffset - 1),
    addDays(latestHeatStart, ovulationOffset + 2)
  );
  const breedingLikely = makeRange(ovulationCenter, addDays(ovulationCenter, 1));

  // Whelping
  const whelpFull = makeRange(addDays(ovulationCenter, 61), addDays(ovulationCenter, 65));
  const whelpLikely = makeRange(addDays(ovulationCenter, 62), addDays(ovulationCenter, 64));

  // Puppy Care
  const puppyCareFull = makeRange(whelpFull.start, addDays(whelpFull.end, 56));
  const puppyCareLikely = makeRange(whelpLikely.start, addDays(whelpLikely.end, 56));

  // Go Home Normal
  const goHomeNormalFull = makeRange(addDays(whelpFull.start, 56), addDays(whelpFull.end, 56));
  const goHomeNormalLikely = makeRange(addDays(whelpLikely.start, 55), addDays(whelpLikely.end, 57));

  // Go Home Extended
  const goHomeExtendedFull = makeRange(addDays(goHomeNormalFull.end, 1), addDays(goHomeNormalFull.end, 21));

  // Cap likely windows into full windows
  const preBreedingLikely = clampRange(preBreedingLikelyRaw, preBreedingFull.start, preBreedingFull.end);
  const hormoneLikely = clampRange(hormoneLikelyRaw, hormoneFull.start, hormoneFull.end);

  // Travel bands
  const travel: TravelBand[] = [
    { kind: "risk", range: makeRange(hormoneFull.start, breedingFull.end), label: "Travel Risky" },
    { kind: "risk", range: makeRange(whelpFull.start, goHomeExtendedFull.end), label: "Travel Risky" },
    { kind: "unlikely", range: makeRange(hormoneLikely.start, breedingLikely.end), label: "Travel Unlikely" },
    { kind: "unlikely", range: makeRange(puppyCareLikely.start, goHomeNormalLikely.end), label: "Travel Unlikely" },
  ];

  // Horizon about 18 months from the first stage start
  const minStart = preBreedingFull.start;
  const horizon = makeRange(minStart, addDays(minStart, 548));

  const stages: StageWindows[] = [
    { key: "preBreeding", full: preBreedingFull, likely: preBreedingLikely },
    { key: "hormoneTesting", full: hormoneFull, likely: hormoneLikely },
    { key: "breeding", full: breedingFull, likely: breedingLikely },
    { key: "whelping", full: whelpFull, likely: whelpLikely },
    { key: "puppyCare", full: puppyCareFull, likely: puppyCareLikely },
    { key: "goHomeNormal", full: goHomeNormalFull, likely: goHomeNormalLikely },
    { key: "goHomeExtended", full: goHomeExtendedFull },
  ];

  return { stages, travel, today, horizon };
}

// Convenience: derive from a plan slice
export type MinimalPlan = {
  species: Species;
  earliestHeatStart: DateLike;
  latestHeatStart: DateLike;
  ovulationDate?: DateLike | null;
};

export function fromPlan(plan: MinimalPlan, opts?: Partial<CycleDefaults>): WindowsResult {
  return computeWindows(
    {
      species: plan.species,
      heat: {
        earliestHeatStart: toDate(plan.earliestHeatStart),
        latestHeatStart: toDate(plan.latestHeatStart),
      },
      ovulationDate: plan.ovulationDate ? toDate(plan.ovulationDate) : null,
    },
    opts
  );
}

// Calendar events helper
export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date; // exclusive for FullCalendar
  allDay?: boolean;
  meta?: Record<string, unknown>;
};

export function windowsToCalendarEvents(
  planId: string,
  labels: StageLabels,
  windows: WindowsResult
): CalendarEvent[] {
  const add1 = (d: Date) => addDays(d, 1); // exclusive end
  const events: CalendarEvent[] = [];
  for (const s of windows.stages) {
    events.push({
      id: `${planId}:${s.key}:full`,
      title: `${labels[s.key]} (Full)`,
      start: s.full.start,
      end: add1(s.full.end),
      allDay: true,
      meta: { stage: s.key, type: "full", planId },
    });
    if (s.likely) {
      events.push({
        id: `${planId}:${s.key}:likely`,
        title: `${labels[s.key]} (Likely)`,
        start: s.likely.start,
        end: add1(s.likely.end),
        allDay: true,
        meta: { stage: s.key, type: "likely", planId },
      });
    }
  }
  for (const t of windows.travel) {
    events.push({
      id: `${planId}:travel:${t.kind}:${t.range.start.toISOString()}`,
      title: t.label,
      start: t.range.start,
      end: add1(t.range.end),
      allDay: true,
      meta: { stage: "travel", type: t.kind, planId },
    });
  }
  return events;
}
