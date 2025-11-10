// apps/breeding/src/components/RollupGantt.tsx
import * as React from "react";
import Gantt from "@bhq/ui/components/Gantt";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";
import { useAvailabilityPrefs } from "@bhq/ui/hooks";
import { mapTenantPrefs, hasAnyExactValues } from "@bhq/ui/utils/availability";
import { pickPlacementCompletedAny } from "@bhq/ui/utils";

/* ---------- debug ---------- */
const DEBUG_ROLLUP_GANTT = true;
const dlog = (...a: any[]) => { if (DEBUG_ROLLUP_GANTT) console.log(...a); };
const dgroup = (l: string) => { if (DEBUG_ROLLUP_GANTT) console.groupCollapsed(l); };
const dgroupEnd = () => { if (DEBUG_ROLLUP_GANTT) console.groupEnd(); };
const dtable = (rows: any) => { if (DEBUG_ROLLUP_GANTT) console.table(rows); };
const fmtD = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

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

/* ---------- constants ---------- */

const PHASES_COLORS = { cycleToBreeding: "#3B82F6", birthToPlacement: "#10B981" };
const EXACT_COLORS = ["#06B6D4", "#A78BFA", "#F59E0B", "#14B8A6", "#F97316", "#8B5CF6", "#EF4444"];

/* ---------- date utils ---------- */

