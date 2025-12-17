// apps/breeding/src/components/BreedingCalendar.tsx

import * as React from "react";
import { Calendar as BHQCalendar } from "@bhq/ui/components/Calendar";
import { computeAvailabilityBands } from "@bhq/ui/utils/availability";

import {
  windowsFromPlan,
  colorFromId,
  type NormalizedPlan,
  type Range,
  type PlanStageWindows,
} from "../adapters/planToGantt";

type StageLike = {
  id: string;
  label: string;
  full: { start: string; end: string };
  likely?: { start: string; end: string } | null;
};

function asIsoDay(x: any): string | null {
  if (!x) return null;
  if (typeof x === "string") return x.slice(0, 10);
  if (x instanceof Date) return x.toISOString().slice(0, 10);
  return null;
}

function isoToDate(iso: string): Date {
  // ISO date only, interpret as UTC midnight
  return new Date(`${iso}T00:00:00.000Z`);
}

function isPlanSelected(selectedSet: Set<string | number> | null, planId: string): boolean {
  if (!selectedSet) return true;

  // Support both raw ids ("3") and calendar item ids ("plan:3")
  if (selectedSet.has(planId as any)) return true;
  if (selectedSet.has(`plan:${planId}` as any)) return true;

  // Also support numeric ids in the set
  const n = Number(planId);
  if (!Number.isNaN(n) && selectedSet.has(n as any)) return true;

  return false;
}

function stagesFromPlanWindows(w: PlanStageWindows | null | undefined): StageLike[] {
  if (!w) return [];

  const mk = (
    id: string,
    label: string,
    fullKey: keyof PlanStageWindows,
    likelyKey: keyof PlanStageWindows
  ): StageLike | null => {
    const full = (w as any)[fullKey] as [string, string] | undefined;
    if (!full || !full[0] || !full[1]) return null;

    const fullStart = asIsoDay(full[0]);
    const fullEnd = asIsoDay(full[1]);
    if (!fullStart || !fullEnd) return null;

    const likely = (w as any)[likelyKey] as [string, string] | undefined;
    const likelyStart = likely ? asIsoDay(likely[0]) : null;
    const likelyEnd = likely ? asIsoDay(likely[1]) : null;

    return {
      id,
      label,
      full: { start: fullStart, end: fullEnd },
      likely: likelyStart && likelyEnd ? { start: likelyStart, end: likelyEnd } : null,
    };
  };

  const out: Array<StageLike | null> = [
    mk("pre_breeding", "Pre-breeding Heat", "pre_breeding_full", "pre_breeding_likely"),
    mk("hormone_testing", "Hormone Testing", "hormone_testing_full", "hormone_testing_likely"),
    mk("breeding", "Breeding", "breeding_full", "breeding_likely"),
    mk("birth", "Birth", "birth_full", "birth_likely"),
    mk("post_birth_care", "Post-birth Care", "post_birth_care_full", "post_birth_care_likely"),
    mk("placement_normal", "Placement", "placement_normal_full", "placement_normal_likely"),
    mk("placement_extended", "Placement, Extended", "placement_extended_full", "placement_extended_likely"),
  ];

  return out.filter(Boolean) as StageLike[];
}

