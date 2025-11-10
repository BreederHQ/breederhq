// apps/breeding/src/components/RollupGantt.tsx
import * as React from "react";
import Gantt from "@bhq/ui/components/Gantt";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";
import { useAvailabilityPrefs } from "@bhq/ui/hooks";
import { mapTenantPrefs, hasAnyExactValues } from "@bhq/ui/utils/availability";
import { pickPlacementCompletedAny } from "@bhq/ui/utils";

/* ---------- types ---------- */

type ID = string | number;

type PlanLike = {
  id: ID;
  name: string;
  lockedCycleStart?: string | null;

  expectedCycleStart?: string | Date | null;
  expectedHormoneTestingStart?: string | Date | null;

  expectedBreedDate?: string | Date | null;
  expectedBreedingDate?: string | Date | null;

  expectedBirthDate?: string | Date | null;
  expectedWeanedDate?: string | Date | null;

  expectedPlacementStartDate?: string | Date | null;
  placementStartDateExpected?: string | Date | null;

  expectedPlacementCompleted?: string | Date | null;
  placementCompletedDateExpected?: string | Date | null;
};

type ComputeExpectedFn = (plan: PlanLike) => {
  expectedCycleStart: string | Date;
  expectedHormoneTestingStart?: string | Date | null;
  expectedBreedDate?: string | Date | null;
  expectedBreedingDate?: string | Date | null;
  expectedBirthDate?: string | Date | null;
  expectedWeanedDate?: string | Date | null;
  expectedPlacementStartDate?: string | Date | null;
  expectedPlacementCompleted?: string | Date | null;
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

type Horizon = { start: Date; end: Date };

type Props = {
  plans?: PlanLike[] | null;
  items?: PlanLike[] | null;
  computeExpected?: ComputeExpectedFn;
  prefsOverride?: Partial<AvailabilityPrefs>;
  className?: string;

  selected?: Set<ID> | ID[];
  onSelectedChange?: (next: Set<ID>) => void;
};

/* ---------- constants ---------- */

const PHASES_COLORS = { cycleToBreeding: "#3B82F6", birthToPlacement: "#10B981" };
const EXACT_COLORS = ["#06B6D4", "#A78BFA", "#F59E0B", "#14B8A6", "#F97316", "#8B5CF6", "#EF4444"];

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
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

function nonNullMin(a: Date | null, b: Date | null) { if (!a) return b; if (!b) return a; return a < b ? a : b; }
function nonNullMax(a: Date | null, b: Date | null) { if (!a) return b; if (!b) return a; return a > b ? a : b; }
function monthsInclusive(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}

/* ---------- math ---------- */

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

/* ---------- expected ---------- */

type PlanExpected = {
  cycle?: Date | null;
  testing?: Date | null;
  breeding?: Date | null;
  birth?: Date | null;
  weaned?: Date | null;
  placementStart?: Date | null;
  placementCompleted?: Date | null;
};

function resolveExpected(plan: PlanLike, computeExpected?: ComputeExpectedFn): PlanExpected {
  const placementCompletedAny =
    plan.expectedPlacementCompleted ??
    plan.placementCompletedDateExpected ??
    pickPlacementCompletedAny(plan);

  const placementStartAny =
    plan.expectedPlacementStartDate ??
    plan.placementStartDateExpected ??
    null;

  const breedingAny =
    plan.expectedBreedDate ??
    plan.expectedBreedingDate ??
    null;

  const planExp: PlanExpected = {
    cycle: parseAnyDate(plan.expectedCycleStart),
    testing: parseAnyDate(plan.expectedHormoneTestingStart),
    breeding: parseAnyDate(breedingAny),
    birth: parseAnyDate(plan.expectedBirthDate),
    weaned: parseAnyDate(plan.expectedWeanedDate),
    placementStart: parseAnyDate(placementStartAny),
    placementCompleted: parseAnyDate(placementCompletedAny),
  };

  const hasAnyMissing =
    !(planExp.cycle && planExp.breeding && planExp.birth && planExp.placementCompleted);

  let computed: PlanExpected | null = null;

  if (hasAnyMissing && computeExpected && plan.lockedCycleStart) {
    const r = computeExpected(plan) as any;
    const computedPlacementStartAny =
      r?.expectedPlacementStartDate ?? r?.placementStartDateExpected ?? null;

    computed = {
      cycle: parseAnyDate(r?.expectedCycleStart),
      testing: parseAnyDate(r?.expectedHormoneTestingStart ?? null),
      breeding: parseAnyDate(r?.expectedBreedDate ?? r?.expectedBreedingDate ?? null),
      birth: parseAnyDate(r?.expectedBirthDate ?? null),
      weaned: parseAnyDate(r?.expectedWeanedDate ?? null),
      placementStart: parseAnyDate(computedPlacementStartAny),
      placementCompleted: parseAnyDate(pickPlacementCompletedAny(r)),
    };
  }

  const merged: PlanExpected = {
    cycle: planExp.cycle ?? computed?.cycle ?? null,
    testing: planExp.testing ?? computed?.testing ?? null,
    breeding: planExp.breeding ?? computed?.breeding ?? null,
    birth: planExp.birth ?? computed?.birth ?? null,
    weaned: planExp.weaned ?? computed?.weaned ?? null,
    placementStart: planExp.placementStart ?? computed?.placementStart ?? null,
    placementCompleted: planExp.placementCompleted ?? computed?.placementCompleted ?? null,
  };

  // 🔧 backfill like PerPlanGantt
  if (!merged.placementStart && merged.birth) merged.placementStart = addDays(merged.birth, 56);
  if (!merged.placementCompleted && merged.placementStart) merged.placementCompleted = addDays(merged.placementStart, 21);

  return merged;
}

/* ---------- BHQ Gantt adapter ---------- */

type Stage = { key: string; label: string; baseColor: string; hatchLikely?: boolean };
type StageDatum = {
  key: string;
  fullRange?: { start: Date; end: Date };
  likelyRange?: { start: Date; end: Date };
  point?: Date;
  __tooltip?: string;
  __z?: number;
};

function phaseStages(): Stage[] {
  return [
    { key: "cycle_to_breeding", label: "Cycle → Breeding", baseColor: PHASES_COLORS.cycleToBreeding, hatchLikely: true },
    { key: "birth_to_placement", label: "Birth → Placement", baseColor: PHASES_COLORS.birthToPlacement, hatchLikely: true },
  ];
}
function exactStages(): Stage[] {
  const labels = ["Cycle Start","Hormone Testing","Breeding","Birth","Weaning","Placement Start","Placement Completed"];
  const keys   = ["exact_cycle","exact_testing","exact_breeding","exact_birth","exact_weaning","exact_ps","exact_pc"];
  return keys.map((k,i) => ({ key: k, label: labels[i], baseColor: EXACT_COLORS[i], hatchLikely: true }));
}

/* ---------- ids ---------- */

const idKey = (x: ID) => String(x);

/* ---------- main ---------- */

export default function RollupGantt({
  plans,
  items,
  computeExpected,
  prefsOverride,
  className = "",
  selected: selectedProp,
  onSelectedChange,
}: Props) {
  const incoming = plans ?? items ?? [];
  const rawPlans = Array.isArray(incoming) ? incoming : [];
  const idsSig = React.useMemo(() => rawPlans.map(p => String(p?.id ?? "")).join("|"), [rawPlans]);
  const safePlans = React.useMemo<PlanLike[]>(
    () => rawPlans.filter((p): p is PlanLike => !!p && p.id != null),
    [idsSig, rawPlans.length]
  );

  const tenantId = readTenantIdFast?.();
  const hook = useAvailabilityPrefs ? useAvailabilityPrefs({ tenantId }) : undefined;

  const prefs: AvailabilityPrefs = {
    ...mapTenantPrefs(hook?.prefs || {}),
    ...(prefsOverride || {}),
  };
  const defaultBandsVisible =
    prefs.defaultExactBandsVisible != null
      ? !!prefs.defaultExactBandsVisible
      : hasAnyExactValues(prefs as any);

  /* toggles */
  const [toggles, setToggles] = React.useState<{ showPhases: boolean; showExact: boolean; showExactBands: boolean }>(() => ({
    showPhases: true,
    showExact: true,
    showExactBands: defaultBandsVisible,
  }));

  /* selection, allow empty */
  const controlled = selectedProp instanceof Set ? selectedProp : selectedProp ? new Set(selectedProp) : undefined;
  const [internalSel, setInternalSel] = React.useState<Set<ID>>(
    () => new Set<ID>() // start empty so user really controls what appears
  );
  React.useEffect(() => {
    const valid = new Set(safePlans.map(p => idKey(p.id)));
    setInternalSel(prev => {
      const next = new Set<ID>();
      prev.forEach(v => { if (valid.has(idKey(v))) next.add(v); });
      return next;
    });
  }, [idsSig]);

  const selected = controlled ?? internalSel;
  const setSelected = (s: Set<ID>) => {
    if (controlled && onSelectedChange) onSelectedChange(s);
    else setInternalSel(s);
  };
  const selectedKeys = React.useMemo(() => {
    const s = new Set<string>(); selected.forEach(v => s.add(idKey(v))); return s;
  }, [selected]);
  const toggleOne = (id: ID) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const setAll = (v: boolean) => setSelected(v ? new Set(safePlans.map(p => p.id)) : new Set<ID>());

  const activePlans = React.useMemo(
    () => safePlans.filter(p => selectedKeys.has(idKey(p.id))),
    [safePlans, selectedKeys]
  );

  /* build data */
  const phases: Stage[] = phaseStages();
  const exacts: Stage[] = exactStages();
  const phaseData: StageDatum[] = [];
  const exactData: StageDatum[] = [];

  let minAll: Date | null = null;
  let maxAll: Date | null = null;

  for (const p of activePlans) {
    const exp = resolveExpected(p, computeExpected);

    if (exp.cycle && exp.breeding) {
      const b = normalizeBands(
        prefs.cycle_breeding_risky_from, prefs.cycle_breeding_risky_to,
        prefs.cycle_breeding_unlikely_from, prefs.cycle_breeding_unlikely_to,
        !!prefs.autoWidenUnlikely
      );
      const uStart = addDays(exp.cycle, b.uf);
      const uEnd = addDays(exp.breeding, b.ut);
      const rStart = addDays(exp.cycle, b.rf);
      const rEnd = addDays(exp.breeding, b.rt);
      phaseData.push({
        key: "cycle_to_breeding",
        fullRange: { start: rStart, end: rEnd },
        likelyRange: { start: uStart, end: uEnd },
        point: exp.breeding,
        __tooltip: `[${p.name}] Cycle to Breeding`,
        __z: 1,
      });
      minAll = nonNullMin(minAll, uStart);
      minAll = nonNullMin(minAll, rStart);
      maxAll = nonNullMax(maxAll, uEnd);
      maxAll = nonNullMax(maxAll, rEnd);
    }
    if (exp.birth && exp.placementCompleted) {
      const b = normalizeBands(
        prefs.post_risky_from_full_start, prefs.post_risky_to_full_end,
        prefs.post_unlikely_from_likely_start, prefs.post_unlikely_to_likely_end,
        !!prefs.autoWidenUnlikely
      );
      const uStart = addDays(exp.birth, b.uf);
      const uEnd = addDays(exp.placementCompleted, b.ut);
      const rStart = addDays(exp.birth, b.rf);
      const rEnd = addDays(exp.placementCompleted, b.rt);
      phaseData.push({
        key: "birth_to_placement",
        fullRange: { start: rStart, end: rEnd },
        likelyRange: { start: uStart, end: uEnd },
        point: exp.placementCompleted,
        __tooltip: `[${p.name}] Birth to Placement`,
        __z: 1,
      });
      minAll = nonNullMin(minAll, uStart);
      minAll = nonNullMin(minAll, rStart);
      maxAll = nonNullMax(maxAll, uEnd);
      maxAll = nonNullMax(maxAll, rEnd);
    }

    const pushExact = (
      key: string, anchor?: Date | null,
      rf?: number, rt?: number, uf?: number, ut?: number, label?: string
    ) => {
      if (!anchor) return;
      const d: StageDatum = { key, point: anchor, __tooltip: `[${p.name}] ${label || ""}`, __z: 1 };
      if (toggles.showExactBands) {
        const b = normalizeBands(rf, rt, uf, ut, !!prefs.autoWidenUnlikely);
        const uStart = addDays(anchor, b.uf);
        const uEnd = addDays(anchor, b.ut);
        const rStart = addDays(anchor, b.rf);
        const rEnd = addDays(anchor, b.rt);
        d.fullRange = { start: rStart, end: rEnd };
        d.likelyRange = { start: uStart, end: uEnd };
        minAll = nonNullMin(minAll, uStart);
        minAll = nonNullMin(minAll, rStart);
        maxAll = nonNullMax(maxAll, uEnd);
        maxAll = nonNullMax(maxAll, rEnd);
      } else {
        minAll = nonNullMin(minAll, addDays(anchor, -1));
        maxAll = nonNullMax(maxAll, addDays(anchor, +1));
      }
      exactData.push(d);
    };

    pushExact("exact_cycle",   exp.cycle,             prefs.date_cycle_risky_from,             prefs.date_cycle_risky_to,             prefs.date_cycle_unlikely_from,             prefs.date_cycle_unlikely_to,             "Cycle Start");
    pushExact("exact_testing", exp.testing,           prefs.date_testing_risky_from,           prefs.date_testing_risky_to,           prefs.date_testing_unlikely_from,           prefs.date_testing_unlikely_to,           "Hormone Testing");
    pushExact("exact_breeding",exp.breeding,          prefs.date_breeding_risky_from,          prefs.date_breeding_risky_to,          prefs.date_breeding_unlikely_from,          prefs.date_breeding_unlikely_to,          "Breeding");
    pushExact("exact_birth",   exp.birth,             prefs.date_birth_risky_from,             prefs.date_birth_risky_to,             prefs.date_birth_unlikely_from,             prefs.date_birth_unlikely_to,             "Birth");
    pushExact("exact_weaning", exp.weaned,            prefs.date_weaned_risky_from,            prefs.date_weaned_risky_to,            prefs.date_weaned_unlikely_from,            prefs.date_weaned_unlikely_to,            "Weaning");
    pushExact("exact_ps",      exp.placementStart,    prefs.date_placement_start_risky_from,   prefs.date_placement_start_risky_to,   prefs.date_placement_start_unlikely_from,   prefs.date_placement_start_unlikely_to,   "Placement Start");
    pushExact("exact_pc",      exp.placementCompleted,prefs.date_placement_completed_risky_from,prefs.date_placement_completed_risky_to,prefs.date_placement_completed_unlikely_from,prefs.date_placement_completed_unlikely_to,"Placement Completed");
  }

  /* horizon rules */
  const today = new Date();
  const emptyStart = startOfMonth(today);
  const emptyEnd = endOfMonth(addMonths(emptyStart, 5)); // six months, current through five out
  const computed = minAll && maxAll ? { start: startOfMonth(minAll), end: endOfMonth(maxAll) } : null;
  const horizon: Horizon = computed ?? { start: emptyStart, end: emptyEnd };

  // adaptive width: fill frame for short ranges, scroll for long ranges
  const months = monthsInclusive(horizon.start, horizon.end);
  const fitToContent = months > 8; // scroll when wide, fill when narrow

  const ganttCommon = {
    horizon,
    today,
    heightPerRow: 32,
    showToday: true,
    showAvailability: false,
    showTravel: false,
    className: "",
    style: {} as React.CSSProperties,
    trimEdgeMonths: false,
    fitToContent,
    rightGutter: 0,
  };

  const allChecked = safePlans.length > 0 && safePlans.every(p => selectedKeys.has(idKey(p.id)));
  const anyChecked = selected.size > 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="px-3 pt-2 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-semibold text-sm text-secondary">Planner view</div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={toggles.showExactBands}
                onChange={(e) => setToggles(s => ({ ...s, showExactBands: e.target.checked }))}
              />
              Availability Bands
            </label>
          </div>
        </div>
      </div>

      {/* Timeline Phases */}
      <section className="px-3 pt-2 pb-3">
        <div className="px-1 pb-2 text-xs font-medium text-secondary">Timeline Phases</div>

        {/* outer rounded border, inner scroller to avoid clipping the border */}
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Gantt
              key={`ph_${horizon.start.toISOString()}_${horizon.end.toISOString()}_${phaseData.length}_${fitToContent}`}
              {...ganttCommon}
              stages={phaseStages()}
              data={anyChecked ? phaseData : []}
            />
          </div>
        </div>
      </section>

      {/* Expected Dates */}
      <section className="px-3 pt-2 pb-6">
        <div className="px-1 pb-2 text-xs font-medium text-secondary">Expected Dates</div>
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Gantt
              key={`ex_${horizon.start.toISOString()}_${horizon.end.toISOString()}_${exactData.length}_${toggles.showExactBands}_${fitToContent}`}
              {...ganttCommon}
              stages={exactStages()}
              data={anyChecked ? exactData : []}
            />
          </div>
        </div>
      </section>

      {/* Plan selection */}
      <div className="px-3 pb-6">
        <div className="rounded-xl bg-black/15 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-secondary">Plans</div>
            <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allChecked} onChange={(e) => setAll(e.target.checked)} />
              Select All
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {safePlans.map(p => (
              <label key={String(p.id)} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedKeys.has(idKey(p.id))}
                  onChange={() => toggleOne(p.id)}
                />
                <span className="truncate">{p.name || String(p.id)}</span>
              </label>
            ))}
            {safePlans.length === 0 && (
              <div className="text-xs text-secondary">No plans available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
