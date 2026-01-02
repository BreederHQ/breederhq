// apps/breeding/src/pages/plannerV2/PhaseGroupedPerPlanV2.tsx
// Phase-grouped Per Plan view for v2 - cloned from PerPlanGantt.tsx with phase grouping

import * as React from "react";
import Gantt from "@bhq/ui/components/Gantt";
import { SectionCard } from "@bhq/ui";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";
import { useAvailabilityPrefs } from "@bhq/ui/hooks";
import { mapTenantPrefs, hasAnyExactValues } from "@bhq/ui/utils/availability";
import { pickPlacementCompletedAny } from "@bhq/ui/utils";
import { deriveBreedingStatus, STATUS_ORDER, STATUS_LABELS, type Status } from "./deriveBreedingStatus.v2";
import { usePlanToggles, type PlanTogglesState } from "./usePlanToggles.v2";

/* ---------- color util ---------- */
function shade(hex: string, pct: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const mix = (i: number) => clamp(Math.round(parseInt(h.slice(i, i + 2), 16) + (pct / 100) * 255));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(0))}${toHex(mix(2))}${toHex(mix(4))}`;
}

/* ---------- types ---------- */
type Species = "Dog" | "Cat" | "Horse";

type PlanLike = {
  id: string | number;
  name: string;
  species?: Species | string;
  lockedCycleStart?: string | null;
  expectedCycleStart?: string | Date | null;
  expectedHormoneTestingStart?: string | Date | null;
  expectedBreedDate?: string | Date | null;
  expectedBreedingDate?: string | Date | null;
  expectedBirthDate?: string | Date | null;
  expectedWeaned?: string | Date | null;
  expectedPlacementStartDate?: string | Date | null;
  placementStartDateExpected?: string | Date | null;
  expectedPlacementCompleted?: string | Date | null;
  expectedPlacementCompletedDate?: string | Date | null;
  // Status derivation fields
  damId?: number | null;
  sireId?: number | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  status?: string | null;
};

type AvailabilityPrefs = {
  cycle_breeding_risky_from?: number;
  cycle_breeding_risky_to?: number;
  cycle_breeding_unlikely_from?: number;
  cycle_breeding_unlikely_to?: number;
  post_risky_from_full_start?: number;
  post_risky_to_full_end?: number;
  post_unlikely_from_likely_start?: number;
  post_unlikely_to_likely_end?: number;
  date_cycle_risky_from?: number;
  date_cycle_risky_to?: number;
  date_cycle_unlikely_from?: number;
  date_cycle_unlikely_to?: number;
  date_testing_risky_from?: number;
  date_testing_risky_to?: number;
  date_testing_unlikely_from?: number;
  date_testing_unlikely_to?: number;
  date_breeding_risky_from?: number;
  date_breeding_risky_to?: number;
  date_breeding_unlikely_from?: number;
  date_breeding_unlikely_to?: number;
  date_birth_risky_from?: number;
  date_birth_risky_to?: number;
  date_birth_unlikely_from?: number;
  date_birth_unlikely_to?: number;
  date_weaned_risky_from?: number;
  date_weaned_risky_to?: number;
  date_weaned_unlikely_from?: number;
  date_weaned_unlikely_to?: number;
  date_placement_start_risky_from?: number;
  date_placement_start_risky_to?: number;
  date_placement_start_unlikely_from?: number;
  date_placement_start_unlikely_to?: number;
  date_placement_completed_risky_from?: number;
  date_placement_completed_risky_to?: number;
  date_placement_completed_unlikely_from?: number;
  date_placement_completed_unlikely_to?: number;
  autoWidenUnlikely?: boolean;
  defaultExactBandsVisible?: boolean;
};

type Props = {
  plans: PlanLike[];
  prefsOverride?: Partial<AvailabilityPrefs>;
  className?: string;
};

/* ---------- color palette ---------- */
const PHASES_COLORS = { cycleToBreeding: "#3B82F6", birthToPlacement: "#10B981" };
const EXACT_COLORS = ["#06B6D4", "#A78BFA", "#F59E0B", "#14B8A6", "#F97316", "#EF4444", "#8B5CF6"];

/* ---------- date utils ---------- */
const dayMs = 24 * 60 * 60 * 1000;
const isDate = (v: unknown): v is Date => v instanceof Date && !Number.isNaN(v.getTime());
const parseAnyDate = (v?: string | Date | null) => {
  if (!v) return null;
  if (isDate(v)) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * dayMs);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", year: "numeric" });

/* ---------- math helpers ---------- */
type Bands = { rf: number; rt: number; uf: number; ut: number };
function normalizeBands(
  risky_from?: number, risky_to?: number,
  unlikely_from?: number, unlikely_to?: number,
  autoWiden?: boolean
): Bands {
  let rfMag = Math.abs(risky_from ?? 0);
  let rtMag = Math.abs(risky_to ?? 0);
  let ufMag = Math.abs(unlikely_from ?? 0);
  let utMag = Math.abs(unlikely_to ?? 0);
  if (autoWiden) {
    if (ufMag === rfMag && rfMag !== 0) ufMag = rfMag + 1;
    if (utMag === rtMag && rtMag !== 0) utMag = rtMag + 1;
  }
  return { rf: -rfMag, rt: +rtMag, uf: -ufMag, ut: +utMag };
}
function nonNullMin(a: Date | null, b: Date | null) { if (!a) return b; if (!b) return a; return a < b ? a : b; }
function nonNullMax(a: Date | null, b: Date | null) { if (!a) return b; if (!b) return a; return a > b ? a : b; }

/* ---------- row building types ---------- */
type GanttBand = { start: Date; end: Date; style: "risky" | "unlikely"; tooltip: string };
type GanttAnchor = { date: Date; label: string; tooltip: string };
type GanttRow = {
  id: string;
  label: string;
  color: string;
  anchors: GanttAnchor[];
  bands: GanttBand[];
  center?: { start: Date; end: Date; tooltip: string };
};

type PlanExpected = {
  cycle?: Date | null;
  testing?: Date | null;
  breeding?: Date | null;
  birth?: Date | null;
  weaned?: Date | null;
  placementStart?: Date | null;
  placementCompleted?: Date | null;
};

function resolveExpected(plan: PlanLike): PlanExpected {
  const placementCompletedAny = pickPlacementCompletedAny(plan);
  const placementStartAny = plan.expectedPlacementStartDate ?? plan.placementStartDateExpected ?? null;
  const breedingAny = plan.expectedBreedDate ?? plan.expectedBreedingDate ?? null;
  return {
    cycle: parseAnyDate(plan.expectedCycleStart),
    testing: parseAnyDate(plan.expectedHormoneTestingStart),
    breeding: parseAnyDate(breedingAny),
    birth: parseAnyDate(plan.expectedBirthDate),
    weaned: parseAnyDate(plan.expectedWeaned),
    placementStart: parseAnyDate(placementStartAny),
    placementCompleted: parseAnyDate(placementCompletedAny),
  };
}

/* ---------- phase rows ---------- */
function buildPhaseRows(exp: PlanExpected, prefs: AvailabilityPrefs, showBands: boolean) {
  type Row = { id: string; label: string; color: string; anchors: GanttAnchor[]; bands: GanttBand[]; center?: GanttRow["center"] };
  const rows: Row[] = [];
  let min: Date | null = null;
  let max: Date | null = null;

  if (exp.cycle && exp.breeding) {
    const b = normalizeBands(prefs.cycle_breeding_risky_from, prefs.cycle_breeding_risky_to,
      prefs.cycle_breeding_unlikely_from, prefs.cycle_breeding_unlikely_to, !!prefs.autoWidenUnlikely);
    const uStart = addDays(exp.cycle, b.uf);
    const uEnd = addDays(exp.breeding, b.ut);
    const rStart = addDays(exp.cycle, b.rf);
    const rEnd = addDays(exp.breeding, b.rt);
    const bands: GanttBand[] = [];
    if (showBands) {
      bands.push({ start: uStart, end: uEnd, style: "unlikely", tooltip: `Cycle to Breeding, Unlikely: ${fmt.format(uStart)} to ${fmt.format(uEnd)}` });
      bands.push({ start: rStart, end: rEnd, style: "risky", tooltip: `Cycle to Breeding, Risky: ${fmt.format(rStart)} to ${fmt.format(rEnd)}` });
      min = nonNullMin(min, uStart); min = nonNullMin(min, rStart);
      max = nonNullMax(max, uEnd); max = nonNullMax(max, rEnd);
    } else {
      min = nonNullMin(min, addDays(exp.cycle, -1));
      max = nonNullMax(max, addDays(exp.breeding, +1));
    }
    rows.push({
      id: "phases-cycle-breeding", label: "Cycle → Breeding", color: PHASES_COLORS.cycleToBreeding,
      anchors: [
        { date: exp.cycle, label: "Cycle Start", tooltip: `Cycle Start: ${fmt.format(exp.cycle)}` },
        { date: exp.breeding, label: "Breeding", tooltip: `Breeding: ${fmt.format(exp.breeding)}` },
      ],
      bands, center: { start: exp.cycle, end: exp.breeding, tooltip: `Cycle → Breeding: ${fmt.format(exp.cycle)} → ${fmt.format(exp.breeding)}` },
    });
  }

  if (exp.birth && exp.placementCompleted) {
    const b = normalizeBands(prefs.post_risky_from_full_start, prefs.post_risky_to_full_end,
      prefs.post_unlikely_from_likely_start, prefs.post_unlikely_to_likely_end, !!prefs.autoWidenUnlikely);
    const uStart = addDays(exp.birth, b.uf);
    const uEnd = addDays(exp.placementCompleted, b.ut);
    const rStart = addDays(exp.birth, b.rf);
    const rEnd = addDays(exp.placementCompleted, b.rt);
    const bands: GanttBand[] = [];
    if (showBands) {
      bands.push({ start: uStart, end: uEnd, style: "unlikely", tooltip: `Birth to Placement, Unlikely: ${fmt.format(uStart)} to ${fmt.format(uEnd)}` });
      bands.push({ start: rStart, end: rEnd, style: "risky", tooltip: `Birth to Placement, Risky: ${fmt.format(rStart)} to ${fmt.format(rEnd)}` });
      min = nonNullMin(min, uStart); min = nonNullMin(min, rStart);
      max = nonNullMax(max, uEnd); max = nonNullMax(max, rEnd);
    } else {
      min = nonNullMin(min, addDays(exp.birth, -1));
      max = nonNullMax(max, addDays(exp.placementCompleted, +1));
    }
    rows.push({
      id: "phases-birth-placement", label: "Birth → Placement", color: PHASES_COLORS.birthToPlacement,
      anchors: [
        { date: exp.birth, label: "Birth", tooltip: `Birth: ${fmt.format(exp.birth)}` },
        { date: exp.placementCompleted, label: "Placement Completed", tooltip: `Placement Completed: ${fmt.format(exp.placementCompleted)}` },
      ],
      bands, center: { start: exp.birth, end: exp.placementCompleted, tooltip: `Birth → Placement: ${fmt.format(exp.birth)} → ${fmt.format(exp.placementCompleted)}` },
    });
  }

  return { rows, spanMin: min, spanMax: max };
}

/* ---------- exact date rows ---------- */
type ExactRowSpec = {
  id: string; label: string; anchor: Date | null | undefined;
  risky_from?: number; risky_to?: number; unlikely_from?: number; unlikely_to?: number;
};

function buildExactRows(exp: PlanExpected, prefs: AvailabilityPrefs, showBands: boolean) {
  const specs: ExactRowSpec[] = [
    { id: "exact-cycle", label: "Cycle Start", anchor: exp.cycle, risky_from: prefs.date_cycle_risky_from, risky_to: prefs.date_cycle_risky_to, unlikely_from: prefs.date_cycle_unlikely_from, unlikely_to: prefs.date_cycle_unlikely_to },
    { id: "exact-testing", label: "Hormone Testing", anchor: exp.testing, risky_from: prefs.date_testing_risky_from, risky_to: prefs.date_testing_risky_to, unlikely_from: prefs.date_testing_unlikely_from, unlikely_to: prefs.date_testing_unlikely_to },
    { id: "exact-breeding", label: "Breeding", anchor: exp.breeding, risky_from: prefs.date_breeding_risky_from, risky_to: prefs.date_breeding_risky_to, unlikely_from: prefs.date_breeding_unlikely_from, unlikely_to: prefs.date_breeding_unlikely_to },
    { id: "exact-birth", label: "Birth", anchor: exp.birth, risky_from: prefs.date_birth_risky_from, risky_to: prefs.date_birth_risky_to, unlikely_from: prefs.date_birth_unlikely_from, unlikely_to: prefs.date_birth_unlikely_to },
    { id: "exact-weaning", label: "Weaning", anchor: exp.weaned, risky_from: prefs.date_weaned_risky_from, risky_to: prefs.date_weaned_risky_to, unlikely_from: prefs.date_weaned_unlikely_from, unlikely_to: prefs.date_weaned_unlikely_to },
    { id: "exact-placement-start", label: "Placement Start", anchor: exp.placementStart, risky_from: prefs.date_placement_start_risky_from, risky_to: prefs.date_placement_start_risky_to, unlikely_from: prefs.date_placement_start_unlikely_from, unlikely_to: prefs.date_placement_start_unlikely_to },
    { id: "exact-placement-completed", label: "Placement Completed", anchor: exp.placementCompleted, risky_from: prefs.date_placement_completed_risky_from, risky_to: prefs.date_placement_completed_risky_to, unlikely_from: prefs.date_placement_completed_unlikely_from, unlikely_to: prefs.date_placement_completed_unlikely_to },
  ];

  const colorOf = (id: string) => {
    const order = ["exact-cycle", "exact-testing", "exact-breeding", "exact-birth", "exact-weaning", "exact-placement-start", "exact-placement-completed"];
    return EXACT_COLORS[Math.max(0, order.indexOf(id))] || EXACT_COLORS[0];
  };

  const rows: GanttRow[] = [];
  let min: Date | null = null;
  let max: Date | null = null;

  for (const s of specs) {
    if (!s.anchor) continue;
    const b = normalizeBands(s.risky_from, s.risky_to, s.unlikely_from, s.unlikely_to, !!prefs.autoWidenUnlikely);
    const row: GanttRow = { id: s.id, label: s.label, color: colorOf(s.id), anchors: [{ date: s.anchor, label: s.label, tooltip: `${s.label}: ${fmt.format(s.anchor)}` }], bands: [] };
    const uStart = addDays(s.anchor, b.uf);
    const uEnd = addDays(s.anchor, b.ut);
    const rStart = addDays(s.anchor, b.rf);
    const rEnd = addDays(s.anchor, b.rt);
    const tweak = (d0: Date, d1: Date) => d0.getTime() === d1.getTime() ? addDays(d1, 1) : d1;
    if (showBands) {
      row.bands.push({ start: uStart, end: tweak(uStart, uEnd), style: "unlikely", tooltip: `${s.label}, Unlikely: ${fmt.format(uStart)} to ${fmt.format(uEnd)}` });
      row.bands.push({ start: rStart, end: tweak(rStart, rEnd), style: "risky", tooltip: `${s.label}, Risky: ${fmt.format(rStart)} to ${fmt.format(rEnd)}` });
      min = nonNullMin(min, uStart); min = nonNullMin(min, rStart);
      max = nonNullMax(max, uEnd); max = nonNullMax(max, rEnd);
    } else {
      min = nonNullMin(min, addDays(s.anchor, -1));
      max = nonNullMax(max, addDays(s.anchor, +1));
    }
    rows.push(row);
  }

  return { rows, spanMin: min, spanMax: max };
}

/* ---------- horizon padding ---------- */
function padDomainBothSides(min: Date | null, max: Date | null) {
  if (!min || !max) return null;
  const left = startOfMonth(addMonths(startOfMonth(min), -1));
  const right = endOfMonth(addMonths(startOfMonth(max), +1));
  return { start: left, end: right };
}

/* ---------- Gantt adapter ---------- */
type Stage = { key: string; label: string; baseColor: string; hatchLikely?: boolean };
type StageDatum = { key: string; fullRange?: { start: Date; end: Date }; likelyRange?: { start: Date; end: Date }; point?: Date; __tooltip?: string; __z?: number; color?: string; opacity?: number };

function toStages(rows: GanttRow[]): Stage[] {
  return rows.map(r => ({ key: r.id, label: r.label, baseColor: r.color, hatchLikely: true }));
}

function toStageData(rows: GanttRow[]): StageDatum[] {
  const out: StageDatum[] = [];
  for (const r of rows) {
    const unlikely = r.bands.find(b => b.style === "unlikely");
    if (unlikely) out.push({ key: r.id, likelyRange: { start: unlikely.start, end: unlikely.end }, __tooltip: unlikely.tooltip, __z: 1 });
    const risky = r.bands.find(b => b.style === "risky");
    if (risky) {
      const isPhase = r.id.startsWith("phases-");
      out.push({ key: r.id, fullRange: { start: risky.start, end: risky.end }, __tooltip: risky.tooltip, __z: 2, color: isPhase ? shade(r.color, -28) : undefined, opacity: isPhase ? 0.85 : undefined });
    }
    if ((r as any).center) {
      const c = (r as any).center as { start: Date; end: Date; tooltip: string };
      out.push({ key: r.id, fullRange: { start: c.start, end: c.end }, __tooltip: c.tooltip, __z: 3 });
    }
    for (const a of r.anchors) {
      if (!a?.date) continue;
      out.push({ key: r.id, point: a.date, __tooltip: a.tooltip, __z: 4 });
    }
  }
  return out;
}

/* ---------- per plan block ---------- */
function PlanBlock({ plan, prefs }: { plan: PlanLike; prefs: AvailabilityPrefs }) {
  const exp = React.useMemo(() => resolveExpected(plan), [plan]);
  const [toggles, setToggles] = usePlanToggles(plan.id, !!prefs.defaultExactBandsVisible);

  const phases = React.useMemo(() => buildPhaseRows(exp, prefs, toggles.showExactBands), [exp, prefs, toggles.showExactBands]);
  const exact = React.useMemo(() => buildExactRows(exp, prefs, toggles.showExactBands), [exp, prefs, toggles.showExactBands]);

  const rawMin = [phases.spanMin, exact.spanMin].reduce(nonNullMin, null);
  const rawMax = [phases.spanMax, exact.spanMax].reduce(nonNullMax, null);
  const horizon = React.useMemo(() => {
    if (!rawMin || !rawMax) return null;
    return padDomainBothSides(rawMin, rawMax);
  }, [rawMin, rawMax]);

  if (!horizon) {
    return (
      <div className="mb-4 rounded-xl border border-hairline p-4">
        <div className="text-sm text-secondary">{plan.name}: Missing required expected dates. Skipped.</div>
      </div>
    );
  }

  const ganttCommon = { horizon, heightPerRow: 30, fitToContent: false, showToday: false, className: "bhq-gantt planner", style: { width: "100%" } } as const;

  return (
    <div className="rounded-xl border mb-4" style={{ borderColor: "hsl(0 0% 40%)" }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-semibold">{plan.name}</div>
        <div className="flex items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={toggles.showPhases} onChange={(e) => setToggles(s => ({ ...s, showPhases: e.target.checked }))} />
            Timeline Phases
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={toggles.showExact} onChange={(e) => setToggles(s => ({ ...s, showExact: e.target.checked }))} />
            Expected Dates
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={toggles.showExactBands} onChange={(e) => setToggles(s => ({ ...s, showExactBands: e.target.checked }))} />
            Availability Bands
          </label>
        </div>
      </div>

      {toggles.showPhases && (
        <section className="px-3 pt-3 pb-3">
          <div className="px-1 pb-2 text-xs font-medium text-secondary">Timeline Phases</div>
          <div className="rounded-xl bg-black/20 p-2 overflow-hidden mb-2" style={{ border: "none" }}>
            <Gantt {...ganttCommon} stages={toStages(phases.rows)} data={toStageData(phases.rows)} />
          </div>
        </section>
      )}

      {toggles.showExact && (
        <section className="px-3 pt-2 pb-3">
          <div className="px-1 pb-2 text-xs font-medium text-secondary">Expected Dates</div>
          <div className="rounded-xl bg-black/20 p-2 overflow-hidden" style={{ border: "none" }}>
            <Gantt {...ganttCommon} stages={toStages(exact.rows)} data={toStageData(exact.rows)} />
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- main component ---------- */
export default function PhaseGroupedPerPlanV2({ plans, prefsOverride, className = "" }: Props) {
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const handleSettingsUpdate = () => setReloadKey(prev => prev + 1);
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === "BHQ_ENFORCE_PLUSONE_DATES" || e.key === "BHQ_ENFORCE_PLUSONE_PHASES") {
        setReloadKey(prev => prev + 1);
      }
    };
    window.addEventListener("bhq:breeding:planner:settings:updated", handleSettingsUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    return () => {
      window.removeEventListener("bhq:breeding:planner:settings:updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const hook = useAvailabilityPrefs ? useAvailabilityPrefs({ tenantId: readTenantIdFast?.(), reloadKey }) : undefined;
  const prefs: AvailabilityPrefs = { ...mapTenantPrefs(hook?.prefs || {}), ...(prefsOverride || {}) };
  if (prefs.defaultExactBandsVisible == null) {
    prefs.defaultExactBandsVisible = hasAnyExactValues(prefs as any);
  }

  // Filter to only plans with lockedCycleStart (same as current PerPlanGantt)
  const lockedPlans = React.useMemo(() => plans.filter(p => p.lockedCycleStart), [plans]);

  // Group by status
  const groupedByStatus = React.useMemo(() => {
    const groups: Record<Status, PlanLike[]> = {
      PLANNING: [], COMMITTED: [], BRED: [], BIRTHED: [], WEANED: [], HOMING_STARTED: [], COMPLETE: [], CANCELED: [],
    };
    for (const plan of lockedPlans) {
      const status = deriveBreedingStatus(plan);
      groups[status].push(plan);
    }
    return groups;
  }, [lockedPlans]);

  if (!lockedPlans.length) {
    return (
      <div className={className}>
        <div className="text-sm text-secondary py-8 text-center">No plans with Cycle Locked. Nothing to plot.</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {STATUS_ORDER.map((status) => {
        const plansInPhase = groupedByStatus[status];
        if (plansInPhase.length === 0) return null;

        return (
          <SectionCard
            key={status}
            title={<span className="text-base font-semibold">Phase: {STATUS_LABELS[status]}</span>}
            className="mb-4"
          >
            <div className="text-xs text-secondary mb-3">
              {plansInPhase.length} plan{plansInPhase.length !== 1 ? "s" : ""} in this phase
            </div>
            {plansInPhase.map(plan => (
              <PlanBlock key={plan.id} plan={plan} prefs={prefs} />
            ))}
          </SectionCard>
        );
      })}
    </div>
  );
}
