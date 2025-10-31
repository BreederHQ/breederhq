// apps/breeding/src/components/BreedingCalendar.tsx
import * as React from "react";
import { Calendar as BHQCalendar } from "@bhq/ui/components/Calendar";
import {
  fromPlan,
  type Species as MathSpecies,
  type StageWindows,
} from "@bhq/ui/utils/breedingMath";
import { computeAvailabilityBands } from "@bhq/ui/utils/availability";

/* ───────────────────────── types ───────────────────────── */

type PlanRow = {
  id: string | number;
  name: string;
  species: "Dog" | "Cat" | "Horse" | "";
  earliestHeatStart?: string | Date | null;
  latestHeatStart?: string | Date | null;
  ovulationDate?: string | Date | null;
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;

  // Actuals (aligned to DB)
  actualCycleStart?: string | Date | null;
  actualHormoneTestingStart?: string | Date | null;
  actualBreedingDate?: string | Date | null;
  actualWhelpedDate?: string | Date | null;
  actualWeanedDate?: string | Date | null;
  placementStartDateActual?: string | Date | null;      // was actualHomingStartedDate
  placementCompletedDateActual?: string | Date | null;  // was actualHomingExtendedEnds
  actualPlanCompletedDate?: string | Date | null;

  // Legacy aliases (still tolerated if present)
  actualHeatStart?: string | Date | null;
  actualOvulationDate?: string | Date | null;
  actualWhelpDate?: string | Date | null;
  actualGoHomeDate?: string | Date | null;
};

/* ───────────────────────── helpers ───────────────────────── */

const COLORS = [
  "#7C3AED", "#2563EB", "#059669", "#16A34A", "#84CC16",
  "#F59E0B", "#EA580C", "#DC2626", "#E11D48", "#DB2777",
  "#8B5CF6", "#06B6D4", "#22C55E", "#10B981", "#A3E635",
  "#F97316", "#EF4444", "#F43F5E", "#D946EF", "#6366F1",
];

const colorFor = (i: number) => COLORS[i % COLORS.length];
const toIso = (d: Date | string | null | undefined) =>
  d == null ? null : (d instanceof Date ? d : new Date(d)).toISOString();
const isValidDateish = (v: any) => v != null && !Number.isNaN(new Date(v as any).getTime());
const centerOf = (r: { start: Date; end: Date }) => new Date((r.end.getTime() + r.start.getTime()) / 2);

function byKey(stages: StageWindows[]) {
  return new Map(stages.map((s) => [s.key, s]));
}

function expectedPoints(stages: StageWindows[]) {
  const m = byKey(stages);
  const pre = m.get("preBreeding");
  const test = m.get("hormoneTesting");
  const breed = m.get("breeding");
  const whelp = m.get("whelping");
  const puppy = m.get("puppyCare");
  const placeStart = m.get("goHomeNormal");
  const placeExt = m.get("goHomeExtended") ?? placeStart;

  return [
    { key: "Cycle Start (Expected)", date: pre?.likely?.start ?? pre?.full.start ?? null },
    { key: "Hormone Testing Start (Expected)", date: test?.likely?.start ?? test?.full.start ?? null },
    { key: "Breeding Date (Expected)", date: breed?.likely?.start ?? (breed ? centerOf(breed.full) : null) },
    { key: "Whelping Date (Expected)", date: whelp?.likely ? centerOf(whelp.likely) : (whelp ? centerOf(whelp.full) : null) },
    { key: "Weaned Date (Expected)", date: puppy?.likely?.end ?? puppy?.full.end ?? null },
    { key: "Placement Starts (Expected)", date: placeStart?.likely?.start ?? placeStart?.full.start ?? null },
    { key: "Placement Extended Ends (Expected)", date: placeExt?.full.end ?? null },
  ].filter((x): x is { key: string; date: Date } => Boolean(x.date));
}