export default function BreedingCalendar({
  items = [],
  selectedPlanIds,
  horizon,
  navigateToPlan,
  className,
}: {
  items?: NormalizedPlan[];
  selectedPlanIds?: Array<string | number> | Set<string | number>;
  horizon?: Range;
  navigateToPlan?: (id: string | number) => void;
  className?: string;
}) {
  const selectedSet: Set<string | number> | null = React.useMemo(() => {
    if (!selectedPlanIds) return null;
    return selectedPlanIds instanceof Set ? selectedPlanIds : new Set(selectedPlanIds);
  }, [selectedPlanIds]);

  const planGroup = React.useMemo(() => {
    const groupItems = (items || []).map((p) => {
      const id = String(p.id);
      return {
        id: `plan:${id}`,
        label: String(p.name || `Plan ${id}`),
        color: colorFromId(id),
        defaultOn: isPlanSelected(selectedSet, id),
      };
    });

    return { id: "breeding:plans", label: "Breeding Plans", items: groupItems };
  }, [items, selectedSet]);

  const overlayGroup = React.useMemo(
    () => ({
      id: "overlays",
      label: "Overlays",
      items: [
        {
          id: "overlay:availability",
          label: "Availability Bands",
          color: "#F59E0B",
          defaultOn: false,
        },
      ],
    }),
    []
  );

  const groups = React.useMemo(() => [planGroup, overlayGroup], [planGroup, overlayGroup]);

  const events = React.useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [] as any[];

    const pointEvents: any[] = [];
    const overlayEvents: any[] = [];

    for (const p of items) {
      const planId = String(p.id);
      if (!isPlanSelected(selectedSet, planId)) continue;

      const planName = String(p.name || `Plan ${planId}`);
      const baseColor = colorFromId(planId);

      let w: PlanStageWindows | null = null;
      try {
        // windowsFromPlan expects a small shape. NormalizedPlan already carries fields it needs.
        w = windowsFromPlan({
          species: (p as any).species ?? (p as any).damSpecies ?? null,
          dob: (p as any).dob ?? (p as any).birthDate ?? null,
          lockedCycleStart: (p as any).lockedCycleStart ?? null,
          earliestCycleStart: (p as any).earliestCycleStart ?? null,
          latestCycleStart: (p as any).latestCycleStart ?? null,
        } as any);
      } catch (err) {
        console.error("[BreedingCalendar] windowsFromPlan failed", { planId, err });
        w = null;
      }

      // Prefer adapter output, fall back to precomputed windows if caller already attached them.
      const stages =
        stagesFromPlanWindows(w) ||
        stagesFromPlanWindows((p as any).windows as any) ||
        [];

      if (!stages.length) continue;

      // 1) Milestone markers: stage full-starts (all-day markers, no end)
      for (const st of stages) {
        const startIso = asIsoDay(st.full?.start);
        if (!startIso) continue;

        pointEvents.push({
          id: `plan:${planId}:pt:${st.id}:${startIso}`,
          title: `${st.label} (${planName})`,
          start: isoToDate(startIso),
          allDay: true,
          calendarId: `plan:${planId}`,
          color: baseColor,
          extendedProps: {
            planId,
            variant: "expected",
            kind: st.id,
          },
        });
      }

      // 2) Availability overlays (uses stage windows)
      let bands: any[] = [];
      try {
        bands = computeAvailabilityBands(stages as any) || [];
      } catch (err) {
        console.error("[BreedingCalendar] computeAvailabilityBands failed", { planId, err });
        bands = [];
      }

      for (const [i, b] of bands.entries()) {
        const s = asIsoDay(b?.range?.start);
        const e = asIsoDay(b?.range?.end);
        if (!s || !e) continue;

        overlayEvents.push({
          id: `plan:${planId}:avail:${b.kind}:${i}`,
          title: b.label,
          start: isoToDate(s),
          end: isoToDate(e),
          allDay: true,
          calendarId: "overlay:availability",
          color: b.kind === "risky" ? "#EF4444" : baseColor,
          extendedProps: {
            planId,
            variant: "availability",
            availabilityKind: b.kind,
          },
        });
      }
    }

    const all = [...pointEvents, ...overlayEvents];

    if (!horizon) return all;

    const hs = horizon.start.getTime();
    const he = horizon.end.getTime();

    return all.filter((e) => {
      const s = (e.start instanceof Date ? e.start : new Date(e.start)).getTime();
      const en = (e.end ? (e.end instanceof Date ? e.end : new Date(e.end)) : e.start).getTime();
      return en >= hs && s <= he;
    });
  }, [items, selectedSet, horizon]);

  return (
    <BHQCalendar
      className={className}
      headerTitle="Breeding Calendar"
      groups={groups}
      events={events}
      storageKey="bhq_calendar_breeding_v2"
      onEventClick={(ev) => {
        const planId = String((ev as any)?.extendedProps?.planId ?? "");
        if (planId) navigateToPlan?.(planId);
      }}
    />
  );
}
