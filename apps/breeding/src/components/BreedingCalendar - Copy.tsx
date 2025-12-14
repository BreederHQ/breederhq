// apps/breeding/src/components/BreedingCalendar.tsx
import * as React from "react";
import { Calendar as BHQCalendar } from "@bhq/ui/components/Calendar";
import { computeAvailabilityBands } from "@bhq/ui/utils/availability";

import {
  windowsFromPlan,
  colorFromId,
  type PlanRow as NormalizedPlan,
  type Range,
} from "../adapters/planToGantt";
import { eventsForItems } from "../adapters/planToEvents";

/* ───────────────────────── helpers ───────────────────────── */

function toFcEvent(ev: {
  id: string;
  planId: string | number;
  planName: string;
  date: string; // yyyy-mm-dd
  color: string;
  kind: string;
}) {
  return {
    id: ev.id,
    title: ev.planName ? `${ev.kind.replace(/_/g, " ").toLowerCase()}` : ev.kind,
    start: new Date(ev.date),
    allDay: true,
    calendarId: `plan:${ev.planId}`,
    color: ev.color,
    extendedProps: { planId: String(ev.planId), variant: "expected" as const, kind: ev.kind },
  };
}

/* ───────────────────────── component ───────────────────────── */

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

  // Left rail groups
  const planGroup = React.useMemo(() => {
    const groupItems = items.map((p) => ({
      id: `plan:${p.id}`,
      label: String(p.name || `Plan ${p.id}`),
      color: colorFromId(p.id),
      defaultOn: selectedSet ? selectedSet.has(p.id as any) : true,
    }));
    return { id: "breeding:plans", label: "Breeding Plans", items: groupItems };
  }, [items, selectedSet]);

  const overlayGroup = React.useMemo(
    () => ({
      id: "overlays",
      label: "Overlays",
      items: [{ id: "overlay:availability", label: "Availability Bands", color: "#F59E0B", defaultOn: false }],
    }),
    []
  );

  const groups = React.useMemo(() => [planGroup, overlayGroup], [planGroup, overlayGroup]);

  // Calendar events: anchor points from adapter + availability overlay derived from stage windows
  const events = React.useMemo(() => {
    const pointEvents = eventsForItems(items, {
      horizon: horizon ?? undefined,
      planIds: selectedSet ?? undefined,
    }).map(toFcEvent);

    const overlayEvents = items
      .filter((p) => !selectedSet || selectedSet.has(p.id as any))
      .flatMap((p) => {
        const stages = windowsFromPlan(p);
        const bands = computeAvailabilityBands(stages);
        const planId = String(p.id);
        const baseColor = colorFromId(p.id);

        return bands.map((b, i) => ({
          id: `plan:${planId}:avail:${b.kind}:${i}`,
          title: b.label,
          start: b.range.start,
          end: b.range.end,
          allDay: true,
          calendarId: "overlay:availability",
          color: b.kind === "risky" ? "#EF4444" : baseColor,
          extendedProps: { planId, variant: "availability" as const, availabilityKind: b.kind },
        }));
      });

    // Optional horizon clamp for overlay spans too
    const clamped = horizon
      ? overlayEvents.filter((e) => {
          const s = new Date(e.start as any).getTime();
          const en = new Date(e.end as any).getTime();
          return en >= horizon.start.getTime() && s <= horizon.end.getTime();
        })
      : overlayEvents;

    return [...pointEvents, ...clamped];
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
