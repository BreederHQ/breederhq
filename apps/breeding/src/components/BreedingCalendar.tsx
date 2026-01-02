// apps/breeding/src/components/BreedingCalendar.tsx

import * as React from "react";
import { Calendar as BHQCalendar } from "@bhq/ui/components/Calendar";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";
import { useAvailabilityPrefs } from "@bhq/ui/hooks";
import { mapTenantPrefs } from "@bhq/ui/utils/availability";

import {
  windowsFromPlan,
  colorFromId,
  type NormalizedPlan,
  type PlanStageWindows,
} from "../adapters/planToGantt";

// Local type - Range was missing from planToGantt exports
type Range = { start: Date; end: Date };

import {
  makeBreedingApi,
  type SchedulingAvailabilityBlock,
  type SchedulingBooking,
} from "../api";

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
  // Get tenant availability preferences
  const tenantId = readTenantIdFast?.();
  const hook = useAvailabilityPrefs ? useAvailabilityPrefs({ tenantId }) : undefined;
  const prefs = React.useMemo(() => mapTenantPrefs(hook?.prefs || {}), [hook?.prefs]);

  // User-created events stored in localStorage
  const [userEvents, setUserEvents] = React.useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("bhq_breeding_calendar_user_events");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((e) => ({
            ...e,
            start: new Date(e.start),
            end: e.end ? new Date(e.end) : undefined,
          }));
        }
      }
    } catch {}
    return [];
  });

  React.useEffect(() => {
    try {
      const serialized = userEvents.map((e) => ({
        ...e,
        start: e.start instanceof Date ? e.start.toISOString() : e.start,
        end: e.end instanceof Date ? e.end.toISOString() : e.end,
      }));
      localStorage.setItem("bhq_breeding_calendar_user_events", JSON.stringify(serialized));
    } catch {}
  }, [userEvents]);

  function handleEventCreate(event: any) {
    setUserEvents((prev) => [...prev, event]);
  }

  const selectedSet: Set<string | number> | null = React.useMemo(() => {
    if (!selectedPlanIds) return null;
    return selectedPlanIds instanceof Set ? selectedPlanIds : new Set(selectedPlanIds);
  }, [selectedPlanIds]);

  // Scheduling data for appointments calendar group
  const [schedulingBlocks, setSchedulingBlocks] = React.useState<SchedulingAvailabilityBlock[]>([]);
  const [schedulingBookings, setSchedulingBookings] = React.useState<SchedulingBooking[]>([]);

  React.useEffect(() => {
    if (!tenantId) return;

    const api = makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });

    // Determine date range - use horizon if provided, otherwise default to 3 months around today
    const now = new Date();
    const fromDate = horizon?.start ?? new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const toDate = horizon?.end ?? new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const from = fromDate.toISOString().slice(0, 10);
    const to = toDate.toISOString().slice(0, 10);

    Promise.all([
      api.scheduling.listBlocks({ from, to }),
      api.scheduling.listBookings({ from, to }),
    ])
      .then(([blocks, bookings]) => {
        setSchedulingBlocks(blocks);
        setSchedulingBookings(bookings);
      })
      .catch((err) => {
        console.error("[BreedingCalendar] Failed to load scheduling data", err);
      });
  }, [tenantId, horizon]);

  const planGroup = React.useMemo(() => {
    // Only show plans with a cycle date - no seed date means no timeline to plot
    const plottablePlans = (items || []).filter((p) => {
      const hasCycleDate = !!(
        p.lockedCycleStart ||
        (p as any).expectedCycleStart ||
        (p as any).cycleStartDateActual ||
        (p as any).earliestCycleStart ||
        (p as any).latestCycleStart
      );
      return hasCycleDate;
    });

    const groupItems = plottablePlans.map((p) => {
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

  // Appointments group for scheduling blocks and bookings
  const appointmentsGroup = React.useMemo(() => {
    const items: { id: string; label: string; color: string; defaultOn: boolean }[] = [];

    // Add availability blocks as toggleable items
    for (const block of schedulingBlocks) {
      items.push({
        id: `block:${block.id}`,
        label: block.templateName || `Availability ${block.id}`,
        color: "#10B981", // green for availability
        defaultOn: true,
      });
    }

    // Add a single toggle for all bookings
    if (schedulingBookings.length > 0) {
      items.push({
        id: "scheduling:bookings",
        label: "Confirmed Bookings",
        color: "#6366F1", // indigo for bookings
        defaultOn: true,
      });
    }

    return { id: "scheduling:appointments", label: "Appointments", items };
  }, [schedulingBlocks, schedulingBookings]);

  const groups = React.useMemo(
    () => [planGroup, appointmentsGroup, overlayGroup],
    [planGroup, appointmentsGroup, overlayGroup]
  );

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
        // Use lockedCycleStart if available, otherwise fall back to expectedCycleStart as the seed
        const cycleStart = (p as any).lockedCycleStart ?? (p as any).expectedCycleStart ?? (p as any).cycleStartDateActual ?? null;

        w = windowsFromPlan({
          species: (p as any).species ?? (p as any).damSpecies ?? null,
          dob: (p as any).dob ?? (p as any).birthDate ?? null,
          lockedCycleStart: cycleStart,
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

      // 2) Availability overlays - build phase bands similar to Gantt components
      // Find key stages for phase band calculations
      const cycleStage = stages.find(s => s.id === "pre_breeding");
      const breedingStage = stages.find(s => s.id === "breeding");
      const birthStage = stages.find(s => s.id === "birth");
      const placementStage = stages.find(s => s.id === "placement_normal");

      const addDays = (isoDate: string, days: number): string => {
        const dt = isoToDate(isoDate);
        dt.setUTCDate(dt.getUTCDate() + days);
        return dt.toISOString().slice(0, 10);
      };

      // Cycle → Breeding phase bands
      if (cycleStage && breedingStage) {
        const cycleStart = asIsoDay(cycleStage.full?.start);
        const breedingEnd = asIsoDay(breedingStage.full?.end);

        if (cycleStart && breedingEnd) {
          // Unlikely band
          const uf = Math.abs(prefs.cycle_breeding_unlikely_from || 0);
          const ut = Math.abs(prefs.cycle_breeding_unlikely_to || 0);
          if (uf > 0 || ut > 0) {
            const uStart = addDays(cycleStart, -uf);
            const uEnd = addDays(breedingEnd, ut);
            overlayEvents.push({
              id: `plan:${planId}:avail:cycle-breeding:unlikely`,
              title: `${planName} - Travel Unlikely`,
              start: isoToDate(uStart),
              end: isoToDate(uEnd),
              allDay: true,
              calendarId: "overlay:availability",
              color: "#F59E0B",
              extendedProps: {
                planId,
                variant: "availability",
                availabilityKind: "unlikely",
                phase: "cycle_breeding",
              },
            });
          }

          // Risky band
          const rf = Math.abs(prefs.cycle_breeding_risky_from || 0);
          const rt = Math.abs(prefs.cycle_breeding_risky_to || 0);
          if (rf > 0 || rt > 0) {
            const rStart = addDays(cycleStart, -rf);
            const rEnd = addDays(breedingEnd, rt);
            overlayEvents.push({
              id: `plan:${planId}:avail:cycle-breeding:risky`,
              title: `${planName} - Travel Risky`,
              start: isoToDate(rStart),
              end: isoToDate(rEnd),
              allDay: true,
              calendarId: "overlay:availability",
              color: "#EF4444",
              extendedProps: {
                planId,
                variant: "availability",
                availabilityKind: "risky",
                phase: "cycle_breeding",
              },
            });
          }
        }
      }

      // Birth → Placement phase bands
      if (birthStage && placementStage) {
        const birthStart = asIsoDay(birthStage.full?.start);
        const placementEnd = asIsoDay(placementStage.full?.end);

        if (birthStart && placementEnd) {
          // Unlikely band
          const uf = Math.abs(prefs.post_unlikely_from_likely_start || 0);
          const ut = Math.abs(prefs.post_unlikely_to_likely_end || 0);
          if (uf > 0 || ut > 0) {
            const uStart = addDays(birthStart, -uf);
            const uEnd = addDays(placementEnd, ut);
            overlayEvents.push({
              id: `plan:${planId}:avail:birth-placement:unlikely`,
              title: `${planName} - Travel Unlikely`,
              start: isoToDate(uStart),
              end: isoToDate(uEnd),
              allDay: true,
              calendarId: "overlay:availability",
              color: "#F59E0B",
              extendedProps: {
                planId,
                variant: "availability",
                availabilityKind: "unlikely",
                phase: "birth_placement",
              },
            });
          }

          // Risky band
          const rf = Math.abs(prefs.post_risky_from_full_start || 0);
          const rt = Math.abs(prefs.post_risky_to_full_end || 0);
          if (rf > 0 || rt > 0) {
            const rStart = addDays(birthStart, -rf);
            const rEnd = addDays(placementEnd, rt);
            overlayEvents.push({
              id: `plan:${planId}:avail:birth-placement:risky`,
              title: `${planName} - Travel Risky`,
              start: isoToDate(rStart),
              end: isoToDate(rEnd),
              allDay: true,
              calendarId: "overlay:availability",
              color: "#EF4444",
              extendedProps: {
                planId,
                variant: "availability",
                availabilityKind: "risky",
                phase: "birth_placement",
              },
            });
          }
        }
      }
    }

    // Scheduling events: availability blocks (as all-day ranges)
    const schedulingEvents: any[] = [];
    for (const block of schedulingBlocks) {
      schedulingEvents.push({
        id: `scheduling:block:${block.id}`,
        title: block.templateName || `Availability`,
        start: new Date(block.startAt),
        end: new Date(block.endAt),
        allDay: true,
        calendarId: `block:${block.id}`,
        color: "#10B981",
        extendedProps: {
          variant: "scheduling",
          schedulingType: "block",
          blockId: block.id,
          eventType: block.eventType,
          location: block.location,
          slotCount: block.slotCount,
          bookedSlotCount: block.bookedSlotCount,
        },
      });
    }

    // Scheduling events: confirmed bookings (as timed events)
    for (const booking of schedulingBookings) {
      schedulingEvents.push({
        id: `scheduling:booking:${booking.id}`,
        title: `${booking.partyName} - ${booking.eventType || "Appointment"}`,
        start: new Date(booking.startsAt),
        end: new Date(booking.endsAt),
        allDay: false,
        calendarId: "scheduling:bookings",
        color: "#6366F1",
        extendedProps: {
          variant: "scheduling",
          schedulingType: "booking",
          bookingId: booking.id,
          partyId: booking.partyId,
          partyName: booking.partyName,
          eventId: booking.eventId,
          eventType: booking.eventType,
          location: booking.location,
          mode: booking.mode,
        },
      });
    }

    const all = [...pointEvents, ...overlayEvents, ...schedulingEvents, ...userEvents];

    if (!horizon) return all;

    const hs = horizon.start.getTime();
    const he = horizon.end.getTime();

    return all.filter((e) => {
      const s = (e.start instanceof Date ? e.start : new Date(e.start)).getTime();
      const en = (e.end ? (e.end instanceof Date ? e.end : new Date(e.end)) : e.start).getTime();
      return en >= hs && s <= he;
    });
  }, [items, selectedSet, horizon, prefs, userEvents, schedulingBlocks, schedulingBookings]);

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
      onEventCreate={handleEventCreate}
    />
  );
}