const dayMs = 24 * 60 * 60 * 1000;
const isDate = (v: unknown): v is Date => v instanceof Date && !Number.isNaN((v as Date).getTime());
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
  const out = { rf: -rfMag, rt: +rtMag, uf: -ufMag, ut: +utMag };
  dlog("[RollupGantt] normalizeBands ->", { risky_from, risky_to, unlikely_from, unlikely_to, autoWiden, out });
  return out;
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
  const placementCompletedAny = pickPlacementCompletedAny(plan);

  const placementStartAny =
    plan.expectedPlacementStartDate ??
    plan.placementStartDateExpected ??
    null;

  const breedingAny =
    plan.expectedBreedDate ??
    plan.expectedBreedingDate ??
    null;

  const weanedAny =
    plan.expectedWeanedDate ??
    // tolerate common aliases
    (plan as any).expectedWeaningDate ??
    (plan as any).expectedWeaned ??
    (plan as any).weanedDateExpected ??
    null;

  dgroup(`[RollupGantt] incoming wean fields for ${String(plan.name)} (${String(plan.id)})`);
  dtable([{
    expectedWeanedDate: (plan as any).expectedWeanedDate ?? null,
    expectedWeaningDate: (plan as any).expectedWeaningDate ?? null,
    expectedWeaned: (plan as any).expectedWeaned ?? null,
    weanedDateExpected: (plan as any).weanedDateExpected ?? null,
  }]);
  dgroupEnd();

  const planExp: PlanExpected = {
    cycle: parseAnyDate(plan.expectedCycleStart),
    testing: parseAnyDate(plan.expectedHormoneTestingStart),
    breeding: parseAnyDate(breedingAny),
    birth: parseAnyDate(plan.expectedBirthDate),
    weaned: parseAnyDate(weanedAny),
    placementStart: parseAnyDate(placementStartAny),
    placementCompleted: parseAnyDate(placementCompletedAny),
  };

  const needsCompute =
    !planExp.weaned ||
    !(planExp.cycle && planExp.breeding && planExp.birth && planExp.placementCompleted);

  let computed: PlanExpected | null = null;

  if (needsCompute && computeExpected && plan.lockedCycleStart) {
    const r = computeExpected(plan) as any;
    const computedPlacementStartAny =
      r?.expectedPlacementStartDate ?? r?.placementStartDateExpected ?? null;

    computed = {
      cycle: parseAnyDate(r?.expectedCycleStart),
      testing: parseAnyDate(r?.expectedHormoneTestingStart ?? null),
      breeding: parseAnyDate(r?.expectedBreedDate ?? r?.expectedBreedingDate ?? null),
      birth: parseAnyDate(r?.expectedBirthDate ?? null),
      weaned: parseAnyDate(
        r?.expectedWeanedDate ??
        r?.expectedWeaningDate ??
        r?.expectedWeaned ??
        r?.weanedDateExpected ??
        null
      ),
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

  if (!merged.placementStart && merged.birth) merged.placementStart = addDays(merged.birth, 56);
  if (!merged.placementCompleted && merged.placementStart) merged.placementCompleted = addDays(merged.placementStart, 21);

  // final fallback to ensure plotting, for Rollup only
  if (!merged.weaned) {
    if (merged.placementStart) {
      dlog("[RollupGantt] weaned missing, inferring from placementStart");
      merged.weaned = merged.placementStart;
    } else if (merged.birth) {
      dlog("[RollupGantt] weaned missing, inferring from birth + 56d");
      merged.weaned = addDays(merged.birth, 56);
    }
  }

  dgroup(`[RollupGantt] resolved expected for plan ${String(plan.name)} (${String(plan.id)})`);
  dtable([
    { key: "cycle", date: fmtD(merged.cycle) },
    { key: "testing", date: fmtD(merged.testing) },
    { key: "breeding", date: fmtD(merged.breeding) },
    { key: "birth", date: fmtD(merged.birth) },
    { key: "weaned", date: fmtD(merged.weaned) },
    { key: "placementStart", date: fmtD(merged.placementStart) },
    { key: "placementCompleted", date: fmtD(merged.placementCompleted) },
  ]);
  dgroupEnd();

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
  const labels = ["Cycle Start", "Hormone Testing", "Breeding", "Birth", "Weaning", "Placement Start", "Placement Completed"];
  const keys = ["exact_cycle", "exact_testing", "exact_breeding", "exact_birth", "exact_weaning", "exact_ps", "exact_pc"];
  return keys.map((k, i) => ({ key: k, label: labels[i], baseColor: EXACT_COLORS[i], hatchLikely: true }));
}

/* ---------- ids ---------- */

const idKey = (x: ID) => String(x);

/* ---------- main ---------- */

type Props = {
  plans?: PlanLike[] | null;
  items?: PlanLike[] | null;
  computeExpected?: ComputeExpectedFn;
  prefsOverride?: Partial<AvailabilityPrefs>;
  className?: string;
  selected?: Set<ID> | ID[];
  onSelectedChange?: (next: Set<ID>) => void;
};

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
  const [toggles, setToggles] = React.useState<{
    showPhases: boolean;
    showExact: boolean;
    showExactBands: boolean;
    lockScroll: boolean;
  }>(() => ({
    showPhases: true,
    showExact: true,
    showExactBands: defaultBandsVisible,
    lockScroll: false,
  }));

  /* selection, allow empty */
  const controlled = selectedProp instanceof Set ? selectedProp : selectedProp ? new Set(selectedProp) : undefined;
  const [internalSel, setInternalSel] = React.useState<Set<ID>>(() => new Set<ID>());
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
  const exactsAll: Stage[] = exactStages();
  const phaseData: StageDatum[] = [];
  const exactData: StageDatum[] = [];

  let minAll: Date | null = null;
  let maxAll: Date | null = null;

  for (const p of activePlans) {
    const exp = resolveExpected(p, computeExpected);

    if (exp.cycle && exp.breeding) {
      const d: StageDatum = {
        key: "cycle_to_breeding",
        point: exp.breeding,
        __tooltip: `[${p.name}] Cycle to Breeding`,
        __z: 1,
      };

      if (toggles.showExactBands) {
        const b = normalizeBands(
          prefs.cycle_breeding_risky_from, prefs.cycle_breeding_risky_to,
          prefs.cycle_breeding_unlikely_from, prefs.cycle_breeding_unlikely_to,
          !!prefs.autoWidenUnlikely
        );
        const uStart = addDays(exp.cycle, b.uf);
        const uEnd = addDays(exp.breeding, b.ut);
        const rStart = addDays(exp.cycle, b.rf);
        const rEnd = addDays(exp.breeding, b.rt);
        d.fullRange = { start: rStart, end: rEnd };
        d.likelyRange = { start: uStart, end: uEnd };
        minAll = nonNullMin(minAll, uStart);
        minAll = nonNullMin(minAll, rStart);
        maxAll = nonNullMax(maxAll, uEnd);
        maxAll = nonNullMax(maxAll, rEnd);
      } else {
        minAll = nonNullMin(minAll, addDays(exp.cycle, -1));
        maxAll = nonNullMax(maxAll, addDays(exp.breeding, +1));
      }

      phaseData.push(d);
    }

    if (exp.birth && exp.placementCompleted) {
      const d: StageDatum = {
        key: "birth_to_placement",
        point: exp.placementCompleted,
        __tooltip: `[${p.name}] Birth to Placement`,
        __z: 1,
      };

      if (toggles.showExactBands) {
        const b = normalizeBands(
          prefs.post_risky_from_full_start, prefs.post_risky_to_full_end,
          prefs.post_unlikely_from_likely_start, prefs.post_unlikely_to_likely_end,
          !!prefs.autoWidenUnlikely
        );
        const uStart = addDays(exp.birth, b.uf);
        const uEnd = addDays(exp.placementCompleted, b.ut);
        const rStart = addDays(exp.birth, b.rf);
        const rEnd = addDays(exp.placementCompleted, b.rt);
        d.fullRange = { start: rStart, end: rEnd };
        d.likelyRange = { start: uStart, end: uEnd };
        minAll = nonNullMin(minAll, uStart);
        minAll = nonNullMin(minAll, rStart);
        maxAll = nonNullMax(maxAll, uEnd);
        maxAll = nonNullMax(maxAll, rEnd);
      } else {
        minAll = nonNullMin(minAll, addDays(exp.birth, -1));
        maxAll = nonNullMax(maxAll, addDays(exp.placementCompleted, +1));
      }

      phaseData.push(d);
    }

    const tweak = (a: Date, b: Date) => (a.getTime() === b.getTime() ? addDays(b, 1) : b);

    const pushExact = (
      key: string, anchor?: Date | null,
      rf?: number, rt?: number, uf?: number, ut?: number, label?: string
    ) => {
      if (!anchor) return;

      if (toggles.showExactBands) {
        const b = normalizeBands(rf, rt, uf, ut, !!prefs.autoWidenUnlikely);
        const uStart = addDays(anchor, b.uf);
        const uEnd = tweak(uStart, addDays(anchor, b.ut));
        const rStart = addDays(anchor, b.rf);
        const rEnd = tweak(rStart, addDays(anchor, b.rt));

        // unlikely band
        exactData.push({
          key,
          likelyRange: { start: uStart, end: uEnd },
          __tooltip: `[${p.name}] ${label || ""} (Unlikely)`,
          __z: 1,
        });

        // risky band
        exactData.push({
          key,
          fullRange: { start: rStart, end: rEnd },
          __tooltip: `[${p.name}] ${label || ""} (Risky)`,
          __z: 2,
        });

        // anchor line on top
        exactData.push({
          key,
          point: anchor,
          __tooltip: `[${p.name}] ${label || ""}`,
          __z: 3,
        });

        minAll = nonNullMin(minAll, uStart);
        minAll = nonNullMin(minAll, rStart);
        maxAll = nonNullMax(maxAll, uEnd);
        maxAll = nonNullMax(maxAll, rEnd);
      } else {
        // anchor only
        exactData.push({
          key,
          point: anchor,
          __tooltip: `[${p.name}] ${label || ""}`,
          __z: 3,
        });
        minAll = nonNullMin(minAll, addDays(anchor, -1));
        maxAll = nonNullMax(maxAll, addDays(anchor, +1));
      }
    };

    pushExact("exact_cycle", exp.cycle, prefs.date_cycle_risky_from, prefs.date_cycle_risky_to, prefs.date_cycle_unlikely_from, prefs.date_cycle_unlikely_to, "Cycle Start");
    pushExact("exact_testing", exp.testing, prefs.date_testing_risky_from, prefs.date_testing_risky_to, prefs.date_testing_unlikely_from, prefs.date_testing_unlikely_to, "Hormone Testing");
    pushExact("exact_breeding", exp.breeding, prefs.date_breeding_risky_from, prefs.date_breeding_risky_to, prefs.date_breeding_unlikely_from, prefs.date_breeding_unlikely_to, "Breeding");
    pushExact("exact_birth", exp.birth, prefs.date_birth_risky_from, prefs.date_birth_risky_to, prefs.date_birth_unlikely_from, prefs.date_birth_unlikely_to, "Birth");
    pushExact("exact_weaning", exp.weaned, prefs.date_weaned_risky_from, prefs.date_weaned_risky_to, prefs.date_weaned_unlikely_from, prefs.date_weaned_unlikely_to, "Weaning");
    pushExact("exact_ps", exp.placementStart, prefs.date_placement_start_risky_from, prefs.date_placement_start_risky_to, prefs.date_placement_start_unlikely_from, prefs.date_placement_start_unlikely_to, "Placement Start");
    pushExact("exact_pc", exp.placementCompleted, prefs.date_placement_completed_risky_from, prefs.date_placement_completed_risky_to, prefs.date_placement_completed_unlikely_from, prefs.date_placement_completed_unlikely_to, "Placement Completed");

    const weanRows = exactData.filter(d => d.key === "exact_weaning" && (d.point || d.fullRange || d.likelyRange));
    dlog(`[RollupGantt] weaning payload rows for plan ${String(p.name)} (${String(p.id)}):`,
      weanRows.map(w => ({
        point: fmtD(w.point ?? null),
        full_start: fmtD(w.fullRange?.start ?? null),
        full_end: fmtD(w.fullRange?.end ?? null),
        likely_start: fmtD(w.likelyRange?.start ?? null),
        likely_end: fmtD(w.likelyRange?.end ?? null),
      }))
    );
  }

  const exactKeysPresent = new Set(exactData.map(d => d.key));
  const visibleExactStages = exactStages().filter(s => exactKeysPresent.has(s.key));

  /* horizon rules */
  const today = new Date();
  const emptyStart = startOfMonth(today);
  const emptyEnd = endOfMonth(addMonths(emptyStart, 5));
  const computed = minAll && maxAll ? { start: startOfMonth(minAll), end: endOfMonth(maxAll) } : null;
  const horizon: Horizon = computed ?? { start: emptyStart, end: emptyEnd };

  const months = monthsInclusive(horizon.start, horizon.end);
  const fitToContent = months > 8;

  const ganttCommon = {
    horizon,
    today,
    heightPerRow: 32,
    showToday: true,
    showAvailability: false,
    showTravel: false,
    className: "bhq-gantt planner",
    style: {} as React.CSSProperties,
    trimEdgeMonths: false,
    fitToContent,
    rightGutter: 0,
  };

  const allChecked = safePlans.length > 0 && safePlans.every(p => selectedKeys.has(idKey(p.id)));
  const anyChecked = selected.size > 0;

  /* ---------- scroll lock wiring ---------- */
  const phScrollRef = React.useRef<HTMLDivElement | null>(null);
  const exScrollRef = React.useRef<HTMLDivElement | null>(null);
  const syncing = React.useRef(false);

  const syncScroll = React.useCallback((source: "ph" | "ex") => {
    if (!toggles.lockScroll) return;
    const src = source === "ph" ? phScrollRef.current : exScrollRef.current;
    const dst = source === "ph" ? exScrollRef.current : phScrollRef.current;
    if (!src || !dst) return;
    if (syncing.current) return;
    syncing.current = true;
    dst.scrollLeft = src.scrollLeft;
    requestAnimationFrame(() => { syncing.current = false; });
  }, [toggles.lockScroll]);

  const onPhScroll = React.useCallback(() => syncScroll("ph"), [syncScroll]);
  const onExScroll = React.useCallback(() => syncScroll("ex"), [syncScroll]);

  React.useEffect(() => {
    if (!toggles.lockScroll) return;
    const a = phScrollRef.current;
    const b = exScrollRef.current;
    if (a && b) {
      b.scrollLeft = a.scrollLeft;
    }
  }, [toggles.lockScroll, horizon.start, horizon.end, fitToContent, anyChecked, phases.length]);

  dgroup("[RollupGantt] Gantt payload rows -> StageDatum[]");
  dtable(
    exactData.concat(phaseData).map(o => ({
      key: o.key,
      point: fmtD(o.point ?? null),
      full_start: fmtD(o.fullRange?.start ?? null),
      full_end: fmtD(o.fullRange?.end ?? null),
      likely_start: fmtD(o.likelyRange?.start ?? null),
      likely_end: fmtD(o.likelyRange?.end ?? null),
      z: (o as any).__z,
    }))
  );
  dgroupEnd();

  dgroup("[RollupGantt] exact rows summary, weaning only");
  dtable(
    exactData
      .filter(d => d.key === "exact_weaning")
      .map(d => ({
        key: d.key,
        point: fmtD(d.point ?? null),
        full_start: fmtD(d.fullRange?.start ?? null),
        full_end: fmtD(d.fullRange?.end ?? null),
        likely_start: fmtD(d.likelyRange?.start ?? null),
        likely_end: fmtD(d.likelyRange?.end ?? null),
      }))
  );
  dgroupEnd();

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
                checked={toggles.lockScroll}
                onChange={(e) => setToggles(s => ({ ...s, lockScroll: e.target.checked }))}
              />
              Lock Scroll
            </label>
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
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <div
            className="overflow-x-auto"
            ref={phScrollRef}
            onScroll={onPhScroll}
          >
            <Gantt
              key={`ph_${horizon.start.toISOString()}_${horizon.end.toISOString()}_${phaseData.length}_${anyChecked}_${toggles.showExactBands}_${fitToContent}`}
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
          <div
            className="overflow-x-auto"
            ref={exScrollRef}
            onScroll={onExScroll}
          >
            <Gantt
              key={`ex_${horizon.start.toISOString()}_${horizon.end.toISOString()}_${visibleExactStages.length}_${anyChecked}_${toggles.showExactBands}_${fitToContent}`}
              {...ganttCommon}
              stages={visibleExactStages}
              data={anyChecked ? exactData : []}
            />
          </div>
        </div>
      </section>

      {/* Plan selection */}
      <div className="px-3 pb-6">
        <div className="rounded-xl bg-black/15 p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xs font-medium text-secondary">Plans</div>
            <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={safePlans.length > 0 && safePlans.every(p => selectedKeys.has(idKey(p.id)))}
                onChange={(e) => setAll(e.target.checked)}
              />
              Toggle All Plans
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