function actualPoints(p: PlanRow) {
  const pick = (v: any) => (isValidDateish(v) ? new Date(v as any) : null);
  return [
    { key: "Cycle Start (Actual)", date: pick(p.actualCycleStart ?? p.actualHeatStart) },
    { key: "Hormone Testing Start (Actual)", date: pick(p.actualHormoneTestingStart) },
    { key: "Breeding Date (Actual)", date: pick(p.actualBreedingDate) },
    { key: "Whelped Date (Actual)", date: pick(p.actualWhelpedDate ?? p.actualWhelpDate) },
    { key: "Weaned Date (Actual)", date: pick(p.actualWeanedDate) },
    { key: "Placement Started (Actual)", date: pick(p.placementStartDateActual ?? p.actualGoHomeDate) },
    { key: "Placement Completed (Actual)", date: pick(p.placementCompletedDateActual) },
    { key: "Plan Completed (Actual)", date: pick(p.actualPlanCompletedDate) },
  ].filter((x): x is { key: string; date: Date } => Boolean(x.date));
}

/* ───────────────────────── component ───────────────────────── */

export default function BreedingCalendar({
  plans = [],
  navigateToPlan,
  className,
}: {
  plans?: PlanRow[];
  navigateToPlan?: (id: string) => void;
  className?: string;
}) {
  // Left rail groups
  const planGroup = React.useMemo(() => {
    const items = plans.map((p, idx) => ({
      id: `plan:${p.id}`,
      label: String(p.name || `Plan ${p.id}`),
      color: colorFor(idx),
      defaultOn: true,
    }));
    return { id: "breeding:plans", label: "Breeding Plans", items };
  }, [plans]);

  const overlayGroup = React.useMemo(() => {
    return {
      id: "overlays",
      label: "Overlays",
      items: [
        { id: "overlay:availability", label: "Availability Bands", color: "#F59E0B", defaultOn: false },
      ],
    };
  }, []);

  const groups = React.useMemo(() => [planGroup, overlayGroup], [planGroup, overlayGroup]);

  // Calendar events: expected and actual points for every plan + optional availability overlay
  const events = React.useMemo(() => {
    return plans.flatMap((p, idx) => {
      const species: MathSpecies =
        p.species === "Dog" || p.species === "Cat" || p.species === "Horse" ? p.species : "Dog";

      // If only lockedCycleStart exists, use it for both bounds
      const locked = p.lockedCycleStart ?? null;
      const earliest = p.earliestHeatStart ?? locked ?? null;
      const latest = p.latestHeatStart ?? locked ?? null;
      if (!earliest || !latest) return [];

      const math = fromPlan({
        species,
        earliestHeatStart: toIso(earliest)!,
        latestHeatStart: toIso(latest)!,
        ovulationDate: toIso(p.ovulationDate ?? p.lockedOvulationDate ?? null),
      });

      const baseColor = colorFor(idx);
      const planId = String(p.id);

      const points = [
        ...expectedPoints(math.stages).map((m, i) => ({
          id: `plan:${planId}:exp:${i}`,
          title: m.key,
          start: m.date,
          allDay: true,
          calendarId: `plan:${planId}`,
          color: baseColor,
          extendedProps: { planId, variant: "expected" as const },
        })),
        ...actualPoints(p).map((m, i) => ({
          id: `plan:${planId}:act:${i}`,
          title: m.key,
          start: m.date,
          allDay: true,
          calendarId: `plan:${planId}`,
          color: baseColor,
          extendedProps: { planId, variant: "actual" as const },
        })),
      ];

      const bands = computeAvailabilityBands(math.stages);
      const overlay = bands.map((b, i) => {
        const kind = b.kind; // already "risky" | "unlikely"
        return {
          id: `plan:${planId}:avail:${kind}:${i}`,
          title: b.label,
          start: b.range.start,
          end: b.range.end,
          allDay: true,
          calendarId: "overlay:availability",
          color: kind === "risky" ? "#EF4444" : "#F59E0B",
          extendedProps: { planId, variant: "availability" as const, availabilityKind: kind },
        };
      });

      return [...points, ...overlay];
    });
  }, [plans]);

  return (
    <BHQCalendar
      className={className}
      headerTitle="Breeding Calendar"
      groups={groups}
      events={events}
      storageKey="bhq_calendar_breeding_v1"
      onEventClick={(ev) => {
        const planId = String((ev.extendedProps as any)?.planId ?? "");
        if (planId) navigateToPlan?.(planId);
      }}
    />
  );
}
