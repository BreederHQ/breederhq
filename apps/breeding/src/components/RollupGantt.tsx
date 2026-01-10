import * as React from "react";
import Gantt from "@bhq/ui/components/Gantt";
import { Tooltip } from "@bhq/ui";
import { readTenantIdFast } from "@bhq/ui/utils/tenant";
import { useAvailabilityPrefs } from "@bhq/ui/hooks";
import { mapTenantPrefs, hasAnyExactValues } from "@bhq/ui/utils/availability";



/* ---------- debug ---------- */
const fmtNice = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", year: "numeric" });

/* ---------- color util (used to make risky distinct) ---------- */
function shade(hex: string, pct: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const mix = (i: number) => clamp(Math.round(parseInt(h.slice(i, i + 2), 16) + (pct / 100) * 255));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(0))}${toHex(mix(2))}${toHex(mix(4))}`;
}

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
  expectedWeaned?: string | Date | null;

  expectedPlacementStartDate?: string | Date | null;
  placementStartDateExpected?: string | Date | null;

  expectedPlacementCompleted?: string | Date | null;
  placementCompletedDateExpected?: string | Date | null;

  isSynthetic?: boolean;
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
  defaultPhaseBandsVisible?: boolean;
};

type Horizon = { start: Date; end: Date };

/* ---------- constants ---------- */

const PHASES_COLORS = { cycleToBreeding: "#3B82F6", birthToPlacement: "#10B981" };
const EXACT_COLORS = ["#06B6D4", "#A78BFA", "#F59E0B", "#14B8A6", "#F97316", "#8B5CF6", "#EF4444"];
const WHATIF_PHASE_COLOR = "#A8FF00"; // bright pink for What If bands and anchors
const WHATIF_EXACT_COLOR = "#76FF57"; // same pink for Expected Dates lines
const WHATIF_PHASE_RISKY_COLOR = "#8EC700"; // darker pink for What If risky edges

// Distinct colors for plan centerlines (vertical date lines) - high contrast, spread across hue wheel
// Exported so selection UI can match checkbox colors to centerline colors
// IMPORTANT: Avoid green/lime colors that could be confused with What If centerlines
// (What If uses #A8FF00 lime and #76FF57 bright green)
export const PLAN_LINE_COLORS = [
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#A855F7", // Violet
  "#E879F9", // Fuchsia
  "#F472B6", // Rose
  "#FB923C", // Light Orange
];

/** Get the centerline color for a plan based on its index among selected plans */
export function getPlanLineColor(index: number): string {
  return PLAN_LINE_COLORS[index % PLAN_LINE_COLORS.length];
}


/* ---------- date utils ---------- */

const dayMs = 24 * 60 * 60 * 1000;
const isDate = (v: unknown): v is Date =>
  v instanceof Date && !Number.isNaN((v as Date).getTime());

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

function pickPlacementCompletedAny(plan: any): string | null {
  return (
    (plan?.placementCompletedDateActual ?? null) ||
    (plan?.placementCompleted ?? null) ||
    (plan?.expectedPlacementCompletedDate ?? null) ||
    (plan?.placementCompletedDateExpected ?? null) ||
    (plan?.placement_completed_expected ?? null) ||
    (plan?.placement_extended_end ?? null) ||
    (plan?.placementExtendedEnd ?? null) ||
    null
  );
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

function resolveExpected(plan: PlanLike): PlanExpected {
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
    plan.expectedWeaned ??
    (plan as any).expectedWeaningDate ??
    (plan as any).weanedDateExpected ??
    null;
  const planExp: PlanExpected = {
    cycle: parseAnyDate(plan.expectedCycleStart),
    testing: parseAnyDate(plan.expectedHormoneTestingStart),
    breeding: parseAnyDate(breedingAny),
    birth: parseAnyDate(plan.expectedBirthDate),
    weaned: parseAnyDate(weanedAny),
    placementStart: parseAnyDate(placementStartAny),
    placementCompleted: parseAnyDate(placementCompletedAny),
  };

  if (!planExp.placementStart && planExp.birth) planExp.placementStart = addDays(planExp.birth, 56);
  if (!planExp.placementCompleted && planExp.placementStart) planExp.placementCompleted = addDays(planExp.placementStart, 21);

  return planExp;
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
  __planId?: string;     // plan group identifier for filtering
  opacity?: number;      // forwarded to Gantt for risky fades
  color?: string;        // forwarded to Gantt for custom color
};

/* ---------- stage defs ---------- */
const phaseStages = (): Stage[] => ([
  { key: "cycle_to_breeding", label: "Cycle → Breeding", baseColor: PHASES_COLORS.cycleToBreeding, hatchLikely: true },
  { key: "birth_to_placement", label: "Birth → Placement", baseColor: PHASES_COLORS.birthToPlacement, hatchLikely: true },
]);
const exactStages = (): Stage[] => {
  const labels = ["Cycle Start", "Hormone Testing", "Breeding", "Birth", "Weaning", "Placement Start", "Placement Completed"];
  const keys = ["exact_cycle", "exact_testing", "exact_breeding", "exact_birth", "exact_weaning", "exact_ps", "exact_pc"];
  return keys.map((k, i) => ({ key: k, label: labels[i], baseColor: EXACT_COLORS[i], hatchLikely: true }));
};

/* ---------- ids ---------- */
const idKey = (x: ID) => String(x);

/* ---------- main ---------- */

type Props = {
  plans?: PlanLike[] | null;
  items?: PlanLike[] | null;
  prefsOverride?: Partial<AvailabilityPrefs>;
  className?: string;
  selected?: Set<ID> | ID[];
  onSelectedChange?: (next: Set<ID>) => void;
  /** When true, hides the built-in plan selection UI (for v2 wrapper usage) */
  hideSelection?: boolean;
};

export default function RollupGantt({
  plans,
  items,
  prefsOverride,
  className = "",
  selected: selectedProp,
  onSelectedChange,
  hideSelection = false,
}: Props) {
  const incoming = plans ?? items ?? [];
  const rawPlans = Array.isArray(incoming) ? incoming : [];
  const idsSig = React.useMemo(() => rawPlans.map(p => String(p?.id ?? "")).join("|"), [rawPlans]);
  const safePlans = React.useMemo<PlanLike[]>(
    () => rawPlans.filter((p): p is PlanLike => !!p && p.id != null),
    [idsSig, rawPlans.length]
  );

  const tenantId = readTenantIdFast?.();

  // Reload trigger: increment to force useAvailabilityPrefs to refetch
  const [reloadKey, setReloadKey] = React.useState(0);
  const hook = useAvailabilityPrefs ? useAvailabilityPrefs({ tenantId, reloadKey }) : undefined;

  // Listen for settings changes (same-tab custom event + cross-tab storage event)
  React.useEffect(() => {
    const handleSettingsUpdate = () => {
      setReloadKey(prev => prev + 1);
    };

    const handleStorageUpdate = (e: StorageEvent) => {
      // Reload on availability-related localStorage changes
      if (e.key === "BHQ_ENFORCE_PLUSONE_DATES" ||
          e.key === "BHQ_ENFORCE_PLUSONE_PHASES") {
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

  const prefs: AvailabilityPrefs = {
    ...mapTenantPrefs(hook?.prefs || {}),
    ...(prefsOverride || {}),
  };

  // Compute default visibility for each section separately
  const defaultPhaseBandsVisible =
    prefs.defaultPhaseBandsVisible != null
      ? !!prefs.defaultPhaseBandsVisible
      : hasAnyExactValues(prefs as any);
  const defaultExactBandsVisible =
    prefs.defaultExactBandsVisible != null
      ? !!prefs.defaultExactBandsVisible
      : hasAnyExactValues(prefs as any);

  /* toggles */
  const [toggles, setToggles] = React.useState<{
    showPhases: boolean;
    showExact: boolean;
    showPhaseBands: boolean;  // Timeline Phases band visibility
    showExactBands: boolean;  // Expected Dates band visibility
    lockScroll: boolean;
  }>(() => ({
    showPhases: true,
    showExact: true,
    showPhaseBands: defaultPhaseBandsVisible,
    showExactBands: defaultExactBandsVisible,
    lockScroll: false,
  }));

  // Update showPhaseBands and showExactBands when preferences load (on initial load or settings change)
  React.useEffect(() => {
    setToggles(prev => ({
      ...prev,
      showPhaseBands: defaultPhaseBandsVisible,
      showExactBands: defaultExactBandsVisible,
    }));
  }, [defaultPhaseBandsVisible, defaultExactBandsVisible]);

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
  const setAll = (v: boolean) => {
    // Only affect non-synthetic (real) plans; What If plans are controlled separately
    const realPlans = safePlans.filter(p => !(p as any).isSynthetic);
    setSelected(v ? new Set(realPlans.map(p => p.id)) : new Set<ID>());
  };

  const activePlans = React.useMemo(
    () => safePlans.filter(p => selectedKeys.has(idKey(p.id))),
    [safePlans, selectedKeys]
  );

  // Exclude synthetic (What If) plans from the checkbox list - they're controlled via "Show on chart"
  // Also exclude plans without a cycle date - no seed date means no timeline to plot
  const selectablePlans = React.useMemo(
    () => safePlans.filter(p => {
      if ((p as any).isSynthetic) return false;
      // Must have at least one cycle date to be plottable
      const hasCycleDate = !!(p.lockedCycleStart || p.expectedCycleStart || (p as any).cycleStartDateActual);
      return hasCycleDate;
    }),
    [safePlans]
  );

  /* build data */
  const phases: Stage[] = phaseStages();
  const phaseData: StageDatum[] = [];
  const exactData: StageDatum[] = [];

  // Create a stable color assignment for each plan based on index
  // This ensures each plan gets a unique, consistent color for its centerlines
  const planColorMap = new Map<string, string>();
  activePlans.forEach((p, idx) => {
    planColorMap.set(idKey(p.id), PLAN_LINE_COLORS[idx % PLAN_LINE_COLORS.length]);
  });

  let minAll: Date | null = null;
  let maxAll: Date | null = null;

  for (const p of activePlans) {
    const exp = resolveExpected(p);

    const isSynthetic = (p as any).isSynthetic === true;
    const whatIfTag = isSynthetic ? " (What If)" : "";
    // Get the unique color for this plan's centerlines
    const planLineColor = isSynthetic ? WHATIF_EXACT_COLOR : planColorMap.get(idKey(p.id));

    // Cycle → Breeding
    if (exp.cycle && exp.breeding) {
      if (toggles.showPhaseBands) {
        const b = normalizeBands(
          prefs.cycle_breeding_risky_from, prefs.cycle_breeding_risky_to,
          prefs.cycle_breeding_unlikely_from, prefs.cycle_breeding_unlikely_to,
          !!prefs.autoWidenUnlikely
        );
        const uStart = addDays(exp.cycle, b.uf);
        const uEnd = addDays(exp.breeding, b.ut);
        const rLeftS = addDays(exp.cycle, b.rf);
        const rLeftE = exp.cycle;
        const rRightS = exp.breeding;
        const rRightE = addDays(exp.breeding, b.rt);

        // Unlikely hatch
        // __planId groups related bars so Gantt renders them at the same y position
        const planGroupId = `${p.id}-cycle_to_breeding`;
        phaseData.push({
          key: "cycle_to_breeding",
          likelyRange: { start: uStart, end: uEnd },
          __tooltip: `[${p.name}] Cycle → Breeding${whatIfTag}, Unlikely: ${fmtNice.format(uStart)} → ${fmtNice.format(uEnd)}`,
          __z: 1,
          __planId: planGroupId,
          // For What If plans, use risky color for both unlikely and risky bands
          color: isSynthetic ? WHATIF_PHASE_RISKY_COLOR : undefined,
        });

        // Risky (distinct tint)
        const riskyBase = shade(PHASES_COLORS.cycleToBreeding, -28);
        const riskyColor = isSynthetic ? WHATIF_PHASE_RISKY_COLOR : riskyBase;

        phaseData.push({
          key: "cycle_to_breeding",
          fullRange: { start: rLeftS, end: rLeftE },
          __tooltip: `[${p.name}] Cycle → Breeding${whatIfTag}, Risky (Left): ${fmtNice.format(rLeftS)} → ${fmtNice.format(rLeftE)}`,
          __z: 2,
          __planId: planGroupId,
          opacity: 0.85,
          color: riskyColor,
        });
        phaseData.push({
          key: "cycle_to_breeding",
          fullRange: { start: rRightS, end: rRightE },
          __tooltip: `[${p.name}] Cycle → Breeding${whatIfTag}, Risky (Right): ${fmtNice.format(rRightS)} → ${fmtNice.format(rRightE)}`,
          __z: 2,
          __planId: planGroupId,
          opacity: 0.85,
          color: riskyColor,
        });

        // Center fill strictly between anchors
        phaseData.push({
          key: "cycle_to_breeding",
          fullRange: { start: exp.cycle, end: exp.breeding },
          __tooltip: `[${p.name}] Cycle → Breeding${whatIfTag}: ${fmtNice.format(exp.cycle)} → ${fmtNice.format(exp.breeding)}`,
          __z: 3,
          __planId: planGroupId,
          color: isSynthetic ? WHATIF_PHASE_COLOR : undefined,
        });

        minAll = nonNullMin(minAll, uStart);
        maxAll = nonNullMax(maxAll, uEnd);
        minAll = nonNullMin(minAll, rLeftS);
        maxAll = nonNullMax(maxAll, rRightE);
      } else {
        // Only anchor-to-anchor fill
        phaseData.push({
          key: "cycle_to_breeding",
          fullRange: { start: exp.cycle, end: exp.breeding },
          __tooltip: `[${p.name}] Cycle → Breeding${whatIfTag}: ${fmtNice.format(exp.cycle)} → ${fmtNice.format(exp.breeding)}`,
          __z: 2,
          color: isSynthetic ? WHATIF_PHASE_COLOR : undefined,
        });
        minAll = nonNullMin(minAll, addDays(exp.cycle, -1));
        maxAll = nonNullMax(maxAll, addDays(exp.breeding, +1));
      }

      // Anchors - use plan-specific color for centerlines
      phaseData.push({
        key: "cycle_to_breeding",
        point: exp.cycle,
        __tooltip: `[${p.name}] Cycle Start${whatIfTag}: ${fmtNice.format(exp.cycle)}`,
        __z: 4,
        color: planLineColor,
      });
      phaseData.push({
        key: "cycle_to_breeding",
        point: exp.breeding,
        __tooltip: `[${p.name}] Breeding${whatIfTag}: ${fmtNice.format(exp.breeding)}`,
        __z: 4,
        color: planLineColor,
      });
    }

    // Birth → Placement
    if (exp.birth && exp.placementCompleted) {
      if (toggles.showPhaseBands) {
        const b = normalizeBands(
          prefs.post_risky_from_full_start, prefs.post_risky_to_full_end,
          prefs.post_unlikely_from_likely_start, prefs.post_unlikely_to_likely_end,
          !!prefs.autoWidenUnlikely
        );
        const uStart = addDays(exp.birth, b.uf);
        const uEnd = addDays(exp.placementCompleted, b.ut);
        const rLeftS = addDays(exp.birth, b.rf);
        const rLeftE = exp.birth;
        const rRightS = exp.placementCompleted;
        const rRightE = addDays(exp.placementCompleted, b.rt);

        // Unlikely hatch
        // __planId groups related bars so Gantt renders them at the same y position
        const planGroupId2 = `${p.id}-birth_to_placement`;
        phaseData.push({
          key: "birth_to_placement",
          likelyRange: { start: uStart, end: uEnd },
          __tooltip: `[${p.name}] Birth → Placement${whatIfTag}, Unlikely: ${fmtNice.format(uStart)} → ${fmtNice.format(uEnd)}`,
          __z: 1,
          __planId: planGroupId2,
          // For What If plans, use risky color for both unlikely and risky bands
          color: isSynthetic ? WHATIF_PHASE_RISKY_COLOR : undefined,
        });

        // Risky (distinct tint)
        const riskyBase = shade(PHASES_COLORS.birthToPlacement, -28);
        const riskyColor = isSynthetic ? WHATIF_PHASE_RISKY_COLOR : riskyBase;

        phaseData.push({
          key: "birth_to_placement",
          fullRange: { start: rLeftS, end: rLeftE },
          __tooltip: `[${p.name}] Birth → Placement${whatIfTag}, Risky (Left): ${fmtNice.format(rLeftS)} → ${fmtNice.format(rLeftE)}`,
          __z: 2,
          __planId: planGroupId2,
          opacity: 0.85,
          color: riskyColor,
        });
        phaseData.push({
          key: "birth_to_placement",
          fullRange: { start: rRightS, end: rRightE },
          __tooltip: `[${p.name}] Birth → Placement${whatIfTag}, Risky (Right): ${fmtNice.format(rRightS)} → ${fmtNice.format(rRightE)}`,
          __z: 2,
          __planId: planGroupId2,
          opacity: 0.85,
          color: riskyColor,
        });

        // Center fill strictly between anchors
        phaseData.push({
          key: "birth_to_placement",
          fullRange: { start: exp.birth, end: exp.placementCompleted },
          __tooltip: `[${p.name}] Birth → Placement${whatIfTag}: ${fmtNice.format(exp.birth)} → ${fmtNice.format(exp.placementCompleted)}`,
          __z: 3,
          __planId: planGroupId2,
          color: isSynthetic ? WHATIF_PHASE_COLOR : undefined,
        });

        minAll = nonNullMin(minAll, uStart);
        maxAll = nonNullMax(maxAll, uEnd);
        minAll = nonNullMin(minAll, rLeftS);
        maxAll = nonNullMax(maxAll, rRightE);
      } else {
        // Only anchor-to-anchor fill
        phaseData.push({
          key: "birth_to_placement",
          fullRange: { start: exp.birth, end: exp.placementCompleted },
          __tooltip: `[${p.name}] Birth → Placement${whatIfTag}: ${fmtNice.format(exp.birth)} → ${fmtNice.format(exp.placementCompleted)}`,
          __z: 2,
          color: isSynthetic ? WHATIF_PHASE_COLOR : undefined,
        });
        minAll = nonNullMin(minAll, addDays(exp.birth, -1));
        maxAll = nonNullMax(maxAll, addDays(exp.placementCompleted, +1));
      }

      // Anchors - use plan-specific color for centerlines
      phaseData.push({
        key: "birth_to_placement",
        point: exp.birth,
        __tooltip: `[${p.name}] Birth${whatIfTag}: ${fmtNice.format(exp.birth)}`,
        __z: 4,
        color: planLineColor,
      });
      phaseData.push({
        key: "birth_to_placement",
        point: exp.placementCompleted,
        __tooltip: `[${p.name}] Placement Completed${whatIfTag}: ${fmtNice.format(exp.placementCompleted)}`,
        __z: 4,
        color: planLineColor,
      });
    }

    // Exact rows
    const tweak = (a: Date, b: Date) => (a.getTime() === b.getTime() ? addDays(b, 1) : b);
    const pushExact = (
      key: string,
      anchor?: Date | null,
      rf?: number,
      rt?: number,
      uf?: number,
      ut?: number,
      label?: string
    ) => {
      if (!anchor) return;

      // Separate colors for What If bands vs exact line
      // For What If plans, use risky color for both unlikely and risky bands
      // For real plans, use planLineColor for unique per-plan centerlines
      const bandLikelyColor = isSynthetic ? WHATIF_PHASE_RISKY_COLOR : undefined;
      const bandRiskyColor = isSynthetic ? WHATIF_PHASE_RISKY_COLOR : undefined;
      // Use the plan's unique line color (set earlier in the loop)

      // __planId groups related bars so Gantt renders them at the same y position
      const exactPlanGroupId = `${p.id}-${key}`;

      if (toggles.showExactBands) {
        const b = normalizeBands(rf, rt, uf, ut, !!prefs.autoWidenUnlikely);
        const uStart = addDays(anchor, b.uf);
        const uEnd = tweak(uStart, addDays(anchor, b.ut));
        const rStart = addDays(anchor, b.rf);
        const rEnd = tweak(rStart, addDays(anchor, b.rt));

        // Unlikely band
        exactData.push({
          key,
          likelyRange: { start: uStart, end: uEnd },
          __tooltip: `[${p.name}] ${label || ""}${whatIfTag} (Unlikely): ${fmtNice.format(uStart)} → ${fmtNice.format(uEnd)}`,
          __z: 1,
          __planId: exactPlanGroupId,
          color: bandLikelyColor,
        });

        // Risky band
        exactData.push({
          key,
          fullRange: { start: rStart, end: rEnd },
          __tooltip: `[${p.name}] ${label || ""}${whatIfTag} (Risky): ${fmtNice.format(rStart)} → ${fmtNice.format(rEnd)}`,
          __z: 2,
          __planId: exactPlanGroupId,
          color: bandRiskyColor,
        });

        // Exact vertical line
        exactData.push({
          key,
          point: anchor,
          __tooltip: `[${p.name}] ${label || ""}${whatIfTag}: ${fmtNice.format(anchor)}`,
          __z: 3,
          __planId: exactPlanGroupId,
          color: planLineColor,
        });

        minAll = nonNullMin(minAll, uStart);
        minAll = nonNullMin(minAll, rStart);
        maxAll = nonNullMax(maxAll, uEnd);
        maxAll = nonNullMax(maxAll, rEnd);
      } else {
        // No bands, only the exact line
        exactData.push({
          key,
          point: anchor,
          __tooltip: `[${p.name}] ${label || ""}${whatIfTag}: ${fmtNice.format(anchor)}`,
          __z: 3,
          __planId: exactPlanGroupId,
          color: planLineColor,
        });
        minAll = nonNullMin(minAll, addDays(anchor, -1));
        maxAll = nonNullMax(maxAll, addDays(anchor, +1));
      }
    };

    // Only populate Expected Dates if Cycle Lock is true
    if (p.lockedCycleStart) {
      pushExact("exact_cycle", exp.cycle, prefs.date_cycle_risky_from, prefs.date_cycle_risky_to, prefs.date_cycle_unlikely_from, prefs.date_cycle_unlikely_to, "Cycle Start");
      pushExact("exact_testing", exp.testing, prefs.date_testing_risky_from, prefs.date_testing_risky_to, prefs.date_testing_unlikely_from, prefs.date_testing_unlikely_to, "Hormone Testing");
      pushExact("exact_breeding", exp.breeding, prefs.date_breeding_risky_from, prefs.date_breeding_risky_to, prefs.date_breeding_unlikely_from, prefs.date_breeding_unlikely_to, "Breeding");
      pushExact("exact_birth", exp.birth, prefs.date_birth_risky_from, prefs.date_birth_risky_to, prefs.date_birth_unlikely_from, prefs.date_birth_unlikely_to, "Birth");
      pushExact("exact_weaning", exp.weaned, prefs.date_weaned_risky_from, prefs.date_weaned_risky_to, prefs.date_weaned_unlikely_from, prefs.date_weaned_unlikely_to, "Weaning");
      pushExact("exact_ps", exp.placementStart, prefs.date_placement_start_risky_from, prefs.date_placement_start_risky_to, prefs.date_placement_start_unlikely_from, prefs.date_placement_start_unlikely_to, "Placement Start");
      pushExact("exact_pc", exp.placementCompleted, prefs.date_placement_completed_risky_from, prefs.date_placement_completed_risky_to, prefs.date_placement_completed_unlikely_from, prefs.date_placement_completed_unlikely_to, "Placement Completed");
    }
  }

  const visibleExactStages = exactStages();

  /* horizon rules */
  const today = new Date();
  const emptyStart = startOfMonth(today);
  // 18 month default horizon: 0 through 17 gives 18 months inclusive
  const emptyEnd = endOfMonth(addMonths(emptyStart, 17));
  const computed = ((): { start: Date; end: Date } | null => {
    const mins: Date[] = [];
    const maxs: Date[] = [];
    const collect = (d: StageDatum) => {
      if (d.likelyRange) { mins.push(d.likelyRange.start); maxs.push(d.likelyRange.end); }
      if (d.fullRange) { mins.push(d.fullRange.start); maxs.push(d.fullRange.end); }
      if (d.point) { mins.push(d.point); maxs.push(d.point); }
    };
    [...phaseData, ...exactData].forEach(collect);
    if (mins.length === 0 || maxs.length === 0) return null;
    const min = mins.reduce((a, b) => (a < b ? a : b));
    const max = maxs.reduce((a, b) => (a > b ? a : b));
    return { start: startOfMonth(min), end: endOfMonth(max) };
  })();
  const horizon: Horizon = computed ?? { start: emptyStart, end: emptyEnd };

  const months = monthsInclusive(horizon.start, horizon.end);
  const fitToContent = months > 8;

  const ganttCommon = {
    horizon,
    today,
    heightPerRow: 48,
    showToday: true,
    showAvailability: false,
    className: "bhq-gantt planner",
    style: {} as React.CSSProperties,
    trimEdgeMonths: false,
    fitToContent,
    rightGutter: 0,
  };

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
    if (a && b) b.scrollLeft = a.scrollLeft;
  }, [toggles.lockScroll, horizon.start, horizon.end, fitToContent, anyChecked, phases.length]);
  return (
    <div className={className}>
      {/* Timeline Phases */}
      <section className="px-3 pt-1 pb-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <div className="text-xs font-medium text-secondary">Timeline Phases</div>
          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={toggles.lockScroll}
                onChange={(e) => setToggles(s => ({ ...s, lockScroll: e.target.checked }))}
              />
              Lock Scroll
            </label>
            <Tooltip content="Adjust band lengths in Settings">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.showPhaseBands}
                  onChange={(e) => setToggles(s => ({ ...s, showPhaseBands: e.target.checked }))}
                />
                Availability Bands
              </label>
            </Tooltip>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="overflow-x-auto" ref={phScrollRef} onScroll={onPhScroll}>
            <Gantt
              key={`ph_${horizon.start.toISOString()}_${horizon.end.toISOString()}_${phaseData.length}_${anyChecked}_${toggles.showPhaseBands}_${fitToContent}`}
              {...ganttCommon}
              stages={phaseStages()}
              data={(anyChecked ? phaseData : []) as any}
            />
          </div>
        </div>
      </section>

      {/* Expected Dates */}
      <section className={`px-3 pt-2 ${hideSelection ? "pb-2" : "pb-6"}`}>
        <div className="flex items-center justify-between px-1 pb-2">
          <div className="text-xs font-medium text-secondary">Expected Dates</div>
          <div className="flex items-center gap-3 text-xs">
            <Tooltip content="Adjust band lengths in Settings">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles.showExactBands}
                  onChange={(e) => setToggles(s => ({ ...s, showExactBands: e.target.checked }))}
                />
                Availability Bands
              </label>
            </Tooltip>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="overflow-x-auto" ref={exScrollRef} onScroll={onExScroll}>
            <Gantt
              key={`ex_${horizon.start.toISOString()}_${horizon.end.toISOString()}_${visibleExactStages.length}_${anyChecked}_${toggles.showExactBands}_${fitToContent}`}
              {...ganttCommon}
              stages={visibleExactStages}
              data={(anyChecked ? exactData : []) as any}
            />
          </div>
        </div>
      </section>

      {/* Plan selection - hidden when v2 wrapper provides Phase Visibility + Individual Plans */}
      {!hideSelection && (
        <div className="px-3 pb-6">
          <div className="rounded-xl bg-black/15 p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xs font-medium text-secondary">Plans</div>
              <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => setAll(e.target.checked)}
                />
                Toggle All Plans
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {selectablePlans.map(p => {
                const isSelected = selectedKeys.has(idKey(p.id));
                // Get the index among active (selected) plans to match centerline color
                const selectedIndex = activePlans.findIndex(ap => ap.id === p.id);
                const lineColor = isSelected && selectedIndex >= 0 ? getPlanLineColor(selectedIndex) : undefined;
                return (
                  <label key={String(p.id)} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(p.id)}
                      className="rounded"
                      style={lineColor ? { accentColor: lineColor } : undefined}
                    />
                    <span className="truncate">{p.name || String(p.id)}</span>
                  </label>
                );
              })}
              {selectablePlans.length === 0 && (
                <div className="text-xs text-secondary">No plans available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
