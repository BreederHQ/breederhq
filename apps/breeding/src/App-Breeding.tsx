// apps/breeding/src/App-Breeding.tsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Trash2, Plus, MoreHorizontal, MoreVertical, Download, Archive, Undo2 } from "lucide-react";
import {
  PageHeader,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableFooter,
  ColumnsPopover,
  hooks,
  SearchBar,
  FiltersRow,
  DetailsHost,
  DetailsScaffold,
  SectionCard,
  Button,
  Input,
  utils,
  BreedCombo,
  CustomBreedDialog,
  exportToCsv,
  Popover,
} from "@bhq/ui";
import { FinanceTab } from "@bhq/ui/components/Finance";
import { Overlay } from "@bhq/ui/overlay";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { getOverlayRoot } from "@bhq/ui/overlay/core";
import { NavLink, useInRouterContext } from "react-router-dom";
import RollupGantt from "./components/RollupGantt";
import PerPlanGantt from "./components/PerPlanGantt";
import PlannerSwitch from "./components/PlannerSwitch";
import PlanJourney from "./components/PlanJourney";
import "@bhq/ui/styles/table.css";
import "@bhq/ui/styles/details.css";
import "@bhq/ui/styles/datefield.css";
import { makeBreedingApi } from "./api";

import { windowsFromPlan, expectedTestingFromCycleStart, pickPlacementCompletedAny } from "@bhq/ui/utils";
import { reproEngine } from "@bhq/ui/utils";

// ── Calendar / Planning wiring ─────────────────────────────
import BreedingCalendar from "./components/BreedingCalendar";

// ── Planner pages ─────────────────────────────────────────
import { YourBreedingPlansPage, WhatIfPlanningPage } from "./pages/planner";
import type { WhatIfFemale } from "./pages/planner/whatIfTypes";
import { toBackendStatus, fromBackendStatus, deriveBreedingStatus as deriveBreedingStatusImported, type Status as PlannerStatus } from "./pages/planner/deriveBreedingStatus";


/* Cycle math */
import {
  useCyclePlanner,
  type Species as PlannerSpecies,
  type ExpectedDates as PlannerExpected,
} from "@bhq/ui/hooks";

import { type NormalizedPlan } from "./adapters/planToGantt";

const dateFieldW = "w-full";
const dateInputCls = "h-8 py-0 px-2 text-sm bg-transparent border-hairline";

const MODAL_Z = 2147485000;
const modalRoot = typeof document !== "undefined" ? document.body : null;

const PLAN_TABS = [
  { key: "overview", label: "Overview" },
  { key: "dates", label: "Dates" },
  { key: "deposits", label: "Deposits" },
  { key: "finances", label: "Finances" },
  { key: "audit", label: "Audit" },
] as const;


/* ───────────────────────── Types ───────────────────────── */
type ID = number | string;

type SpeciesWire = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | (string & {});
type SpeciesUi = "Dog" | "Cat" | "Horse" | "Goat" | "Rabbit";

type WhatIfRow = {
  id: string;
  damId: ID | null;
  damName: string | null;
  species: SpeciesWire | null;
  cycleStartIso: string | null;
  showOnChart: boolean;
  femaleCycleLenOverrideDays?: number | null;
};

type BHQDateFieldProps = {
  label: string;
  value?: string | null;
  defaultValue?: string | null;
  readOnly?: boolean;
  onChange?: (v: string) => void; // will receive ISO yyyy-mm-dd or ""
};

function asISODateOnly(v: unknown): string | null {
  if (!v) return null;

  if (v instanceof Date && !isNaN(v.getTime())) {
    // Use local date components to avoid UTC timezone shift
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // If it's an ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ), extract just the date part
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      return s.slice(0, 10);
    }

    // Parse as local date to avoid timezone issues
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

// Normalize a date value to yyyy-mm-dd or empty string for safe use in date inputs
function normalizeDateISO(value: unknown): string {
  const iso = asISODateOnly(value);
  return iso ?? "";
}

// Normalize a wire species code. Returns an uppercase string or null.
function normalizeSpeciesWire(v: unknown): SpeciesWire | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase();
  return s ? (s as SpeciesWire) : null;
}

type ExpectedDatesNormalized = {
  cycleStart: string | null;
  hormoneTestingStart: string | null;
  breedDate: string | null;
  birthDate: string | null;
  weanedDate: string | null;
  placementStart: string | null;
  placementCompleted: string | null;
};

// Normalize reproEngine milestones into one stable shape for the Dates tab and lock payload.
function normalizeExpectedMilestones(
  milestones: any,
  cycleStart: string | null
): ExpectedDatesNormalized {
  const day = (x: any) => asISODateOnly(x);

  const cycle = day(cycleStart) ?? null;

  const hormoneTestingStart =
    day(milestones?.expectedHormoneTestingStart) ??
    day(milestones?.hormone_testing?.likely?.[0]) ?? // reproEngine nested array format
    day(milestones?.hormone_testing?.full?.[0]) ?? // reproEngine nested array format
    day(milestones?.hormone_testing_full?.start) ?? // reproEngine format: { start, end }
    day(milestones?.hormone_testing_full?.[0]) ?? // legacy array format
    day(milestones?.hormone_testing_likely?.[0]) ?? // legacy array format
    day(milestones?.hormoneTesting_full?.[0]) ??
    day(milestones?.testing_expected) ??
    day(milestones?.testing_start) ??
    day(milestones?.hormone_testing_start) ??
    null;

  const breedDate =
    day(milestones?.expectedBreedDate) ??
    day(milestones?.breeding_expected) ?? // legacy format from computeExpectedForPlan
    day(milestones?.ovulation_center) ?? // reproEngine milestone
    day(milestones?.ovulation) ??
    day(milestones?.breeding?.likely?.start) ?? // reproEngine nested format
    day(milestones?.breeding_full?.start) ?? // reproEngine flat format
    day(milestones?.breeding_likely?.start) ?? // reproEngine flat format
    day(milestones?.breeding?.likely?.[0]) ?? // reproEngine nested array format
    day(milestones?.breeding_full?.[0]) ?? // legacy array format
    day(milestones?.breeding_likely?.[0]) ?? // legacy array format
    null;

  const birthDate =
    day(milestones?.expectedBirthDate) ??
    day(milestones?.birth_expected) ?? // legacy format from computeExpectedForPlan
    day(milestones?.birth?.likely?.[0]) ?? // reproEngine nested array format (birth.likely)
    day(milestones?.birth?.full?.[0]) ?? // reproEngine nested array format (birth.full)
    day(milestones?.birth_likely?.[0]) ?? // reproEngine flat format
    day(milestones?.birth_full?.[0]) ?? // reproEngine flat format
    day(milestones?.whelping?.likely?.start) ?? // reproEngine nested format (whelping)
    day(milestones?.whelping_full?.start) ?? // reproEngine flat format
    day(milestones?.whelping_likely?.start) ?? // reproEngine flat format
    day(milestones?.whelping?.likely?.[0]) ?? // reproEngine nested array format
    day(milestones?.whelping_full?.[0]) ?? // legacy array format
    day(milestones?.whelping_likely?.[0]) ?? // legacy array format
    null;

  const weanedDate =
    day(milestones?.expectedWeaned) ??
    day(milestones?.weaning_expected) ?? // legacy format from computeExpectedForPlan
    day(milestones?.puppy_care?.full?.end) ?? // reproEngine nested format: end of puppy care
    day(milestones?.puppy_care_full?.end) ?? // reproEngine flat format: end of puppy care
    day(milestones?.go_home_normal?.likely?.start) ?? // reproEngine nested format
    day(milestones?.go_home_normal_full?.start) ?? // reproEngine flat format
    day(milestones?.go_home_normal_likely?.start) ?? // reproEngine flat format
    day(milestones?.go_home_normal?.likely?.[0]) ?? // reproEngine nested array format
    day(milestones?.go_home_normal_full?.[0]) ?? // legacy array format
    day(milestones?.go_home_normal_likely?.[0]) ?? // legacy array format
    day(milestones?.post_birth_care_likely?.[0]) ??
    null;

  const placementStart =
    day(milestones?.expectedPlacementStartDate) ??
    day(milestones?.placement_expected) ?? // legacy format from computeExpectedForPlan
    day(milestones?.go_home_normal?.likely?.start) ?? // reproEngine nested format
    day(milestones?.go_home_normal_full?.start) ?? // reproEngine flat format
    day(milestones?.go_home_normal?.likely?.[0]) ?? // reproEngine nested array format
    day(milestones?.placement_start_expected) ??
    null;

  const placementCompleted =
    day(milestones?.expectedPlacementCompletedDate) ??
    day(milestones?.placement_expected_end) ?? // legacy format from computeExpectedForPlan
    day(milestones?.go_home_extended?.full?.end) ?? // reproEngine nested format: end of extended window
    day(milestones?.go_home_extended_full?.end) ?? // reproEngine flat format: end of extended window
    day(milestones?.go_home_extended?.full?.[1]) ?? // reproEngine nested array format
    day(milestones?.placement_extended_end) ??
    day(milestones?.placement_extended_full?.[1]) ?? // legacy array format
    null;

  // Sanity check: placement should never be before weaning completed
  let finalPlacementStart = placementStart;
  if (weanedDate && placementStart && placementStart < weanedDate) {
    finalPlacementStart = weanedDate;
  }

  return {
    cycleStart: cycle,
    hormoneTestingStart,
    breedDate,
    birthDate,
    weanedDate,
    placementStart: finalPlacementStart,
    placementCompleted,
  };
}



// ── Canonical “Testing Start” picker: prefer full-window[0] → expected → start; else +7d from locked ──
function pickExpectedTestingStart(preview: any, lockedCycleStart?: string | null) {
  const day = (s: any) => (s ? String(s).slice(0, 10) : null);

  const fromPreview =
    preview?.hormone_testing_full?.[0] ??
    preview?.hormoneTesting_full?.[0] ??
    preview?.hormone_testing_expected ??
    preview?.testing_expected ??
    preview?.testing_start ??
    preview?.hormone_testing_start ??
    null;

  if (fromPreview) return day(fromPreview);

  if (lockedCycleStart) {
    const [y, m, d] = String(lockedCycleStart).slice(0, 10).split("-").map(Number);
    const t = Date.UTC(y, m - 1, d) + 7 * 86400000; // +7 days in UTC
    const dt = new Date(t);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}


function computeExpectedForPlan(plan: {
  species?: string;
  lockedCycleStart?: string | null;
  femaleCycleLenOverrideDays?: number | null;
}): PlannerExpected | null {
  const locked = (plan.lockedCycleStart || "").slice(0, 10) || null;
  const speciesWire = typeof plan.species === "string" ? plan.species : "";

  if (!locked || !speciesWire) return null;

  try {
    // expectedMilestonesFromLocked doesn't support override yet, so we need to call buildTimelineFromSeed directly
    const timeline = (reproEngine as any).buildTimelineFromSeed?.(
      {
        animalId: "",
        species: speciesWire,
        cycleStartsAsc: [],
        today: new Date().toISOString().slice(0, 10),
        femaleCycleLenOverrideDays: plan.femaleCycleLenOverrideDays,
      },
      locked
    );

    if (!timeline) {
      return (reproEngine.expectedMilestonesFromLocked(locked, speciesWire) as any) ?? null;
    }

    // Convert timeline to legacy expected format
    return {
      ovulation: timeline.milestones?.ovulation_center ?? null,
      breeding_expected: timeline.windows?.breeding?.likely?.[0] ?? null,
      birth_expected: timeline.windows?.whelping?.likely?.[0] ?? null,
      weaning_expected: timeline.windows?.puppy_care?.likely?.[1] ?? null,
      placement_expected: timeline.windows?.go_home_normal?.likely?.[0] ?? null,
      placement_expected_end: timeline.windows?.go_home_normal?.likely?.[1] ?? null,
      ...timeline.windows,
      ...timeline.milestones,
    };
  } catch (e) {
    console.error("[Breeding] computeExpectedForPlan failed", { locked, speciesWire, e });
    return null;
  }
}

function DateField({ label, value, defaultValue, readOnly, onChange }: BHQDateFieldProps) {
  const isReadOnly = !!readOnly;
  // Normalize to ensure only valid yyyy-mm-dd or empty string
  const normalizedValue = normalizeDateISO(value);
  const normalizedDefault = normalizeDateISO(defaultValue);
  const current = normalizedValue || normalizedDefault;

  return (
    <div>
      <div className="text-xs text-secondary mb-1">{label}</div>

      {isReadOnly ? (
        <div className={dateFieldW}>
          {/* read-only display, formatted */}
          <div className="h-8 flex items-center text-sm select-none pointer-events-none">
            {fmt(current) ? <span className="font-medium">{fmt(current)}</span> : <span className="text-secondary">—</span>}
          </div>
        </div>
      ) : (
        <CalendarInput
          value={current}
          readOnly={false}
          onChange={(e) => onChange?.(e.currentTarget.value)}
          className={dateFieldW}
          inputClassName={dateInputCls}
          placeholder="mm/dd/yyyy"
        />
      )}
    </div>
  );
}


const toUiSpecies = (s?: string | null): SpeciesUi | "" =>
  s === "DOG"
    ? "Dog"
    : s === "CAT"
      ? "Cat"
      : s === "HORSE"
        ? "Horse"
        : s === "GOAT"
          ? "Goat"
          : s === "RABBIT"
            ? "Rabbit"
            : "";

const toWireSpecies = (s: SpeciesUi | SpeciesWire | ""): SpeciesWire | undefined => {
  const v = String(s || "").trim().toUpperCase();
  if (!v) return undefined;
  if (v === "DOG" || v === "CAT" || v === "HORSE" || v === "GOAT" || v === "RABBIT") return v as SpeciesWire;
  return undefined;
};

// ---- Unsaved Changes Helpers ----

// All editable fields in a breeding plan
const EDITABLE_PLAN_FIELDS: Array<keyof PlanRow> = [
  "name",
  "nickname",
  "species",
  "breedText",
  "damId",
  "sireId",
  "expectedCycleStart",
  "expectedHormoneTestingStart",
  "expectedBreedDate",
  "expectedBirthDate",
  "expectedWeaned",
  "expectedPlacementStartDate",
  "expectedPlacementCompletedDate",
  "cycleStartDateActual",
  "hormoneTestingStartDateActual",
  "breedDateActual",
  "birthDateActual",
  "weanedDateActual",
  "placementStartDateActual",
  "placementCompletedDateActual",
  "completedDateActual",
  "lockedCycleStart",
  "lockedOvulationDate",
  "lockedDueDate",
  "lockedPlacementStartDate",
  "notes",
  "depositsCommitted",
  "depositsPaid",
  "depositRisk",
  "femaleCycleLenOverrideDays",
  "homingStartWeeksOverride",
];

// Date fields that need normalization
const PLAN_DATE_FIELDS = new Set<keyof PlanRow>([
  "expectedCycleStart",
  "expectedHormoneTestingStart",
  "expectedBreedDate",
  "expectedBirthDate",
  "expectedWeaned",
  "expectedPlacementStartDate",
  "expectedPlacementCompletedDate",
  "cycleStartDateActual",
  "hormoneTestingStartDateActual",
  "breedDateActual",
  "birthDateActual",
  "weanedDateActual",
  "placementStartDateActual",
  "placementCompletedDateActual",
  "completedDateActual",
  "lockedCycleStart",
  "lockedOvulationDate",
  "lockedDueDate",
  "lockedPlacementStartDate",
]);

// Normalize a value for comparison (handles dates, strings, nulls)
function normalizeDraftValue(key: keyof PlanRow, value: any): any {
  if (value === undefined) return null;
  if (value === null) return null;

  // Normalize dates to ISO format
  if (PLAN_DATE_FIELDS.has(key)) {
    return asISODateOnly(value);
  }

  // Trim strings
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}

// Build a normalized snapshot from a PlanRow for comparison
function buildPlanSnapshot(source: PlanRow): Partial<PlanRow> {
  const snapshot: Partial<PlanRow> = {};
  for (const key of EDITABLE_PLAN_FIELDS) {
    const value = (source as any)[key];
    (snapshot as any)[key] = normalizeDraftValue(key, value);
  }
  return snapshot;
}

// Returns only the fields that differ from the snapshot
function prunePlanDraft(draft: Partial<PlanRow>, snapshot: Partial<PlanRow>): Partial<PlanRow> {
  const changed: Partial<PlanRow> = {};
  for (const key of Object.keys(draft) as Array<keyof PlanRow>) {
    const draftVal = normalizeDraftValue(key, (draft as any)[key]);
    const snapshotVal = (snapshot as any)[key];
    if (draftVal !== snapshotVal) {
      (changed as any)[key] = (draft as any)[key];
    }
  }
  return changed;
}

type PlanRow = {
  id: ID;
  name: string;
  status: string;
  species: SpeciesUi | "";

  damId?: number | null;
  sireId?: number | null;

  damName: string;
  sireName?: string | null;
  orgName?: string | null;
  code?: string | null;

  /* Canonical expected timeline (added, non-breaking) */
  expectedCycleStart?: string | null;
  expectedHormoneTestingStart?: string | null;
  expectedBreedDate?: string | null;
  expectedBirthDate?: string | null;
  expectedWeaned?: string | null;
  expectedPlacementStartDate?: string | null;
  expectedPlacementCompletedDate?: string | null;

  /* Actuals (keep existing, add missing two) */
  cycleStartDateActual?: string | null;
  hormoneTestingStartDateActual?: string | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;

  /* Locks */
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  lockedDueDate?: string | null;
  lockedPlacementStartDate?: string | null;

  nickname?: string | null;
  breedText?: string | null;
  depositsCommitted?: number | null;
  depositsPaid?: number | null;
  depositRisk?: number | null;

  archived?: boolean;
  archivedAt?: string | null;
  deletedAt?: string | null;

  notes?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  // optional overrides used by planner master view
  femaleCycleLenOverrideDays?: number | null;
  homingStartWeeksOverride?: number | null;
};

const COLUMNS: Array<{ key: keyof PlanRow & string; label: string; default?: boolean }> = [
  // Identity
  { key: "name", label: "Plan Name", default: true },
  { key: "nickname", label: "Nickname", default: false },
  { key: "species", label: "Species", default: true },
  { key: "breedText", label: "Breed", default: true },
  { key: "status", label: "Status", default: true },
  { key: "damName", label: "Dam", default: true },
  { key: "sireName", label: "Sire", default: true },
  { key: "code", label: "Code", default: false },

  // Expected timeline (new canonical keys)
  { key: "expectedCycleStart", label: "Cycle Start (Exp)", default: false },
  { key: "expectedHormoneTestingStart", label: "Hormone Testing Start (Exp)", default: false },
  { key: "expectedBreedDate", label: "Breeding (Exp)", default: false },
  { key: "expectedBirthDate", label: "Birth (Exp)", default: false },
  { key: "expectedWeaned", label: "Weaning Completed (Exp)", default: false },
  { key: "expectedPlacementStartDate", label: "Placement Start (Exp)", default: false },
  { key: "expectedPlacementCompletedDate", label: "Placement Completed (Exp)", default: false },


  // Actuals
  { key: "cycleStartDateActual", label: "Cycle Start (Actual)", default: false },
  { key: "hormoneTestingStartDateActual", label: "Hormone Testing Start (Actual)", default: false },
  { key: "breedDateActual", label: "Breeding (Actual)", default: false },
  { key: "birthDateActual", label: "Birth (Actual)", default: false },
  { key: "weanedDateActual", label: "Weaning Completed", default: false },
  { key: "placementStartDateActual", label: "Placement Start (Actual)", default: false },
  { key: "placementCompletedDateActual", label: "Placement Completed (Actual)", default: false },
  { key: "completedDateActual", label: "Plan Completed (Actual)", default: false },

  // Locked snapshot (optional but useful in tables)
  { key: "lockedCycleStart", label: "Cycle Start (Locked)", default: false },
  { key: "lockedOvulationDate", label: "Ovulation (Locked)", default: false },
  { key: "lockedDueDate", label: "Due (Locked)", default: false },
  { key: "lockedPlacementStartDate", label: "Placement Start (Locked)", default: false },

];

const STORAGE_KEY = "bhq_breeding_cols_v2";

/* ─────────────────────── Helpers ─────────────────────── */

// ----- Date-picker hoist helpers -----
const OVERLAY_ROOT_SELECTOR = "#bhq-overlay-root";

function ensureOverlayRoot(): HTMLElement {
  return (document.querySelector(OVERLAY_ROOT_SELECTOR) as HTMLElement) || document.body;
}

/** Find the *outermost* popup element we actually want to move. */
function findDatePopup(): HTMLElement | null {
  // most libs
  const candidates = [
    // Radix Popper wrapper
    ...Array.from(document.querySelectorAll<HTMLElement>('[data-radix-popper-content-wrapper]')),
    // react-datepicker
    ...Array.from(document.querySelectorAll<HTMLElement>('.react-datepicker')),
    // react-day-picker
    ...Array.from(document.querySelectorAll<HTMLElement>('.rdp,.rdp-root')),
    // generic open dialogs/menus (fallback)
    ...Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"],[role="menu"][data-state="open"]')),
  ];

  // ignore things inside our details drawer/panels
  const filtered = candidates.filter((el) => !el.closest('[data-bhq-details]'));

  const list = filtered.length ? filtered : candidates;
  if (!list.length) return null;

  const isVisible = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 8 && r.height > 8;
  };

  // prefer visible + largest area
  list.sort((a, b) => {
    const va = isVisible(a) ? 1 : 0;
    const vb = isVisible(b) ? 1 : 0;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return vb - va || rb.width * rb.height - ra.width * ra.height;
  });

  // for Radix, we want the wrapper itself (already selected); for others, this is fine
  return list[0] || null;
}

/** Wait up to ~300ms for a date popup to mount, then hoist + place it near trigger. */
function hoistAndPlaceDatePopup(triggerEl: HTMLElement) {
  const root = ensureOverlayRoot();

  let raf = 0;
  let tries = 0;
  const MAX_TRIES = 12; // ~200–300ms

  const place = (pop: HTMLElement) => {
    if (pop.parentNode !== root) root.appendChild(pop);

    // style the *moved wrapper* not inner content
    Object.assign(pop.style, {
      position: "fixed",
      transform: "none",
      inset: "auto",
      zIndex: "2147483647",
      maxWidth: "none",
      maxHeight: "none",
      overflow: "visible",
      contain: "paint", // keep it isolated
      isolation: "auto",
      filter: "none",
      perspective: "none",
      willChange: "top,left",
    } as CSSStyleDeclaration);

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const GAP = 8;

    const doPosition = () => {
      const r = triggerEl.getBoundingClientRect();
      const pr = pop.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = r.bottom + GAP;       // try below
      let left = r.left;              // left-align

      // clamp horizontally
      left = clamp(left, GAP, vw - pr.width - GAP);

      // if off-screen bottom, place above
      if (top + pr.height > vh - GAP) {
        top = clamp(r.top - pr.height - GAP, GAP, vh - pr.height - GAP);
      } else {
        top = clamp(top, GAP, vh - pr.height - GAP);
      }

      pop.style.top = `${Math.round(top)}px`;
      pop.style.left = `${Math.round(left)}px`;
    };

    // Position now, then again next frame after content finishes sizing.
    doPosition();
    setTimeout(doPosition, 30);

    // keep it in the right spot on resize/scroll; clean up when it disappears
    const onRelayout = () => {
      if (!pop.isConnected) {
        window.removeEventListener("resize", onRelayout);
        window.removeEventListener("scroll", onRelayout, true);
        return;
      }
      doPosition();
    };
    window.addEventListener("resize", onRelayout);
    window.addEventListener("scroll", onRelayout, true);

    // small observer to auto-clean when popup is removed
    const mo = new MutationObserver(() => {
      if (!pop.isConnected) {
        window.removeEventListener("resize", onRelayout);
        window.removeEventListener("scroll", onRelayout, true);
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  };

  const tick = () => {
    const pop = findDatePopup();
    if (pop) {
      place(pop);
      return;
    }
    if (tries++ < MAX_TRIES) {
      raf = requestAnimationFrame(tick);
    }
  };

  // kick off after we click the icon
  raf = requestAnimationFrame(tick);
}

/** Wire up native date picker to our overlay hoist helper. */
type AttachDatePopupOpts = {
  shell: HTMLElement;
  button: HTMLButtonElement;
  hiddenInput: HTMLInputElement;
  onPopupOpen?: () => void;
  onPopupClose?: () => void;
};

function attachDatePopupPositioning(opts: AttachDatePopupOpts) {
  const { shell, button, hiddenInput, onPopupOpen, onPopupClose } = opts;

  if (!shell || !button || !hiddenInput) {
    return () => { };
  }

  let isOpen = false;

  const openPicker = () => {
    if (hiddenInput.disabled || hiddenInput.readOnly) return;

    if (!isOpen) {
      isOpen = true;
      onPopupOpen?.();
    }

    try {
      // Focus the hidden native input and try to open the picker
      hiddenInput.focus();
      const anyInput = hiddenInput as any;
      if (typeof anyInput.showPicker === "function") {
        anyInput.showPicker();
      } else {
        hiddenInput.click();
      }
    } catch {
      // Ignore browser quirks
    }

    // Hoist and position the popup near the trigger
    hoistAndPlaceDatePopup(button);
  };

  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    openPicker();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Support keyboard open from the visible text input
    if (e.key === "ArrowDown" && (e.altKey || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openPicker();
    }
  };

  const handleHiddenBlur = () => {
    if (!isOpen) return;
    isOpen = false;
    onPopupClose?.();
  };

  button.addEventListener("click", handleButtonClick);
  shell.addEventListener("keydown", handleKeyDown);
  hiddenInput.addEventListener("blur", handleHiddenBlur);

  return () => {
    button.removeEventListener("click", handleButtonClick);
    shell.removeEventListener("keydown", handleKeyDown);
    hiddenInput.removeEventListener("blur", handleHiddenBlur);
  };
}

const toKey = (id: ID) => String(id);

function __bhq_findDetailsDrawerOnClose(): (() => void) | null {
  try {
    const root = document.querySelector("[data-bhq-details]") || document.body;
    const key = Object.keys(root as any).find((k) => k.startsWith("__reactFiber$"));
    let f: any = key ? (root as any)[key] : null;
    while (f) {
      const t = f.type || f.elementType || {};
      const name = t.displayName || t.name || "";
      if (name === "DetailsDrawer") {
        const fn = f.memoizedProps?.onClose;
        return typeof fn === "function" ? fn : null;
      }
      f = f.return;
    }
  } catch { }
  return null;
}

async function safeGetCreatingOrg(api: any) {
  try {
    const org = await api?.lookups?.getCreatingOrganization?.();
    if (org && org.id != null) return org;
  } catch { }
  try {
    const id = localStorage.getItem("BHQ_ORG_ID");
    if (id) return { id, display_name: localStorage.getItem("BHQ_ORG_NAME") || "My Organization" };
  } catch { }
  return null;
}

function DisplayValue({ value, required }: { value?: string | null; required?: boolean }) {
  const isEmpty = !value || !value.trim();
  const showRedBorder = required && isEmpty;
  return (
    <div className={`h-[42px] rounded-md border bg-card px-3 flex items-center text-sm select-none pointer-events-none ${
      showRedBorder ? "border-red-500/60 ring-1 ring-red-500/20" : "border-[#4b5563]"
    }`}>
      {value ? <span className="font-medium">{value}</span> : <span className={showRedBorder ? "text-red-400" : "text-secondary"}>—</span>}
    </div>
  );
}

function fmt(d?: string | null) {
  if (!d) return "";
  const s = String(d);
  // If it's date-only (YYYY-MM-DD), parse as local midnight to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, day); // Local timezone, months are 0-indexed
    return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
  }
  // For other formats, parse normally
  const dt = new Date(s);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}

function planToRow(p: any): PlanRow {
  return {
    id: p.id,
    name: p.name,
    status: fromBackendStatus(p.status, {
      placementStartDateActual: p.placementStartDateActual,
      placementCompletedDateActual: p.placementCompletedDateActual,
    }),
    species: toUiSpecies(p.species),

    damId: p.dam?.id ?? null,
    sireId: p.sire?.id ?? null,

    damName: p.dam?.name ?? "",
    sireName: p.sire?.name ?? null,
    orgName: p.organization?.name ?? null,
    code: p.code ?? null,

    /* Canonical expected timeline (strict, breedingMath-driven) */
    expectedCycleStart: (p.expectedCycleStart ?? p.lockedCycleStart) ?? null,
    expectedHormoneTestingStart: p.expectedHormoneTestingStart ?? null,
    expectedBreedDate: (p.expectedBreedDate ?? p.lockedOvulationDate) ?? null,
    expectedBirthDate: (p.expectedBirthDate ?? p.lockedDueDate) ?? null,
    expectedWeaned: p.expectedWeaned ?? null,
    expectedPlacementStartDate: p.expectedPlacementStartDate ?? null,
    expectedPlacementCompletedDate: (pickPlacementCompletedAny(p) as any) ?? null,

    /* Actuals (include missing two) */
    cycleStartDateActual: p.cycleStartDateActual ?? null,
    hormoneTestingStartDateActual: p.hormoneTestingStartDateActual ?? null,
    breedDateActual: p.breedDateActual ?? null,
    birthDateActual: p.birthDateActual ?? null,
    weanedDateActual: p.weanedDateActual ?? null,
    placementStartDateActual: p.placementStartDateActual ?? null,
    placementCompletedDateActual: p.placementCompletedDateActual ?? null,
    completedDateActual: p.completedDateActual ?? null,

    /* Locks */
    lockedCycleStart: p.lockedCycleStart ?? null,
    lockedOvulationDate: p.lockedOvulationDate ?? null,
    lockedDueDate: p.lockedDueDate ?? null,
    lockedPlacementStartDate: p.lockedPlacementStartDate ?? null,

    /* Misc */
    nickname: p.nickname ?? null,
    breedText: p.breedText ?? null,
    depositsCommitted: p.depositsCommittedCents ?? null,
    depositsPaid: p.depositsPaidCents ?? null,
    depositRisk: p.depositRiskScore ?? null,

    archived: p.archived ?? false,
    archivedAt: p.archivedAt ?? p.archived_at ?? null,
    deletedAt: p.deletedAt ?? p.deleted_at ?? null,

    notes: p.notes ?? null,

    createdAt: p.createdAt ?? p.created_at ?? null,
    updatedAt: p.updatedAt ?? p.updated_at ?? null,

    /* Planner overrides */
    femaleCycleLenOverrideDays: p.femaleCycleLenOverrideDays ?? null,
    homingStartWeeksOverride: p.homingStartWeeksOverride ?? null,
  } as any;
}

// Use the imported Status type and deriveBreedingStatus from planner module for consistency
type Status = PlannerStatus;
const deriveBreedingStatus = deriveBreedingStatusImported;

/** Minimal animal for Dam/Sire search */
type AnimalLite = {
  id: number;
  name: string;
  species: SpeciesWire;
  sex: "FEMALE" | "MALE";
  organization?: { name: string } | null;
  femaleCycleLenOverrideDays?: number | null;
};

function normalizeSex(x: any): "FEMALE" | "MALE" | undefined {
  if (x == null) return undefined;
  if (typeof x === "number") return x === 0 ? "FEMALE" : x === 1 ? "MALE" : undefined;
  const s = String(x).trim().toUpperCase();
  if (s === "F" || s === "FEMALE" || s === "W" || s === "GIRL") return "FEMALE";
  if (s === "M" || s === "MALE" || s === "B" || s === "BOY") return "MALE";
  return undefined;
}

function normalizeSpecies(x: any): SpeciesWire | undefined {
  if (x == null) return undefined;
  const s = String(x).trim().toUpperCase();
  if (s === "DOG" || s === "CANINE") return "DOG";
  if (s === "CAT" || s === "FELINE") return "CAT";
  if (s === "HORSE" || s === "EQUINE") return "HORSE";
  if (s === "GOAT" || s === "CAPRINE") return "GOAT";
  if (s === "RABBIT" || s === "LAPINE") return "RABBIT";
  return undefined;
}


function toPlannerSpecies(x: any): PlannerSpecies | null {
  const w = normalizeSpecies(x);
  if (!w) return null;
  if (w === "DOG") return "Dog";
  if (w === "CAT") return "Cat";
  if (w === "HORSE") return "Horse";
  if (w === "GOAT") return "Goat";
  if (w === "RABBIT") return "Rabbit";
  return null;
}

async function fetchAnimals(opts: {
  baseUrl: string;
  tenantId: number;
  q?: string;
  species?: SpeciesWire;
  sexHint?: "FEMALE" | "MALE";
  limit?: number;
}): Promise<AnimalLite[]> {
  const qs = new URLSearchParams();
  if (opts.q) qs.set("q", opts.q);
  if (opts.species) qs.set("species", opts.species);
  if (opts.sexHint) qs.set("sexHint", opts.sexHint);
  qs.set("limit", String(opts.limit ?? 300));

  const res = await fetch(`${opts.baseUrl.replace(/\/+$/, "")}/animals?${qs}`, {
    method: "GET",
    credentials: "include",
    headers: { "content-type": "application/json", "x-tenant-id": String(opts.tenantId) },
  });
  if (!res.ok) return [];

  const body = await res.json();
  const raw: any[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];

  const normalized: AnimalLite[] = raw.map((a) => ({
    id: Number(a.id),
    name: String(a.name ?? "").trim(),
    species: normalizeSpecies(a.species) ?? (opts.species ?? "DOG"),
    sex: normalizeSex(a.sex) ?? (opts.sexHint ?? "FEMALE"),
    organization: a.organization?.name ? { name: String(a.organization.name) } : null,
    femaleCycleLenOverrideDays: a.femaleCycleLenOverrideDays ?? null,
  }));

  return normalized;
}

/* ───────────────────────── Confirm Modal ───────────────────────── */

function confirmModal(
  opts:
    | string
    | {
      title?: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      tone?: "default" | "danger";
    }
): Promise<boolean> {
  const { title, message, confirmText, cancelText, tone } =
    typeof opts === "string"
      ? { title: "Confirm", message: opts, confirmText: "Confirm", cancelText: "Cancel", tone: "default" as const }
      : {
        title: opts.title ?? "Confirm",
        message: opts.message,
        confirmText: opts.confirmText ?? "Confirm",
        cancelText: opts.cancelText ?? "Cancel",
        tone: opts.tone ?? "default",
      };

  const rootEl = getOverlayRoot();
  const host = document.createElement("div");
  host.style.pointerEvents = "auto";
  rootEl.appendChild(host);

  return new Promise((resolve) => {
    const close = (ok: boolean) => {
      resolve(ok);
      try {
        r.unmount();
      } catch { }
      host.remove();
    };

    const r = createRoot(host);
    r.render(
      <div className="fixed inset-0 z-[2147483647]">
        <div className="absolute inset-0 bg-black/50" onClick={() => close(false)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[420px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-base font-semibold mb-2">{title}</div>
            <div className="text-sm text-secondary mb-4">{message}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => close(false)}>
                {cancelText}
              </Button>
              <Button
                onClick={() => close(true)}
                className={tone === "danger" ? "bg-red-600 hover:bg-red-500" : undefined}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  });
}

function infoModal(opts: {
  title: string;
  message: string | React.ReactNode;
  closeText?: string;
}): Promise<void> {
  const { title, message, closeText = "Close" } = opts;

  const rootEl = getOverlayRoot();
  const host = document.createElement("div");
  host.style.pointerEvents = "auto";
  rootEl.appendChild(host);

  return new Promise((resolve) => {
    const close = () => {
      resolve();
      try {
        r.unmount();
      } catch { }
      host.remove();
    };

    const r = createRoot(host);
    r.render(
      <div className="fixed inset-0 z-[2147483647]">
        <div className="absolute inset-0 bg-black/50" onClick={close} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[420px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-base font-semibold mb-2">{title}</div>
            <div className="text-sm text-secondary mb-4">{message}</div>
            <div className="flex justify-end gap-2">
              <Button onClick={close}>
                {closeText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  });
}

/* ───────────────────────── Component ───────────────────────── */

function SafeNavLink({
  to,
  children,
  className,
  style,
  end,
}: {
  to: string;
  children: React.ReactNode;
  className: ((arg: { isActive: boolean }) => string) | string;
  style?: ((arg: { isActive: boolean }) => React.CSSProperties) | React.CSSProperties;
  end?: boolean;
}) {
  const inRouter = useInRouterContext();

  // helper to compute active when not in a Router
  const computeActive = React.useCallback(() => {
    try {
      const here = (typeof window !== "undefined" ? window.location.pathname : "/").replace(/\/+$/, "") || "/";
      const target = new URL(to, typeof window !== "undefined" ? window.location.href : "http://x").pathname
        .replace(/\/+$/, "") || "/";
      if (end) {
        return here === target;
      }
      // treat '/planner' as active for '/planner' and '/planner/...'
      return here === target || here.startsWith(target + "/");
    } catch {
      return false;
    }
  }, [to, end]);

  if (!inRouter) {
    const isActive = computeActive();
    const cls = typeof className === "function" ? className({ isActive }) : className;
    const sty = typeof style === "function" ? style({ isActive }) : style;
    return (
      <a href={to} className={cls} style={sty}>
        {children}
      </a>
    );
  }

  return (
    <NavLink to={to} end={end} className={className as any} style={style as any}>
      {children}
    </NavLink>
  );
}

type WhatIfDamReproEvent = {
  kind: "heat_start" | "ovulation" | "insemination" | "whelp";
  date: string;
};

type WhatIfDamReproData = {
  last_heat: string | null;
  lastCycle: string | null;
  cycleStartDates: string[];
  repro: WhatIfDamReproEvent[];
};

type WhatIfRowEditorProps = {
  row: WhatIfRow;
  females: { id: ID; name: string; species: SpeciesWire | null }[];
  api: any;
  tenantId: number | null;
  onChange: (next: WhatIfRow) => void;
  onConvertToPlan: () => void;
  onRemove: () => void;
};

function WhatIfRowEditor(props: WhatIfRowEditorProps) {
  const { row, females, api, tenantId, onChange, onConvertToPlan, onRemove } = props;

  const [damRepro, setDamRepro] = React.useState<WhatIfDamReproData | null>(null);
  const [damLoadError, setDamLoadError] = React.useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  React.useEffect(() => {

    let cancelled = false;

    // clear stale data on every dam change
    setDamRepro(null);
    setDamLoadError(null);

    if (!row.damId) return;

    const include = "repro,last_heat,lastCycle,cycleStartDates";
    const url = `/api/v1/animals/${row.damId}?include=${encodeURIComponent(include)}`;

    (async () => {
      try {

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            "x-tenant-id": String(tenantId),
          },
        });
        const bodyText = await res.text();


        if (!res.ok) {
          throw new Error(`Dam repro fetch failed: ${res.status} ${bodyText.slice(0, 200)}`);
        }

        const data: any = bodyText ? JSON.parse(bodyText) : null;
        if (cancelled) return;

        console.warn("[BHQ reproEngine][whatif raw animal payload]", {
          damId: row.damId,
          topLevelKeys: data ? Object.keys(data) : null,
          dataKeys: data?.data ? Object.keys(data.data) : null,
          animalKeys: data?.animal ? Object.keys(data.animal) : null,
          reproType: typeof data?.repro,
          reproLen: Array.isArray(data?.repro) ? data.repro.length : null,
          cycleStartDatesLen: Array.isArray(data?.cycleStartDates) ? data.cycleStartDates.length : null,
          lastCycle: data?.lastCycle ?? data?.last_cycle ?? null,
          lastHeat: data?.last_heat ?? data?.lastHeat ?? null,
        });

        const reproRaw: WhatIfDamReproEvent[] = Array.isArray(data?.repro)
          ? (data.repro as WhatIfDamReproEvent[])
          : [];

        const repro: WhatIfDamReproEvent[] = reproRaw
          .filter((e: any) => e && e.date)
          .map((e: any) => {
            const kind =
              e.kind === "cycle_start"
                ? ("heat_start" as WhatIfDamReproEvent["kind"])
                : (e.kind as WhatIfDamReproEvent["kind"]);

            const d = asISODateOnly(e.date);
            return d ? ({ ...e, kind, date: d } as WhatIfDamReproEvent) : null;
          })
          .filter(Boolean) as WhatIfDamReproEvent[];

        const cycleStartDates: string[] = Array.isArray(data?.cycleStartDates)
          ? (data.cycleStartDates as any[]).map((d) => asISODateOnly(d)).filter(Boolean).sort()
          : [];

        const lastCycle: string | null = asISODateOnly(data?.lastCycle ?? data?.last_cycle ?? null);

        let last_heat: string | null = asISODateOnly(data?.last_heat ?? data?.lastHeat ?? null);

        if (!last_heat && repro.length) {
          const heats = repro
            .filter((e) => e.kind === "heat_start" && e.date)
            .map((e) => asISODateOnly(e.date))
            .filter(Boolean)
            .sort();
          last_heat = heats.length ? heats[heats.length - 1] : null;
        }

        if (!last_heat && lastCycle) last_heat = lastCycle;

        const parsed: WhatIfDamReproData = {
          repro,
          cycleStartDates,
          lastCycle,
          last_heat,
        };

        setDamRepro(parsed);

        // Update the row's femaleCycleLenOverrideDays with fresh data from server
        // This ensures we always use the latest override value when recalculating projected cycles
        const freshOverride = data?.femaleCycleLenOverrideDays ?? null;
        if (freshOverride !== row.femaleCycleLenOverrideDays) {
          onChange({ ...row, femaleCycleLenOverrideDays: freshOverride });
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error("[whatif] dam repro load failed", e);
        setDamLoadError(e?.message || "Unable to load cycle history for this female.");
        setDamRepro(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [row.damId, refreshTrigger]);

  const handleDamChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const val = e.currentTarget.value;
    const id = val ? (val as unknown as ID) : null;
    const female = females.find((f) => String(f.id) === String(id)) || null;

    const next = {
      ...row,
      damId: id,
      damName: female?.name ?? null,
      species: female?.species ?? null,
      cycleStartIso: null,
      femaleCycleLenOverrideDays: female?.femaleCycleLenOverrideDays ?? null,
    };

    onChange(next);
  };

  const handleCycleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const v = e.currentTarget.value || "";
    onChange({ ...row, cycleStartIso: v ? v : null });
  };



  const speciesWire = typeof row.species === "string" ? row.species : "";

  const cycleStartsAsc = React.useMemo(() => {
    const raw = (damRepro?.cycleStartDates ?? []) as any[];
    const normalized = (reproEngine as any).normalizeCycleStartsAsc
      ? (reproEngine as any).normalizeCycleStartsAsc(raw)
      : raw.filter(Boolean).map(String).sort();
    return normalized as string[];
  }, [damRepro?.cycleStartDates]);

  const projectedCycles = React.useMemo(() => {
    if (!speciesWire) return [] as string[];
    const today = new Date().toISOString().slice(0, 10);
    const summary: any = {
      species: speciesWire,
      cycleStartsAsc,
      dob: null,
      today,
      femaleCycleLenOverrideDays: row.femaleCycleLenOverrideDays,
    };
    const { projected } = reproEngine.projectUpcomingCycleStarts(summary, { horizonMonths: 36, maxCount: 36 } as any) as any;
    return Array.isArray(projected) ? projected.map((p: any) => p.date).filter(Boolean) : [];
  }, [speciesWire, cycleStartsAsc, row.femaleCycleLenOverrideDays]);

  return (
    <div className="rounded-lg border border-hairline bg-surface p-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="mb-1 text-xs text-secondary">Female</div>
          <select
            className="h-8 w-full rounded-md border border-hairline bg-surface-subtle px-2 text-sm text-primary"
            value={row.damId != null ? String(row.damId) : ""}
            onChange={handleDamChange}
          >
            <option value="">Select female</option>
            {females.map((f) => (
              <option key={String(f.id)} value={String(f.id)}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[220px]">
          <div className="mb-1 text-xs text-secondary">Projected Cycle Start Dates (Next 36 Months)</div>
          <select
            className="h-8 w-full rounded-md border border-hairline bg-surface-subtle px-2 text-sm text-primary"
            value={row.cycleStartIso ?? ""}
            onChange={handleCycleChange}
            onFocus={() => {
              if (row.damId) {
                setRefreshTrigger((prev) => prev + 1);
              }
            }}
            disabled={!row.damId || projectedCycles.length === 0}
          >
            <option value="">
              {row.damId
                ? projectedCycles.length === 0
                  ? "No projected cycles found"
                  : "Select cycle"
                : "Select a female first"}
            </option>
            {projectedCycles.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={row.showOnChart}
            onChange={(e) => onChange({ ...row, showOnChart: e.currentTarget.checked })}
          />
          Show on chart
        </label>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
          onClick={onConvertToPlan}
          disabled={!row.damId || !row.cycleStartIso || !row.species}
        >
          Convert to plan
        </Button>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface-subtle text-secondary hover:bg-white/5"
          title="Remove row"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {damLoadError && <div className="mt-1 text-xs text-red-500">{damLoadError}</div>}
    </div>
  );
}

export default function AppBreeding() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "breeding", label: "Breeding" } }));
  }, []);

  const { readTenantIdFast, resolveTenantId } = utils;
  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  React.useEffect(() => {
    if (tenantId != null) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await resolveTenantId();
        if (!cancelled) setTenantId(t);
      } catch { }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, resolveTenantId]);

  const api = React.useMemo(() => {
    if (tenantId == null) return null;
    return makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });
  }, [tenantId]);

  // Canonical breed list API
  const breedBrowseApi = React.useMemo(
    () => ({
      breeds: {
        listCanonical: (opts: { species: string; orgId?: number; limit?: number }) =>
          (api as any)?.breeds?.listCanonical?.(opts) ?? Promise.resolve([]),
      },
    }),
    [api]
  );

  // Resolve orgId once for custom breeds
  const [orgIdForBreeds, setOrgIdForBreeds] = React.useState<number | null>(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const org = await safeGetCreatingOrg(api);
      if (!alive) return;
      if (org?.id != null) setOrgIdForBreeds(Number(org.id));
    })();
    return () => {
      alive = false;
    };
  }, [api]);

  /* Data: declare early so later hooks can safely reference allPlans */
  const [rows, setRows] = React.useState<PlanRow[]>([]);
  /** Alias so downstream code can keep using allPlans */
  const allPlans = rows;
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);


  /* Search and filters */
  const Q_KEY = "bhq_breeding_q_v2";
  const FILTERS_KEY = "bhq_breeding_filters_v2";

  const SHOW_ARCH_KEY = "bhq_breeding_show_archived";
  const [showArchived, setShowArchived] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(SHOW_ARCH_KEY) === "1";
    } catch {
      return false;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(SHOW_ARCH_KEY, showArchived ? "1" : "0");
    } catch { }
  }, [showArchived]);

  // Selection (keep raw ID types; do NOT stringify)
  const [selectedKeys, setSelectedKeys] = React.useState<Set<ID>>(() => new Set<ID>());
  // Remember if the user has changed selection at least once
  const [selectionTouched, setSelectionTouched] = React.useState(false);

  // Keep selection stable across data refreshes.
  // Auto-select-all only once (first load) and never after user interaction.
  React.useEffect(() => {
    if (allPlans.length === 0) return;

    setSelectedKeys((prev) => {
      const valid = new Set<ID>(allPlans.map((p) => p.id));

      // First load only: select all
      const base = !selectionTouched && prev.size === 0 ? valid : prev;

      // Always prune removed plans, never add new ones once touched
      const next = new Set<ID>();
      base.forEach((k) => {
        if (valid.has(k)) next.add(k);
      });

      return next;
    });
  }, [allPlans, selectionTouched]);

  const [availabilityOn, setAvailabilityOn] = React.useState<boolean>(false);

  const now = new Date();
  const plannerHorizon = React.useMemo(
    () => ({
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 13, 0),
    }),
    []
  );

  // Cast to NormalizedPlan[] so Calendar and Planner share the same data
  const normalized = React.useMemo<NormalizedPlan[]>(
    () => (allPlans as unknown as NormalizedPlan[]),
    [allPlans]
  );

  // What If planner rows
  const [whatIfRows, setWhatIfRows] = React.useState<WhatIfRow[]>(() => [
    {
      id: "whatif-1",
      damId: null,
      damName: null,
      species: null,
      cycleStartIso: null,
      showOnChart: true,
    },
  ]);

  // All active females for current planner species filter
  const [whatIfFemales, setWhatIfFemales] = React.useState<
    { id: ID; name: string; species: SpeciesWire | null; femaleCycleLenOverrideDays?: number | null }[]
  >([]);

  // Species filter used for Rollup and What If planner
  const [speciesFilterRollup, setSpeciesFilterRollup] =
    React.useState<SpeciesWire | "ALL">("ALL");

  // Keep a lightweight list of females for What If, scoped to the Rollup species filter
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (tenantId == null) {
        setWhatIfFemales([]);
        return;
      }

      // If Rollup is on "ALL" we pull all species, otherwise just that one
      const speciesWire =
        speciesFilterRollup === "ALL"
          ? undefined
          : (speciesFilterRollup as SpeciesWire);

      try {
        const animals = await fetchAnimals({
          baseUrl: "/api/v1",
          tenantId,
          species: speciesWire,
          sexHint: "FEMALE",
          limit: 500,
        });

        if (cancelled) return;

        // Defensive filter in case the backend ignores sexHint
        const mapped = animals
          .filter((a) => {
            const s = String((a as any).sex ?? "").toLowerCase();
            // backend is ignoring sexHint, so enforce female on the client
            return s.startsWith("f"); // "female", "f"
          })
          .map((a) => ({
            id: a.id,
            name: a.name,
            species: (a.species as SpeciesWire) ?? null,
            femaleCycleLenOverrideDays: (a as any).femaleCycleLenOverrideDays ?? null,
          }));

        setWhatIfFemales(mapped);
      } catch {
        if (!cancelled) setWhatIfFemales([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId, speciesFilterRollup]);

  const [q, setQ] = React.useState(() => {
    try {
      return localStorage.getItem(Q_KEY) || "";
    } catch {
      return "";
    }
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}");
    } catch {
      return {};
    }
  });

  // Inject What If rows into Rollup items
  const rollupItemsWithWhatIf = React.useMemo<NormalizedPlan[]>(() => {
    const base = normalized ?? [];

    const extras: NormalizedPlan[] = whatIfRows
      .filter(
        (r) =>
          r.showOnChart &&
          r.damId != null &&
          r.cycleStartIso
      )
      .map((r): NormalizedPlan => {
        const id = `whatif-${r.id}`;
        const speciesUi: SpeciesUi = toUiSpecies(r.species);

        // Compute expected dates from the locked cycle start using reproEngine
        const expectedDates = computeExpectedForPlan({
          species: speciesUi,
          lockedCycleStart: r.cycleStartIso,
          femaleCycleLenOverrideDays: r.femaleCycleLenOverrideDays,
        });

        // Normalize the expected dates for RollupGantt
        const normalized = normalizeExpectedMilestones(expectedDates, r.cycleStartIso);

        return {
          id,
          name: r.damName
            ? `${r.damName} - What If`
            : `What If - ${String(r.damId)}`,
          species: speciesUi,
          lockedCycleStart: r.cycleStartIso,
          // Include all expected dates so RollupGantt can plot them
          expectedCycleStart: normalized.cycleStart,
          expectedHormoneTestingStart: normalized.hormoneTestingStart,
          expectedBreedDate: normalized.breedDate,
          expectedBirthDate: normalized.birthDate,
          expectedWeaned: normalized.weanedDate,
          expectedPlacementStartDate: normalized.placementStart,
          expectedPlacementCompleted: normalized.placementCompleted,
          placementCompletedDateExpected: normalized.placementCompleted,
          isSynthetic: true,
        } as any as NormalizedPlan;
      });

    return [...base, ...extras];
  }, [normalized, whatIfRows]);

  // RollupGantt only renders items included in selectedKeys.
  // What If rows should plot immediately when showOnChart is enabled,
  // without requiring a separate selection in the rollup list.
  const selectedKeysWithWhatIf = React.useMemo(() => {
    const s = new Set<string>(Array.from(selectedKeys ?? []).map(String));
    for (const r of whatIfRows ?? []) {
      if (r?.showOnChart && r?.damId != null && r?.cycleStartIso) {
        s.add(`whatif-${r.id}`);
      }
    }
    return s;
  }, [selectedKeys, whatIfRows]);


  React.useEffect(() => {
    try {
      localStorage.setItem(Q_KEY, q);
    } catch { }
  }, [q]);
  React.useEffect(() => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(filters || {}));
    } catch { }
  }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!api) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resp = await api.listPlans({
          q: qDebounced || undefined,
          include: "parents,org",
          archived: showArchived ? "include" : "exclude",
          page: 1,
          limit: 500,
        });

        const items = Array.isArray((resp as any)?.items)
          ? (resp as any).items
          : Array.isArray(resp)
            ? (resp as any)
            : [];

        if (!cancelled) setRows(items.map(planToRow));
      } catch (e: any) {
        if (!cancelled) setError(e?.payload?.error || e?.message || "Failed to load plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, qDebounced, showArchived]);

  /* Columns */
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  /* Filter schema */
  const FILTER_SCHEMA = React.useMemo(() => {
    const dateKeys = new Set([
      // Canonical expected only
      "expectedCycleStart",
      "expectedHormoneTestingStart",
      "expectedBreedDate",
      "expectedBirthDate",
      "expectedWeaned",
      "expectedPlacementStartDate",
      "expectedPlacementCompletedDate",

      // Actuals
      "cycleStartDateActual",
      "hormoneTestingStartDateActual",
      "breedDateActual",
      "birthDateActual",
      "weanedDateActual",
      "placementStartDateActual",
      "placementCompletedDateActual",
      "completedDateActual",

      // Locks
      "lockedCycleStart",
      "lockedOvulationDate",
      "lockedDueDate",
      "lockedPlacementStartDate",
    ] as const);
    return visibleSafe.map((col) => {
      if (dateKeys.has(col.key as any)) return { key: col.key, label: col.label, editor: "date" as const };
      if (col.key === "status") {
        return {
          key: "status",
          label: "Status",
          editor: "select" as const,
          options: [
            { label: "Planning", value: "PLANNING" },
            { label: "Committed", value: "COMMITTED" },
            { label: "Bred", value: "BRED" },
            { label: "Birthed", value: "BIRTHED" },
            { label: "Weaned", value: "WEANED" },
            { label: "Placement Started", value: "PLACEMENT_STARTED" },
            { label: "Complete", value: "COMPLETE" },
            { label: "Canceled", value: "CANCELED" },
          ],
        };
      }
      if (col.key === "species") {
        return {
          key: "species",
          label: "Species",
          editor: "select" as const,
          options: [
            { label: "Dog", value: "Dog" },
            { label: "Cat", value: "Cat" },
            { label: "Horse", value: "Horse" },
          ],
        };
      }
      return { key: col.key, label: col.label, editor: "text" as const };
    });
  }, [visibleSafe]);

  /* Sorting */
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const found = prev.find((s) => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc") return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };

  /* Client search+filters */
  const DATE_KEYS = new Set([
    /* Canonical expected only */
    "expectedCycleStart",
    "expectedHormoneTestingStart",
    "expectedBreedDate",
    "expectedBirthDate",
    "expectedWeaned",
    "expectedPlacementStartDate",
    "expectedPlacementCompletedDate",

    /* Actuals */
    "cycleStartDateActual",
    "hormoneTestingStartDateActual",
    "breedDateActual",
    "birthDateActual",
    "weanedDateActual",
    "placementStartDateActual",
    "placementCompletedDateActual",
    "completedDateActual",

    /* Locks */
    "lockedCycleStart",
    "lockedOvulationDate",
    "lockedDueDate",
    "lockedPlacementStartDate",
  ] as const);

  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    let data = [...rows];

    const lc = (v: any) => String(v ?? "").toLowerCase();

    if (qDebounced) {
      const ql = qDebounced.toLowerCase();
      data = data.filter((r) => {
        const hay = [
          r.name,
          r.nickname,
          r.breedText,
          r.status,
          r.damName,
          r.sireName,
          r.species,
          r.orgName,
          r.code,

          // canonical expected
          r.expectedCycleStart,
          r.expectedHormoneTestingStart,
          r.expectedBreedDate,
          r.expectedBirthDate,

          // actuals
          r.birthDateActual,
          r.weanedDateActual,
          r.breedDateActual,
          r.placementStartDateActual,
          r.placementCompletedDateActual,

          // locks
          r.lockedCycleStart,
          r.lockedOvulationDate,
          r.lockedDueDate,
          r.lockedPlacementStartDate,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      data = data.filter((r) =>
        active.every(([key, val]) => {
          const raw = (r as any)[key];
          const isDate = DATE_KEYS.has(key as any);
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        })
      );
    }

    if (!showArchived) {
      data = data.filter((r) => !r.archived);
    }

    // Always exclude deleted plans from default view
    data = data.filter((r) => !r.deletedAt);

    if (sorts.length) {
      data.sort((a, b) => {
        for (const s of sorts) {
          const av = (a as any)[s.key];
          const bv = (b as any)[s.key];
          const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
          if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }

    return data;
  }, [rows, filters, qDebounced, sorts, showArchived]);

  /* Paging */
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);
  const pageCount = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = displayRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = displayRows.length === 0 ? 0 : Math.min(displayRows.length, (clampedPage - 1) * pageSize + pageSize);
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return displayRows.slice(from, to);
  }, [displayRows, clampedPage, pageSize]);

  /* ───────── View routing (list | calendar | planner) ───────── */
  type ViewRoute = "list" | "calendar" | "planner";

  // Determine the module base path
  const getBasePath = React.useCallback(() => {
    if (typeof window === "undefined") return "";
    const p = window.location.pathname || "/";
    const clean = p.replace(/\/+$/, "");
    if (clean.endsWith("/calendar")) return clean.slice(0, -"/calendar".length) || "/";
    if (clean.endsWith("/planner")) return clean.slice(0, -"/planner".length) || "/";
    return clean || "/";
  }, []);

  // Determine the module base path 
  const getViewFromLocation = (): ViewRoute => {
    if (typeof window === "undefined") return "list";
    const p = window.location.pathname || "/";
    if (p.includes("/calendar")) return "calendar";
    if (p.includes("/planner")) return "planner";
    return "list";
  };

  // Current view state
  const [currentView, setCurrentView] = React.useState<ViewRoute>(getViewFromLocation());
  React.useEffect(() => {
    const onPop = () => setCurrentView(getViewFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Planner view state ─────────────────────────────────────
  const [plannerMode, setPlannerMode] = React.useState<"per-plan" | "rollup">("per-plan");

  // Planner page tabs: "your-plans" (default) or "what-if"
  type PlannerPage = "your-plans" | "what-if";
  const [plannerPage, setPlannerPage] = React.useState<PlannerPage>("your-plans");

  // Planner inner content sizing (scroll only inside the card body)
  const plannerContentRef = React.useRef<HTMLDivElement | null>(null);
  const [plannerContentMaxHeight, setPlannerContentMaxHeight] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    if (currentView !== "planner") return;

    const measure = () => {
      const el = plannerContentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // leave a small bottom buffer
      const available = window.innerHeight - rect.top - 16;
      setPlannerContentMaxHeight(available > 0 ? available : null);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [currentView]);

  const basePath = React.useMemo(() => getBasePath(), [getBasePath]);


  // Programmatically open a plan in the Details drawer by setting ?planId=
  const openPlanDrawer = React.useCallback((id: ID) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("planId", String(id));
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  // Quick-add launcher helper for Calendar or Planner
  const openQuickAddFor = React.useCallback((planId?: ID) => {
    setQuickAddPlanId(planId ?? null);
    setQuickAddOpen(true);
  }, []);

  /* Create Plan Drawer state */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [customBreedOpen, setCustomBreedOpen] = React.useState(false);
  const [customBreedSpecies, setCustomBreedSpecies] = React.useState<"DOG" | "CAT" | "HORSE">("DOG");

  /* More actions menu state */
  const [menuOpen, setMenuOpen] = React.useState(false);

  /* CSV export function */
  const handleExportCsv = React.useCallback(() => {
    exportToCsv({
      columns: COLUMNS,
      rows: displayRows,
      filename: "breeding",
      formatValue: (value, key) => {
        if (DATE_COLS.has(key as any)) {
          if (!value) return "";
          const dt = new Date(value);
          if (!Number.isFinite(dt.getTime())) return String(value).slice(0, 10) || "";
          return dt.toISOString().slice(0, 10);
        }
        if (Array.isArray(value)) {
          return value.join(" | ");
        }
        return value;
      },
    });
    setMenuOpen(false);
  }, [displayRows]);

  const [onCustomBreedCreated, setOnCustomBreedCreated] =
    React.useState<((c: { id: number; name: string; species: "DOG" | "CAT" | "HORSE" }) => void) | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newSpeciesUi, setNewSpeciesUi] = React.useState<SpeciesUi | "">("");
  const [newBreed, setNewBreed] = React.useState<any>(null);

  const [damQuery, setDamQuery] = React.useState("");
  const [sireQuery, setSireQuery] = React.useState("");
  const [damOptions, setDamOptions] = React.useState<AnimalLite[]>([]);
  const [sireOptions, setSireOptions] = React.useState<AnimalLite[]>([]);
  const [damId, setDamId] = React.useState<number | null>(null);
  const [sireId, setSireId] = React.useState<number | null>(null);

  const [damFocused, setDamFocused] = React.useState(false);
  const [sireFocused, setSireFocused] = React.useState(false);

  const speciesWire = toWireSpecies(newSpeciesUi);
  const speciesSelected = !!speciesWire;
  const createBreedKey = `${newSpeciesUi || "Dog"}|${!!newBreed}`;

  const filterAnimals = React.useCallback(
    (items: AnimalLite[], sex: "FEMALE" | "MALE") => {
      if (!speciesWire) return [];
      return items
        .filter((a) => a.sex === sex && a.species === speciesWire)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }))
        .slice(0, 300);
    },
    [speciesWire]
  );

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (!body) return;

    const shouldLock = createOpen || currentView === "planner";

    if (shouldLock) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }

    return () => {
      body.style.overflow = "";
    };
  }, [createOpen, currentView]);

  React.useEffect(() => {
    if (!api || tenantId == null || !speciesSelected || !damFocused) return;
    let cancelled = false;
    const baseUrl = "/api/v1";
    const run = async () => {
      const all = await fetchAnimals({
        baseUrl,
        tenantId,
        q: damQuery.trim() || undefined,
        species: speciesWire,
        sexHint: "FEMALE",
        limit: 300,
      });
      if (!cancelled) setDamOptions(filterAnimals(all, "FEMALE"));
    };
    const t = setTimeout(run, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [api, tenantId, speciesSelected, speciesWire, damFocused, damQuery, filterAnimals]);

  React.useEffect(() => {
    if (!api || tenantId == null || !speciesSelected || !sireFocused) return;
    let cancelled = false;
    const baseUrl = "/api/v1";

    const run = async () => {
      const all = await fetchAnimals({
        baseUrl,
        tenantId,
        q: sireQuery.trim() || undefined,
        species: speciesWire,
        sexHint: "MALE",
        limit: 300,
      });
      if (!cancelled) setSireOptions(filterAnimals(all, "MALE"));
    };

    const t = setTimeout(run, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [api, tenantId, speciesSelected, speciesWire, sireFocused, sireQuery, filterAnimals]);

  const canCreate = Boolean(newName.trim() && newSpeciesUi && damId);

  const doCreatePlan = async () => {
    if (!api) return;
    if (!canCreate) {
      setCreateErr("Enter name, species, and select a Dam.");
      return;
    }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      const payload: any = {
        name: newName.trim(),
        species: toWireSpecies(newSpeciesUi),
        damId: damId!,
      };
      if (sireId != null) payload.sireId = sireId;
      if (newBreed?.name) payload.breedText = newBreed.name;

      const res = await api.createPlan(payload);
      const plan = (res as any)?.plan ?? res;
      setRows((prev) => [planToRow(plan), ...prev]);

      setNewName("");
      setNewSpeciesUi("");
      setNewBreed(null);
      setDamQuery("");
      setSireQuery("");
      setDamOptions([]);
      setSireOptions([]);
      setDamId(null);
      setSireId(null);
      setCreateOpen(false);
    } catch (e: any) {
      setCreateErr(e?.payload?.error || e?.message || "Failed to create breeding plan");
    } finally {
      setCreateWorking(false);
    }
  };

  const convertWhatIfRowToPlan = React.useCallback(
    async (row: WhatIfRow) => {
      if (!api) return;
      if (!row.damId || !row.cycleStartIso || !row.species) {
        console.warn("[Breeding] convertWhatIfRowToPlan missing dam or cycle start", row);
        return;
      }

      try {
        const baseName =
          row.damName && row.damName.trim().length > 0 ? row.damName.trim() : "What If Plan";
        const name = `${baseName} - ${row.cycleStartIso.slice(0, 10)}`;
        const lockedCycleStart = row.cycleStartIso.slice(0, 10);

        // STEP 1: create the plan so backend can apply normal defaults
        const createPayload: any = {
          name,
          // normalize to wire enum, same as New Plan
          species: toWireSpecies(row.species as any),
          damId: row.damId,
        };
        if (row.sireId != null) {
          (createPayload as any).sireId = row.sireId;
        }

        const createdRes = await api.createPlan(createPayload);
        const createdPlan = (createdRes as any)?.plan ?? createdRes;

        // STEP 2: compute expected dates and build lock payload
        const expected = computeExpectedForPlan({
          species: createdPlan.species ?? row.species,
          lockedCycleStart,
        } as any);

        const lockPayload: any = {
          lockedCycleStart,
          lockedOvulationDate: expected.expectedBreedDate,
          lockedDueDate: expected.expectedBirthDate,
          lockedPlacementStartDate: expected.expectedPlacementStartDate,
          expectedCycleStart: expected.expectedCycleStart,
          expectedHormoneTestingStart: expected.expectedHormoneTestingStart,
          expectedBreedDate: expected.expectedBreedDate,
          expectedBirthDate: expected.expectedBirthDate,
          expectedWeaned: expected.expectedWeaned,
          expectedPlacementStartDate: expected.expectedPlacementStartDate,
          expectedPlacementCompletedDate: expected.expectedPlacementCompletedDate,
        };

        const finalRes = await api.updatePlan(Number(createdPlan.id), lockPayload);
        const finalPlan = (finalRes as any)?.plan ?? finalRes;

        // STEP 3: push into UI and clean up What If row
        setRows((prev) => [planToRow(finalPlan), ...prev]);

        setWhatIfRows((prev) => {
          if (prev.length <= 1) {
            return prev.map((r) =>
              r.id === row.id
                ? {
                  ...r,
                  damId: null,
                  damName: null,
                  species: null,
                  cycleStartIso: null,
                }
                : r
            );
          }
          return prev.filter((r) => r.id !== row.id);
        });

        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(`whatif-${row.id}` as ID);
          if (finalPlan?.id != null) {
            next.add(finalPlan.id as ID);
          }
          return next;
        });
      } catch (err) {
        console.error("[Breeding] convertWhatIfRowToPlan failed", err);
      }
    },
    [api]
  );

  /* Quick add event state */
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [quickAddPlanId, setQuickAddPlanId] = React.useState<ID | null>(null);

  const createEvent = React.useCallback(
    async (input: { planId: number; type: string; date: string; note?: string }) => {
      if (!api) return;
      switch (input.type) {
        case "HORMONE_TEST":
          await api.createTest(input.planId, {
            kind: "PROGESTERONE",
            collectedAt: input.date,
            notes: input.note ?? null,
          });
          break;

        case "ATTEMPT":
          await api.createAttempt(input.planId, {
            method: "NATURAL",
            attemptAt: input.date,
            notes: input.note ?? null,
          });
          break;

        case "PREG_CHECK":
          await api.createPregCheck(input.planId, {
            method: "ULTRASOUND",
            result: true,
            checkedAt: input.date,
            notes: input.note ?? null,
          });
          break;

        case "BIRTHED":
          await api.createEvent(input.planId, {
            type: "BIRTHED",
            occurredAt: input.date,
            label: "Birthed",
            notes: input.note ?? null,
          });
          break;

        case "WEANED":
          await api.createEvent(input.planId, {
            type: "WEANED",
            occurredAt: input.date,
            label: "Weaned",
            notes: input.note ?? null,
          });
          break;
      }
      const fresh = await api.getPlan(input.planId, "parents,org");
      setRows((prev) => prev.map((r) => (Number(r.id) === input.planId ? planToRow(fresh) : r)));
    },
    [api]
  );

  /* === Drawer editing awareness for outside-click behavior === */
  const [drawerIsEditing, setDrawerIsEditing] = React.useState(false);
  const [drawerHasPendingChanges, setDrawerHasPendingChanges] = React.useState(false);

  /* Details Drawer Config */
  const detailsConfig = React.useMemo(() => {
    return {
      idParam: "planId",
      getRowId: (r: PlanRow) => r.id,
      width: 900,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: ID) => {
        const fallback = rows.find((r) => String(r.id) === String(id));
        if (!api) return fallback as PlanRow;
        try {
          const full = await api.getPlan(Number(id), "parents,org");
          return planToRow(full);
        } catch {
          return fallback as PlanRow;
        }
      },
      onSave: async (id: ID, draft: Partial<PlanRow>) => {
        if (!api) return;
        const current = rows.find((r) => r.id === id);
        const merged = { ...current, ...draft };

        // Normalize draft: convert empty strings to null so backend clears the field
        const normalizedDraft: Record<string, any> = {};
        for (const [key, value] of Object.entries(draft)) {
          if (typeof value === "string" && value.trim() === "") {
            normalizedDraft[key] = null;
          } else {
            normalizedDraft[key] = value;
          }
        }

        // Check if any actual date fields changed - if so, derive and include status
        const actualDateFields = [
          "cycleStartDateActual",
          "hormoneTestingStartDateActual",
          "breedDateActual",
          "birthDateActual",
          "weanedDateActual",
          "placementStartDateActual",
          "placementCompletedDateActual",
          "completedDateActual",
        ];
        const hasActualDateChange = actualDateFields.some((f) => f in normalizedDraft);

        if (hasActualDateChange) {
          // Derive status based on merged data (current + draft changes)
          const derivedStatus = deriveBreedingStatus({
            name: merged.name,
            species: merged.species,
            damId: merged.damId,
            sireId: merged.sireId,
            lockedCycleStart: merged.lockedCycleStart,
            status: current?.status ?? null, // Preserve current explicit status
            cycleStartDateActual: normalizedDraft.cycleStartDateActual !== undefined ? normalizedDraft.cycleStartDateActual : (current?.cycleStartDateActual ?? null),
            breedDateActual: normalizedDraft.breedDateActual !== undefined ? normalizedDraft.breedDateActual : (current?.breedDateActual ?? null),
            birthDateActual: normalizedDraft.birthDateActual !== undefined ? normalizedDraft.birthDateActual : (current?.birthDateActual ?? null),
            weanedDateActual: normalizedDraft.weanedDateActual !== undefined ? normalizedDraft.weanedDateActual : (current?.weanedDateActual ?? null),
            placementStartDateActual: normalizedDraft.placementStartDateActual !== undefined ? normalizedDraft.placementStartDateActual : (current?.placementStartDateActual ?? null),
            placementCompletedDateActual: normalizedDraft.placementCompletedDateActual !== undefined ? normalizedDraft.placementCompletedDateActual : (current?.placementCompletedDateActual ?? null),
            completedDateActual: normalizedDraft.completedDateActual !== undefined ? normalizedDraft.completedDateActual : (current?.completedDateActual ?? null),
          });
          // Include derived status translated to backend format
          normalizedDraft.status = toBackendStatus(derivedStatus);
          console.log("[Breeding] onSave - derived status:", derivedStatus, "-> backend:", normalizedDraft.status);
        }

        await api.updatePlan(Number(id), normalizedDraft as any);
        // Fetch fresh plan with includes to get full nested data (sire, dam, org)
        const fresh = await api.getPlan(Number(id), "parents,org");
        setRows((prev) => prev.map((r) => (r.id === id ? planToRow(fresh) : r)));
      },
      header: (r: PlanRow) => ({ title: r.name, subtitle: r.status || "" }),
      customChrome: true,
      tabs: PLAN_TABS as any,
      render: (props: any) => (
        <PlanDetailsView
          {...props}
          api={api}
          tenantId={tenantId}
          tabs={PLAN_TABS as any}
          breedBrowseApi={breedBrowseApi}
          orgIdForBreeds={orgIdForBreeds}
          openCustomBreed={(speciesUi: SpeciesUi, onCreated: (name: string) => void) => {
            const s = (speciesUi || "Dog").toUpperCase() as "DOG" | "CAT" | "HORSE";
            setCustomBreedSpecies(s);
            setOnCustomBreedCreated(() => (c) => {
              onCreated(c.name);
              setCustomBreedOpen(false);
            });
            setCustomBreedOpen(true);
          }}
          onCommitted={async (planId: ID) => {
            if (!api) return;

            // pick an actor id from your session utils, then fall back
            const actorId =
              (utils as any)?.session?.currentUserId?.() ??
              (utils as any)?.currentUser?.id ??
              "ui";

            try {
              // call the API that ensures an Offspring Group inside the same transaction
              const resp = await (api as any).commitPlanEnsure(Number(planId), { actorId });

              // refresh the plan for the drawer and table
              const fresh = await api.getPlan(Number(planId), "parents,org");
              setRows((prev) => prev.map((r) => (Number(r.id) === Number(planId) ? planToRow(fresh) : r)));

            } catch (e: any) {
              console.error("[Breeding] commit failed", e);
            }
          }}
          onPlanUpdated={(id, fresh) => {
            setRows((prev) => prev.map((r) => (Number(r.id) === Number(id) ? planToRow(fresh) : r)));
          }}
          onArchive={async (planId: ID, archived: boolean) => {
            if (!api) return;
            const updated = await api.updatePlan(Number(planId), { archived } as any);
            setRows((prev) => prev.map((r) => (r.id === Number(planId) ? planToRow(updated) : r)));
          }}
          onDelete={async (planId: ID) => {
            if (!api) return;

            // Call the delete endpoint (backend handles soft delete and offspring cascade)
            await api.deletePlan(Number(planId));

            // Refresh the plan to get updated deletedAt status
            const updated = await api.getPlan(Number(planId), "parents,org");

            // Update the rows state with the fresh plan data
            setRows((prev) => prev.map((r) => (r.id === Number(planId) ? planToRow(updated) : r)));

            // Emit event for other modules to refresh
            window.dispatchEvent(new CustomEvent("bhq:breeding:plans:updated"));
          }}
          closeDrawer={props.close}
          onModeChange={setDrawerIsEditing}
          onPendingChangesChange={setDrawerHasPendingChanges}
        />
      ),
    };
  }, [api, tenantId, rows]);

  /* Table custom cells (gate expected dates on lock) */
  const CELL_RENDERERS: Record<string, (r: PlanRow) => React.ReactNode> = {};

  /* ============================ RENDER ============================ */
  return (
    <>
      <OverlayMount />

      <div className="p-4 space-y-4">
        <div className="relative">
          <PageHeader title="Breeding" subtitle="Create and manage breeding plans" />
          <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1" style={{ zIndex: 50, pointerEvents: "auto" }}>
            {/* Top-right page navigation */}
            <nav className="flex items-center gap-1 mr-1">
              <SafeNavLink
                to={basePath === "/" ? "/" : `${basePath}/`}
                end
                className={({ isActive }) =>
                  [
                    "h-9 px-2 text-sm font-semibold leading-9 border-b-2 border-transparent transition-colors",
                    isActive ? "text-primary" : "text-secondary hover:text-primary",
                  ].join(" ")
                }
                style={({ isActive }) =>
                  isActive ? { borderBottomColor: "hsl(var(--brand-orange))" } : undefined
                }
              >
                Plans
              </SafeNavLink>

              <SafeNavLink
                to={`${basePath}/calendar`}
                className={({ isActive }) =>
                  [
                    "h-9 px-2 text-sm font-semibold leading-9 border-b-2 border-transparent transition-colors",
                    isActive ? "text-primary" : "text-secondary hover:text-primary",
                  ].join(" ")
                }
                style={({ isActive }) =>
                  isActive ? { borderBottomColor: "hsl(var(--brand-orange))" } : undefined
                }
              >
                Calendar
              </SafeNavLink>

              <SafeNavLink
                to={`${basePath}/planner`}
                className={({ isActive }) =>
                  [
                    "h-9 px-2 text-sm font-semibold leading-9 border-b-2 border-transparent transition-colors",
                    isActive ? "text-primary" : "text-secondary hover:text-primary",
                  ].join(" ")
                }
                style={({ isActive }) =>
                  isActive ? { borderBottomColor: "hsl(var(--brand-orange))" } : undefined
                }
              >
                Planner
              </SafeNavLink>
            </nav>
          </div>
        </div>


        {/* LIST VIEW */}
        {currentView === "list" && (
          <Card>
            <div className="bhq-details-guard" data-testid="bhq-details-guard">
              <DetailsHost
                rows={rows}
                config={detailsConfig}
                closeOnOutsideClick={!drawerIsEditing && !drawerHasPendingChanges}
                closeOnEscape={!drawerIsEditing && !drawerHasPendingChanges}
              >
                <Table
                  columns={COLUMNS}
                  columnState={map}
                  onColumnStateChange={setAll}
                  getRowId={(r: PlanRow) => r.id}
                  pageSize={25}
                  renderStickyRight={() => (
                    <ColumnsPopover
                      columns={map}
                      onToggle={toggle}
                      onSet={setAll}
                      onReset={() => setAll(COLUMNS)}
                      allColumns={COLUMNS}
                      triggerClassName="bhq-columns-trigger"
                    />
                  )}
                  stickyRightWidthPx={40}
                >
                  {/* Toolbar */}
                  <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <SearchBar
                        value={q}
                        onChange={setQ}
                        placeholder="Search any field…"
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setFiltersOpen((v) => !v)}
                            aria-expanded={filtersOpen}
                            title="Filters"
                            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/5 focus:outline-none"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden="true"
                            >
                              <path d="M3 5h18M7 12h10M10 19h4" strokeLinecap="round" />
                            </svg>
                          </button>
                        }
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                      disabled={!api}
                      className="ml-auto shrink-0"
                    >
                      New Breeding Plan
                    </Button>
                    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                      <Popover.Trigger asChild>
                        <Button size="sm" variant="outline" aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </Popover.Trigger>
                      <Popover.Content align="end" className="w-48">
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
                          onClick={handleExportCsv}
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </button>
                      </Popover.Content>
                    </Popover>
                  </div>

                  {/* Filters */}
                  {filtersOpen && (
                    <FiltersRow
                      filters={filters}
                      onChange={(next) => setFilters(next)}
                      schema={FILTER_SCHEMA}
                    />
                  )}

                  {/* Table */}
                  <table className="min-w-max w-full text-sm">
                    <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
                    <tbody>
                      {loading && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-secondary">Loading breeding plans…</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {!loading && error && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-red-600">Error: {error}</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {!loading && !error && pageRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-secondary">No breeding plans to display yet.</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {!loading &&
                        !error &&
                        pageRows.length > 0 &&
                        pageRows.map((r) => (
                          <TableRow
                            key={r.id}
                            detailsRow={r}
                            className={r.archived || r.archivedAt ? "bhq-row-archived" : undefined}
                          >
                            {visibleSafe.map((c) => {
                              let v = (r as any)[c.key] as any;
                              if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                              if (Array.isArray(v)) v = v.join(", ");
                              return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                            })}
                          </TableRow>
                        ))}
                    </tbody>
                  </table>

                  <TableFooter
                    entityLabel="plans"
                    page={clampedPage}
                    pageCount={pageCount}
                    pageSize={pageSize}
                    pageSizeOptions={[10, 25, 50, 100]}
                    onPageChange={(p) => setPage(p)}
                    onPageSizeChange={(n) => {
                      setPageSize(n);
                      setPage(1);
                    }}
                    start={start}
                    end={end}
                    filteredTotal={displayRows.length}
                    total={rows.length}
                    includeArchived={showArchived}
                    onIncludeArchivedChange={(checked) => {
                      setShowArchived(checked);
                      setPage(1);
                    }}
                    includeArchivedLabel="Show archived"
                  />
                </Table>
              </DetailsHost>

              {/* Quick Add Event modal */}
              {quickAddOpen &&
                modalRoot &&
                createPortal(
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: MODAL_Z, isolation: "isolate" }}
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) setQuickAddOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto">{/* quick add content slot */}</div>
                    </div>
                  </div>,
                  modalRoot
                )}
            </div>
          </Card>
        )}

        {/* CALENDAR VIEW */}
        {currentView === "calendar" && (
          <div className="p-2">
            <BreedingCalendar
              items={normalized}
              selectedPlanIds={Array.from(selectedKeys)}
              navigateToPlan={(id: any) => openPlanDrawer(id)}
              horizon={plannerHorizon}
            />
          </div>
        )}

        {/* PLANNER VIEW */}
        {currentView === "planner" && (
          <div
            ref={plannerContentRef}
            className="p-4 overflow-y-auto"
            style={{ maxHeight: plannerContentMaxHeight ?? undefined }}
          >
            {/* Page-level tabs: Your Breeding Plans | What If Planning */}
            <nav className="inline-flex items-end gap-6 mb-4" role="tablist" aria-label="Planner pages">
              {(["your-plans", "what-if"] as const).map((tabKey) => {
                const isActive = plannerPage === tabKey;
                const label = tabKey === "your-plans" ? "Your Breeding Plans" : "What If Planning";
                return (
                  <button
                    key={tabKey}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setPlannerPage(tabKey)}
                    className={[
                      "pb-1 text-sm font-medium transition-colors select-none",
                      isActive
                        ? "text-primary"
                        : "text-secondary hover:text-primary",
                    ].join(" ")}
                    style={{
                      borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Page content */}
            {plannerPage === "your-plans" ? (
              <YourBreedingPlansPage plans={normalized as any} initialMode="rollup" />
            ) : (
              <WhatIfPlanningPage
                plans={normalized as any}
                females={whatIfFemales as WhatIfFemale[]}
                api={api}
                onPlanCreated={(plan) => {
                  // Add new plan to the beginning of the rows list
                  setRows((prev) => [planToRow(plan), ...prev]);
                }}
              />
            )}
          </div>
        )}


        {/* Create Plan Modal */}
        <Overlay root={modalRoot} open={createOpen} ariaLabel="Create Breeding Plan" closeOnEscape closeOnOutsideClick>
          {(() => {
            const panelRef = React.useRef<HTMLDivElement>(null);

            const handleOutsideMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
              const p = panelRef.current;
              if (!p) return;
              if (!p.contains(e.target as Node)) {
                if (!createWorking) setCreateOpen(false);
              }
            };

            return (
              <div className="fixed inset-0" style={{ zIndex: MODAL_Z, isolation: "isolate" }} onMouseDown={handleOutsideMouseDown}>
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    className="pointer-events-auto relative w-[720px] max-w-[94vw] rounded-xl border border-hairline bg-surface shadow-xl p-4"
                  >
                    <div className="text-lg font-semibold mb-1">New Breeding Plan</div>
                    <div className="text-sm text-secondary mb-4">
                      A plan must have a Dam and a Sire to be complete. You can start with just the Dam and add a Sire later.
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-secondary mb-1">
                          Plan name <span className="text-[hsl(var(--brand-orange))]">*</span>
                        </div>
                        <Input value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="Luna × TBD, Fall 2026" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs text-secondary mb-1">
                            Species <span className="text-[hsl(var(--brand-orange))]">*</span>
                          </div>
                          <select
                            className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                            value={newSpeciesUi}
                            onChange={(e) => {
                              const next = e.currentTarget.value as SpeciesUi | "";
                              setNewSpeciesUi(next);
                              setDamId(null);
                              setSireId(null);
                              setDamQuery("");
                              setSireQuery("");
                              setDamOptions([]);
                              setSireOptions([]);
                            }}
                          >
                            <option value="">—</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Horse">Horse</option>
                          </select>
                        </div>
                      </div>

                      {/* Breed (search + browse + new custom) */}
                      <div className="sm:col-span-3">
                        <div className="text-xs text-secondary mb-1">
                          Breed <span className="text-[hsl(var(--brand-orange))]">*</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <BreedCombo
                              key={createBreedKey}
                              orgId={orgIdForBreeds ?? undefined}
                              species={newSpeciesUi || "Dog"}
                              value={newBreed}
                              onChange={(hit: any) => setNewBreed(hit ?? null)}
                              api={breedBrowseApi}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const speciesEnum = String(newSpeciesUi || "Dog").toUpperCase() as "DOG" | "CAT" | "HORSE";
                              setCustomBreedSpecies(speciesEnum);
                              setOnCustomBreedCreated(
                                () =>
                                  (created) => {
                                    setNewBreed({
                                      id: created.id,
                                      name: created.name,
                                      species: newSpeciesUi || "Dog",
                                      source: "custom",
                                    } as any);
                                    setCustomBreedOpen(false);
                                  }
                              );
                              setCustomBreedOpen(true);
                            }}
                          >
                            New custom
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Dam */}
                        <div>
                          <div className="text-xs text-secondary mb-1">
                            Dam <span className="text-[hsl(var(--brand-orange))]">*</span>
                          </div>
                          <Input
                            value={damQuery}
                            onChange={(e) => setDamQuery(e.currentTarget.value)}
                            onFocus={() => setDamFocused(true)}
                            onBlur={() => setDamFocused(false)}
                            placeholder={speciesSelected ? "Search or pick from list…" : "Select species first"}
                            disabled={!speciesSelected}
                          />
                          {damFocused && speciesSelected && (
                            <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                              {damOptions.length > 0 ? (
                                damOptions.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setDamId(a.id);
                                      setDamQuery(a.name);
                                      setDamFocused(false);
                                    }}
                                    className={`w-full px-2 py-1 text-left hover:bg-white/5 ${damId === a.id ? "bg-white/10" : ""}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{a.name}</span>
                                      {a.organization?.name ? (
                                        <span className="text-xs text-secondary ml-2">({a.organization.name})</span>
                                      ) : null}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-2 py-2 text-sm text-secondary">No females found for this species</div>
                              )}
                            </div>
                          )}
                          {damId != null && (
                            <div className="mt-1">
                              <button
                                type="button"
                                className="text-xs text-secondary underline hover:text-primary"
                                onClick={() => {
                                  setDamId(null);
                                  setDamQuery("");
                                }}
                              >
                                Clear Dam
                              </button>
                            </div>
                          )}
                          {damId == null && speciesSelected && (
                            <div className="mt-1 text-xs text-[hsl(var(--brand-orange))]">Select a Dam to continue</div>
                          )}
                        </div>

                        {/* Sire */}
                        <div>
                          <div className="text-xs text-secondary mb-1">Sire (optional for now)</div>
                          <Input
                            value={sireQuery}
                            onChange={(e) => setSireQuery(e.currentTarget.value)}
                            onFocus={() => setSireFocused(true)}
                            onBlur={() => setSireFocused(false)}
                            placeholder={speciesSelected ? "Search or pick from list…" : "Select species first"}
                            disabled={!speciesSelected}
                          />
                          {sireFocused && speciesSelected && (
                            <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                              {sireOptions.length > 0 ? (
                                sireOptions.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setSireId(a.id);
                                      setSireQuery(a.name);
                                      setSireFocused(false);
                                    }}
                                    className={`w-full px-2 py-1 text-left hover:bg-white/5 ${sireId === a.id ? "bg-white/10" : ""}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{a.name}</span>
                                      {a.organization?.name ? (
                                        <span className="text-xs text-secondary ml-2">({a.organization.name})</span>
                                      ) : null}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-2 py-2 text-sm text-secondary">No males found for this species</div>
                              )}
                            </div>
                          )}
                          {sireId != null && (
                            <div className="mt-1">
                              <button
                                type="button"
                                className="text-xs text-secondary underline hover:text-primary"
                                onClick={() => {
                                  setSireId(null);
                                  setSireQuery("");
                                }}
                              >
                                Clear Sire
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {createErr && <div className="text-sm text-red-600">{createErr}</div>}

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-secondary">
                          <span className="text-[hsl(var(--brand-orange))]">*</span> Required
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createWorking}>
                            Cancel
                          </Button>
                          <Button onClick={doCreatePlan} disabled={!canCreate || createWorking || !api}>
                            {createWorking ? "Creating…" : "Create plan"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Overlay>

        {/* Custom Breed Dialog (portal) */}
        {customBreedOpen &&
          modalRoot &&
          createPortal(
            <div className="fixed inset-0" style={{ zIndex: MODAL_Z, isolation: "isolate" }}>
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  <CustomBreedDialog
                    open
                    onClose={() => setCustomBreedOpen(false)}
                    api={{
                      breeds: {
                        customCreate: (api as any)?.breeds?.customCreate,
                        putRecipe: (api as any)?.breeds?.putRecipe,
                      },
                    }}
                    species={customBreedSpecies}
                    onCreated={(c) => onCustomBreedCreated?.(c)}
                  />
                </div>
              </div>
            </div>,
            modalRoot
          )}
      </div>
    </>
  );
}


/* CalendarInput: text field + native date picker */

function CalendarInput(props: any) {
  const readOnly = !!props.readOnly;
  const className = props.className;
  const inputClassName = props.inputClassName;
  const onChange = props.onChange;
  const value = props.value as string | undefined;
  const defaultValue = props.defaultValue as string | undefined;
  const placeholder = props.placeholder ?? "mm/dd/yyyy";
  const showIcon = props.showIcon ?? true;
  // expectedValue: when user focuses on empty field, pre-populate with this value
  const expectedValue = props.expectedValue as string | undefined;

  // any extra props intended for the visible input
  const rest: any = { ...props };
  delete rest.readOnly;
  delete rest.className;
  delete rest.inputClassName;
  delete rest.onChange;
  delete rest.value;
  delete rest.defaultValue;
  delete rest.placeholder;
  delete rest.showIcon;
  delete rest.expectedValue;

  // ISO <-> display helpers
  const onlyISO = (s: string | undefined | null) => {
    if (!s) return "";
    const str = String(s).trim();
    if (!str) return "";
    // Ensure we only return yyyy-mm-dd format or empty string
    const match = str.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "";
  };

  const toDisplay = (s: string | undefined | null) => {
    if (!s) return "";
    const iso = onlyISO(s);
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return `${m}/${d}/${y}`;
  };

  const toISO = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return "";
    // Try to parse mm/dd/yyyy
    const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (m) {
      const mm = m[1].padStart(2, "0");
      const dd = m[2].padStart(2, "0");
      let yyyy = m[3];
      if (yyyy.length === 2) yyyy = `20${yyyy}`;
      return `${yyyy}-${mm}-${dd}`;
    }
    // Fallback, assume already ISO-like
    return onlyISO(trimmed);
  };

  const [textValue, setTextValue] = React.useState(() =>
    value != null ? toDisplay(value) : defaultValue != null ? toDisplay(defaultValue) : ""
  );

  React.useEffect(() => {
    if (value != null) {
      setTextValue(toDisplay(value));
    }
  }, [value]);

  const shellRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    // Only try to wire things up when the icon is actually rendered
    if (!showIcon) return;

    const shell = shellRef.current;
    const btn = buttonRef.current;
    const hidden = hiddenRef.current;
    if (!shell || !btn || !hidden) return;

    const cleanup = attachDatePopupPositioning({
      shell,
      button: btn,
      hiddenInput: hidden,
      onPopupOpen: () => setExpanded(true),
      onPopupClose: () => setExpanded(false),
    });

    return cleanup;
  }, [showIcon]);

  const handleTextChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.currentTarget.value;
    setTextValue(raw);

    if (!onChange) return;

    const iso = toISO(raw);
    onChange({ currentTarget: { value: iso } } as any);
  };

  const handleHiddenChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const iso = onlyISO(e.currentTarget.value || "");
    const display = toDisplay(iso);
    setTextValue(display);

    if (!onChange) return;
    onChange({ currentTarget: { value: iso } } as any);
  };

  // Pre-populate with expected value when focusing on empty field
  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (e) => {
    if (!textValue && expectedValue && onChange) {
      const iso = onlyISO(expectedValue);
      if (iso) {
        const display = toDisplay(iso);
        setTextValue(display);
        onChange({ currentTarget: { value: iso } } as any);
      }
    }
  };

  return (
    <div ref={shellRef} className={className}>
      <div className="relative">
        <Input
          ref={inputRef}
          className={inputClassName}
          placeholder={placeholder}
          value={textValue}
          onChange={handleTextChange}
          onFocus={handleFocus}
          readOnly={readOnly}
          {...rest}
        />
        {showIcon && (
          <button
            type="button"
            ref={buttonRef}
            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
            aria-label="Open date picker"
          >
            <span className="text-xs">📅</span>
          </button>
        )}
        {/* Hidden native date input for mobile and popup control */}
        <input
          ref={hiddenRef}
          type="date"
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 0,
            height: 0,
            margin: 0,
            padding: 0,
            border: "none",
          }}
          value={onlyISO(value || "")}
          onChange={handleHiddenChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-secondary mb-1">{label}</div>
      {children}
    </div>
  );
}

/* ───────── Placement Scheduling Section (Phase 6) ───────── */

type PlacementSchedulingSectionProps = {
  offspringGroupId: number;
  api: ReturnType<typeof makeBreedingApi>;
  isEdit: boolean;
  editable: boolean;
};

function PlacementSchedulingSection({
  offspringGroupId,
  api,
  isEdit,
  editable,
}: PlacementSchedulingSectionProps) {
  const [policy, setPolicy] = React.useState<{
    enabled: boolean;
    timezone: string | null;
    startAt: string | null;
    windowMinutes: number | null;
    gapMinutes: number | null;
    graceMinutes: number | null;
    allowOverlap: boolean;
  } | null>(null);

  const [status, setStatus] = React.useState<{
    rankedBuyersCount: number;
    bookedCount: number;
    pendingCount: number;
    missedCount: number;
    buyers: Array<{
      buyerId: number;
      buyerName: string;
      placementRank: number | null;
      bookingStatus: "booked" | "pending" | "missed" | null;
    }>;
  } | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<typeof policy>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.offspringGroups.getPlacementPolicy(offspringGroupId),
      api.offspringGroups.getPlacementStatus(offspringGroupId),
    ])
      .then(([policyRes, statusRes]) => {
        if (cancelled) return;
        setPolicy(policyRes);
        setDraft(policyRes);
        setStatus(statusRes);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load placement scheduling");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [offspringGroupId, api]);

  const handleSave = React.useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api.offspringGroups.updatePlacementPolicy(offspringGroupId, draft);
      setPolicy(updated);
      setDraft(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  }, [api, offspringGroupId, draft]);

  const handleRankChange = React.useCallback(
    async (buyerId: number, rank: number | null) => {
      try {
        await api.offspringGroups.updateBuyerPlacementRank(offspringGroupId, buyerId, rank);
        const statusRes = await api.offspringGroups.getPlacementStatus(offspringGroupId);
        setStatus(statusRes);
      } catch (err: any) {
        setError(err?.message || "Failed to update buyer rank");
      }
    },
    [api, offspringGroupId]
  );

  const hasChanges = React.useMemo(() => {
    if (!policy || !draft) return false;
    return (
      policy.enabled !== draft.enabled ||
      policy.timezone !== draft.timezone ||
      policy.startAt !== draft.startAt ||
      policy.windowMinutes !== draft.windowMinutes ||
      policy.gapMinutes !== draft.gapMinutes ||
      policy.graceMinutes !== draft.graceMinutes ||
      policy.allowOverlap !== draft.allowOverlap
    );
  }, [policy, draft]);

  if (loading) {
    return (
      <SectionCard title="Placement Scheduling">
        <div className="text-sm text-secondary">Loading...</div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Placement Scheduling">
        <div className="text-sm text-red-600">{error}</div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Placement Scheduling">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft?.enabled ?? false}
              onChange={(e) => setDraft((d) => d ? { ...d, enabled: e.target.checked } : d)}
              disabled={!isEdit || !editable}
              className="h-4 w-4 rounded border-hairline"
            />
            <span className="text-sm">Enable placement scheduling fairness</span>
          </label>
        </div>

        {draft?.enabled && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Timezone</div>
                {isEdit ? (
                  <select
                    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                    value={draft?.timezone || ""}
                    onChange={(e) => setDraft((d) => d ? { ...d, timezone: e.target.value || null } : d)}
                    disabled={!editable}
                  >
                    <option value="">Select timezone</option>
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                  </select>
                ) : (
                  <div className="text-sm">{policy?.timezone || "-"}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-secondary mb-1">Start Date/Time</div>
                {isEdit ? (
                  <Input
                    type="datetime-local"
                    value={draft?.startAt?.slice(0, 16) || ""}
                    onChange={(e) =>
                      setDraft((d) => d ? { ...d, startAt: e.target.value ? new Date(e.target.value).toISOString() : null } : d)
                    }
                    disabled={!editable}
                    className="h-9"
                  />
                ) : (
                  <div className="text-sm">{policy?.startAt ? new Date(policy.startAt).toLocaleString() : "-"}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-secondary mb-1">Window (minutes)</div>
                {isEdit ? (
                  <Input
                    type="number"
                    min={1}
                    value={draft?.windowMinutes ?? ""}
                    onChange={(e) => setDraft((d) => d ? { ...d, windowMinutes: e.target.value ? Number(e.target.value) : null } : d)}
                    disabled={!editable}
                    className="h-9"
                  />
                ) : (
                  <div className="text-sm">{policy?.windowMinutes ?? "-"}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-secondary mb-1">Gap (minutes)</div>
                {isEdit ? (
                  <Input
                    type="number"
                    min={0}
                    value={draft?.gapMinutes ?? ""}
                    onChange={(e) => setDraft((d) => d ? { ...d, gapMinutes: e.target.value ? Number(e.target.value) : null } : d)}
                    disabled={!editable}
                    className="h-9"
                  />
                ) : (
                  <div className="text-sm">{policy?.gapMinutes ?? "-"}</div>
                )}
              </div>

              <div>
                <div className="text-xs text-secondary mb-1">Grace (minutes)</div>
                {isEdit ? (
                  <Input
                    type="number"
                    min={0}
                    value={draft?.graceMinutes ?? ""}
                    onChange={(e) => setDraft((d) => d ? { ...d, graceMinutes: e.target.value ? Number(e.target.value) : null } : d)}
                    disabled={!editable}
                    className="h-9"
                  />
                ) : (
                  <div className="text-sm">{policy?.graceMinutes ?? "-"}</div>
                )}
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer h-9">
                  <input
                    type="checkbox"
                    checked={draft?.allowOverlap ?? false}
                    onChange={(e) => setDraft((d) => d ? { ...d, allowOverlap: e.target.checked } : d)}
                    disabled={!isEdit || !editable}
                    className="h-4 w-4 rounded border-hairline"
                  />
                  <span className="text-sm">Allow overlap</span>
                </label>
              </div>
            </div>

            {isEdit && hasChanges && (
              <div className="flex justify-end">
                <Button variant="default" size="sm" onClick={handleSave} disabled={saving || !editable}>
                  {saving ? "Saving..." : "Save Policy"}
                </Button>
              </div>
            )}

            {status && (
              <div className="mt-4 pt-4 border-t border-hairline">
                <div className="text-xs text-secondary mb-2 font-medium">Status</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 rounded-md bg-surface-raised">
                    <div className="text-lg font-semibold">{status.rankedBuyersCount}</div>
                    <div className="text-xs text-secondary">Ranked</div>
                  </div>
                  <div className="text-center p-2 rounded-md bg-surface-raised">
                    <div className="text-lg font-semibold text-green-600">{status.bookedCount}</div>
                    <div className="text-xs text-secondary">Booked</div>
                  </div>
                  <div className="text-center p-2 rounded-md bg-surface-raised">
                    <div className="text-lg font-semibold text-amber-600">{status.pendingCount}</div>
                    <div className="text-xs text-secondary">Pending</div>
                  </div>
                  <div className="text-center p-2 rounded-md bg-surface-raised">
                    <div className="text-lg font-semibold text-red-600">{status.missedCount}</div>
                    <div className="text-xs text-secondary">Missed</div>
                  </div>
                </div>

                {status.buyers.length > 0 && (
                  <div>
                    <div className="text-xs text-secondary mb-2 font-medium">Buyer Placement Order</div>
                    <div className="space-y-2">
                      {status.buyers.map((buyer) => (
                        <div key={buyer.buyerId} className="flex items-center gap-3 p-2 rounded-md bg-surface-raised">
                          <div className="w-16">
                            {isEdit && editable ? (
                              <Input
                                type="number"
                                min={1}
                                value={buyer.placementRank ?? ""}
                                onChange={(e) => handleRankChange(buyer.buyerId, e.target.value ? Number(e.target.value) : null)}
                                className="h-8 text-center"
                                placeholder="#"
                              />
                            ) : (
                              <div className="text-sm text-center font-medium">{buyer.placementRank ?? "-"}</div>
                            )}
                          </div>
                          <div className="flex-1 text-sm">{buyer.buyerName}</div>
                          <div className="text-xs">
                            {buyer.bookingStatus === "booked" && <span className="text-green-600">Booked</span>}
                            {buyer.bookingStatus === "pending" && <span className="text-amber-600">Pending</span>}
                            {buyer.bookingStatus === "missed" && <span className="text-red-600">Missed</span>}
                            {!buyer.bookingStatus && <span className="text-secondary">-</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!draft?.enabled && (
          <div className="text-sm text-secondary">
            When enabled, buyers will be assigned time windows in rank order to ensure fair access to scheduling.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ───────── Details View ───────── */

function PlanDetailsView(props: {
  row: PlanRow;
  mode: "view" | "edit";
  setMode: (m: "view" | "edit") => void;
  setDraft: (p: Partial<PlanRow>) => void;
  activeTab: string;
  setActiveTab: (k: string) => void;
  requestSave: () => Promise<void>;
  api: ReturnType<typeof makeBreedingApi> | null;
  tenantId: number | null;
  breedBrowseApi: { breeds: { listCanonical: (opts: { species: string; orgId?: number; limit?: number }) => Promise<any[]> } };
  orgIdForBreeds: number | null;
  openCustomBreed: (speciesUi: SpeciesUi, onCreated: (name: string) => void) => void;
  onCommitted?: (id: ID) => Promise<void> | void;
  closeDrawer: () => void;
  onModeChange?: (editing: boolean) => void;
  onPendingChangesChange?: (hasPending: boolean) => void;
  onArchive?: (id: ID, archived: boolean) => Promise<void> | void;
  onDelete?: (id: ID) => Promise<void> | void;
  onPlanUpdated?: (id: ID, fresh: any) => void;
  tabs: ReadonlyArray<{ key: string; label: string }>;
  close: () => void;
  hasPendingChanges: boolean;
}) {
  const {
    row,
    mode,
    setMode,
    setDraft,
    activeTab,
    setActiveTab,
    requestSave,
    api,
    tenantId,
    breedBrowseApi,
    orgIdForBreeds,
    openCustomBreed,
    onCommitted,
    onArchive,
    onDelete,
    closeDrawer,
    onModeChange,
    onPendingChangesChange,
    onPlanUpdated,
    tabs,
    close,
    hasPendingChanges,
  } = props;

  const isEdit = mode === "edit";
  React.useEffect(() => {
    onModeChange?.(isEdit);
  }, [isEdit, onModeChange]);

  // ---- status flags used by Dates tab and other sections ----
  const statusU = (row.status || "").toUpperCase();
  const committedOrLater = ["COMMITTED", "BRED", "BIRTHED", "WEANED", "PLACEMENT_STARTED", "PLACEMENT_COMPLETED", "COMPLETE"].includes(statusU);

  const isCommitted = statusU === "COMMITTED";
  const isArchived = Boolean(row.archivedAt);
  const isDeleted = Boolean(row.deletedAt);
  const isReadOnly = isArchived || isDeleted;

  // Editable gate: archived or deleted plans cannot be edited
  const editable = !isArchived && !isDeleted;

  // Once a plan is COMMITTED (or later), certain core fields cannot be changed:
  // Dam, Sire, Breed, and Cycle Lock Date
  const coreFieldsLocked = committedOrLater;

  // Show Actual Dates once the plan is COMMITTED or later.
  // Allow editing while in Edit mode for COMMITTED and later statuses.
  // CRITICAL: Must explicitly exclude PLANNING status
  const showActualDates = committedOrLater && statusU !== "PLANNING";
  const canEditDates = isEdit && committedOrLater && statusU !== "PLANNING" && !isReadOnly;


  // live draft overlay
  const draftRef = React.useRef<Partial<PlanRow>>({});
  const [draftTick, setDraftTick] = React.useState(0);
  const [actualDatesWarning, setActualDatesWarning] = React.useState<string | null>(null);

  // Guidance card collapsed/expanded state
  const [guidanceCollapsed, setGuidanceCollapsed] = React.useState(false);

  // Unsaved changes tracking
  const [persistedSnapshot, setPersistedSnapshot] = React.useState<Partial<PlanRow>>(() => buildPlanSnapshot(row));
  const [pendingSave, setPendingSave] = React.useState(false);
  const [uncommitting, setUncommitting] = React.useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);

  // Reset persisted snapshot when row.id changes (switching to a different plan)
  React.useEffect(() => {
    setPersistedSnapshot(buildPlanSnapshot(row));
    draftRef.current = {};
    setPendingSave(false);
  }, [row.id]);

  // Sync persisted snapshot with row when row data changes from server (after save)
  // This ensures the snapshot stays in sync when the parent updates the row prop
  const rowSnapshotKey = React.useMemo(() => {
    const snap = buildPlanSnapshot(row);
    return JSON.stringify(snap);
  }, [row]);

  React.useEffect(() => {
    // Only update if draft is empty (i.e., after a save completed and draft was cleared)
    if (Object.keys(draftRef.current).length === 0) {
      setPersistedSnapshot(buildPlanSnapshot(row));
    }
  }, [rowSnapshotKey]);

  // Calculate if there are unsaved changes
  const isDirty = React.useMemo(() => {
    const changedFields = prunePlanDraft(draftRef.current, persistedSnapshot);
    return Object.keys(changedFields).length > 0;
  }, [draftTick, persistedSnapshot]);

  const hasPendingChangesLocal = isDirty || pendingSave;

  // Ref-based dirty check for use in event handlers (avoids stale closure issues)
  const persistedSnapshotRef = React.useRef(persistedSnapshot);
  React.useEffect(() => { persistedSnapshotRef.current = persistedSnapshot; }, [persistedSnapshot]);
  const pendingSaveRef = React.useRef(pendingSave);
  React.useEffect(() => { pendingSaveRef.current = pendingSave; }, [pendingSave]);

  const checkPendingChangesSync = React.useCallback(() => {
    const changedFields = prunePlanDraft(draftRef.current, persistedSnapshotRef.current);
    return Object.keys(changedFields).length > 0 || pendingSaveRef.current;
  }, []);

  // Notify parent when pending changes state changes
  React.useEffect(() => {
    onPendingChangesChange?.(hasPendingChangesLocal);
  }, [hasPendingChangesLocal, onPendingChangesChange]);

  const setDraftLive = React.useCallback(
    (patch: Partial<PlanRow>) => {
      // Prevent any mutations for archived or deleted plans
      if (isArchived || isDeleted) return;

      // Check for impossible actual date sequences and warn, but do not block
      const ACTUAL_FIELD_ORDER: Array<keyof PlanRow> = [
        "cycleStartDateActual",
        "hormoneTestingStartDateActual",
        "breedDateActual",
        "birthDateActual",
        "weanedDateActual",
        "placementStartDateActual",
        "placementCompletedDateActual",
        "completedDateActual",
      ];

      const actualKeysChanged = ACTUAL_FIELD_ORDER.filter((key) => key in patch);

      if (actualKeysChanged.length) {
        const normalize = (value: any): string | null => {
          if (!value) return null;
          const s = String(value);
          if (!s.trim()) return null;
          return s.slice(0, 10);
        };

        const working: Record<string, string | null> = {};

        for (const key of ACTUAL_FIELD_ORDER) {
          const fromDraft = (draftRef.current as any)[key];
          const base = fromDraft ?? (row as any)[key];
          working[key] = normalize(base);
        }

        for (const key of actualKeysChanged) {
          const next = (patch as any)[key];
          working[key] = normalize(next);
        }

        const parse = (s: string | null) => (s ? new Date(s) : null);

        const sequenceBroken: { prev: keyof PlanRow; next: keyof PlanRow }[] = [];

        // Only check adjacent pairs in the breeding sequence
        for (let i = 0; i < ACTUAL_FIELD_ORDER.length - 1; i++) {
          const prevKey = ACTUAL_FIELD_ORDER[i];
          const nextKey = ACTUAL_FIELD_ORDER[i + 1];
          const prevDate = parse(working[prevKey]);
          const nextDate = parse(working[nextKey]);
          if (prevDate && nextDate && prevDate > nextDate) {
            sequenceBroken.push({ prev: prevKey, next: nextKey });
          }
        }

        if (sequenceBroken.length) {
          const label = (key: keyof PlanRow): string => {
            switch (key) {
              case "cycleStartDateActual":
                return "Cycle Start";
              case "hormoneTestingStartDateActual":
                return "Hormone Testing";
              case "breedDateActual":
                return "Breeding";
              case "birthDateActual":
                return "Birth";
              case "weanedDateActual":
                return "Weaning";
              case "placementStartDateActual":
                return "Placement Start";
              case "placementCompletedDateActual":
                return "Placement Completed";
              case "completedDateActual":
                return "Plan Completed";
              default:
                return String(key);
            }
          };

          const lines = sequenceBroken.map(({ prev, next }) => {
            return `${label(next)} is now before ${label(prev)}.`;
          });

          const msg =
            "These actual dates look out of order based on the breeding sequence:\n\n" +
            lines.join("\n") +
            "\n\nYou can keep this value if this reflects real life, but please double check.";

          // Pretty UI modal, not a browser dialog, and does not block the save
          void confirmModal({
            title: "Check actual dates",
            message: msg,
            confirmText: "OK",
          });
        }
      }

      // Apply the patch
      draftRef.current = { ...draftRef.current, ...patch };
      setDraft(patch);
      setDraftTick((t) => t + 1);
    },
    [setDraft, row]
  );

  const effective = React.useMemo(
    () => ({ ...row, ...draftRef.current }),
    [row, draftTick]
  );

  type ActualFieldKey =
    | "cycleStartDateActual"
    | "hormoneTestingStartDateActual"
    | "breedDateActual"
    | "birthDateActual"
    | "weanedDateActual"
    | "placementStartDateActual"
    | "placementCompletedDateActual"
    | "completedDateActual";

  const ACTUAL_FIELD_ORDER: ActualFieldKey[] = [
    "cycleStartDateActual",
    "hormoneTestingStartDateActual",
    "breedDateActual",
    "birthDateActual",
    "weanedDateActual",
    "placementStartDateActual",
    "placementCompletedDateActual",
    "completedDateActual",
  ];

  const ACTUAL_FIELD_LABELS: Record<ActualFieldKey, string> = {
    cycleStartDateActual: "Cycle Start (Actual)",
    hormoneTestingStartDateActual: "Hormone Testing Start (Actual)",
    breedDateActual: "Breeding Date (Actual)",
    birthDateActual: "Birth Date (Actual)",
    weanedDateActual: "Weaning Completed (Actual)",
    placementStartDateActual: "Placement Start (Actual)",
    placementCompletedDateActual: "Placement Completed (Actual)",
    completedDateActual: "Plan Completed (Actual)",
  };

  const parseActualDate = (value: string | null | undefined): Date | null => {
    const v = (value ?? "").trim();
    if (!v) return null;
    // Force midnight local, and avoid locale weirdness
    const d = new Date(v + "T00:00:00");
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const warnIfSequenceBroken = React.useCallback(
    (field: ActualFieldKey, nextValue: string) => {
      // clear previous warning so the text updates cleanly
      setActualDatesWarning(null);

      const nextDate = parseActualDate(nextValue);
      if (!nextDate) return;

      const idx = ACTUAL_FIELD_ORDER.indexOf(field);
      if (idx === -1) return;

      const currentLabel = ACTUAL_FIELD_LABELS[field];

      const setWarning = (otherKey: ActualFieldKey, relation: "before" | "after") => {
        const otherLabel = ACTUAL_FIELD_LABELS[otherKey];
        const relationText = relation === "before" ? "is now before" : "is now after";

        const msg =
          `These actual dates look out of order based on the breeding sequence: ` +
          `${currentLabel} ${relationText} ${otherLabel}. ` +
          `You can keep this value if it reflects real life, but please double check.`;

        setActualDatesWarning(msg);
      };

      // check against earlier events in the sequence
      for (let i = 0; i < idx; i++) {
        const key = ACTUAL_FIELD_ORDER[i];
        const other = parseActualDate((effective as any)[key]);
        if (!other) continue;
        if (nextDate < other) {
          setWarning(key, "before");
          return;
        }
      }

      // check against later events in the sequence
      for (let i = idx + 1; i < ACTUAL_FIELD_ORDER.length; i++) {
        const key = ACTUAL_FIELD_ORDER[i];
        const other = parseActualDate((effective as any)[key]);
        if (!other) continue;
        if (nextDate > other) {
          setWarning(key, "after");
          return;
        }
      }
    },
    [effective]
  );

  // Clear a date and all subsequent dates in the sequence
  const clearActualDateAndSubsequent = React.useCallback(
    (field: ActualFieldKey) => {
      const idx = ACTUAL_FIELD_ORDER.indexOf(field);
      if (idx === -1) return;

      // Build a patch object that clears this date and all subsequent dates
      const patch: Record<string, null> = {};
      for (let i = idx; i < ACTUAL_FIELD_ORDER.length; i++) {
        patch[ACTUAL_FIELD_ORDER[i]] = null;
      }

      setDraftLive(patch as any);
      setActualDatesWarning(null);
    },
    [setDraftLive]
  );

  // Allow editing cycle start actual when in edit mode and committed
  const canEditCycleStartActual = canEditDates;

  const canEditCompletedActual =
    canEditDates &&
    !!effective.cycleStartDateActual &&
    !!effective.hormoneTestingStartDateActual &&
    !!effective.breedDateActual &&
    !!effective.birthDateActual &&
    !!effective.placementStartDateActual &&
    !!effective.placementCompletedDateActual;

  type DamReproEvent = {
    kind: "heat_start" | "ovulation" | "insemination" | "whelp" | "cycle_start";
    date: string;
  };

  type DamReproData = {
    last_heat: string | null;
    lastCycle?: string | null;
    cycleStartDates?: string[];
    repro: DamReproEvent[];
  };

  const [damRepro, setDamRepro] = React.useState<DamReproData | null>(null);
  const [damLoadError, setDamLoadError] = React.useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [liveOverride, setLiveOverride] = React.useState<number | null>(row.femaleCycleLenOverrideDays ?? null);

  // Sync liveOverride when damId changes (new female selected)
  React.useEffect(() => {
    setLiveOverride(row.femaleCycleLenOverrideDays ?? null);
  }, [row.damId, row.femaleCycleLenOverrideDays]);

  const prevDamIdRef = React.useRef<number | null>(null);
  const fetchedDamIds = React.useRef<Set<number>>(new Set());

  // Use effective.damId so we fetch cycle data when user selects a new dam in edit mode
  const currentDamId = effective.damId;

  React.useEffect(() => {
    let cancelled = false;

    // Only refetch if damId actually changed (not just row object reference)
    if (prevDamIdRef.current === currentDamId && currentDamId != null) {
      return;
    }

    const isInitialFetch = currentDamId != null && !fetchedDamIds.current.has(currentDamId);
    if (currentDamId != null) {
      fetchedDamIds.current.add(currentDamId);
    }
    prevDamIdRef.current = currentDamId ?? null;

    setDamRepro(null);
    setDamLoadError(null);

    if (!currentDamId) return;

    // Tenant header is required by backend for /animals/:id
    if (tenantId == null) {
      setDamLoadError("Missing tenant context in UI (tenantId is null).");
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const include = "repro,last_heat,lastCycle,cycleStartDates";
        const qs = new URLSearchParams({ include });
        const url = `/api/v1/animals/${currentDamId}?${qs.toString()}`;


        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            "x-tenant-id": String(tenantId),
          },
          signal: controller.signal,
        });

        const bodyText = await res.text();

        if (!res.ok) {
          throw new Error(`Dam repro fetch failed: ${res.status} ${bodyText.slice(0, 200)}`);
        }

        const body = bodyText ? JSON.parse(bodyText) : null;
        const data =
          (body as any)?.data?.data ??
          (body as any)?.data ??
          (body as any)?.animal ??
          body ??
          null;


        if (cancelled) return;

        const reproRaw: WhatIfDamReproEvent[] = Array.isArray(data?.repro)
          ? (data.repro as WhatIfDamReproEvent[])
          : [];

        const repro = reproRaw
          .filter((e) => e && (e as any).date)
          .map((e) => {
            const kind =
              (e as any).kind === "cycle_start"
                ? ("heat_start" as WhatIfDamReproEvent["kind"])
                : e.kind;
            const d = asISODateOnly((e as any).date);
            return d ? ({ ...e, kind, date: d } as WhatIfDamReproEvent) : null;
          })
          .filter(Boolean) as WhatIfDamReproEvent[];

        const cycleStartDates: string[] = Array.isArray(data?.cycleStartDates)
          ? (data.cycleStartDates as any[])
            .map((d) => asISODateOnly(d))
            .filter(Boolean)
            .sort()
          : [];

        const lastCycle: string | null = asISODateOnly(
          data?.lastCycle ?? data?.last_cycle ?? null
        );

        let last_heat: string | null = asISODateOnly(
          data?.last_heat ?? data?.lastHeat ?? null
        );

        if (!last_heat && repro.length) {
          const heats = repro
            .filter((e) => e.kind === "heat_start" && e.date)
            .map((e) => asISODateOnly(e.date))
            .filter(Boolean)
            .sort();
          last_heat = heats.length ? heats[heats.length - 1] : null;
        }

        if (!last_heat && lastCycle) last_heat = lastCycle;
        if (!last_heat && cycleStartDates.length) last_heat = cycleStartDates[cycleStartDates.length - 1] ?? null;

        setDamRepro({
          repro,
          last_heat,
          ...(lastCycle != null ? ({ lastCycle } as any) : {}),
          ...(cycleStartDates.length ? ({ cycleStartDates } as any) : {}),
        });

        // Update the row's femaleCycleLenOverrideDays with fresh data from server
        // This ensures we always use the latest override value when recalculating projected cycles
        const freshOverride = data?.femaleCycleLenOverrideDays ?? null;
        if (freshOverride !== liveOverride) {
          setLiveOverride(freshOverride);
          // NEVER call setDraft from animal fetch - the override is already in the row
          // and calling setDraft here causes spurious "unsaved changes" warnings
        }
      } catch (e: any) {
        if (!cancelled) {
          setDamLoadError(e?.message || "Unable to load cycle history for this female.");
          setDamRepro(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentDamId, tenantId, refreshTrigger]);

  // ===== Auto-recalculate expected dates when override changes for locked plans =====
  const prevOverrideRef = React.useRef<number | null | undefined>(undefined);
  const isRecalculating = React.useRef(false);
  const hasMountedRef = React.useRef(false);
  const lastRecalcTimestamp = React.useRef<number>(0);

  React.useEffect(() => {
    const isLocked = Boolean((row.lockedCycleStart ?? "").toString().trim());
    const overrideChanged = prevOverrideRef.current !== liveOverride;

    // Prevent infinite loop: don't recalculate if we just did one within the last 2 seconds
    const now = Date.now();
    const timeSinceLastRecalc = now - lastRecalcTimestamp.current;
    const tooSoon = timeSinceLastRecalc < 2000;

    // Only recalculate if:
    // 1. Override actually changed
    // 2. Cycle is locked
    // 3. Not currently in a recalculation
    // 4. Component has mounted at least once (skip initial mount)
    // 5. Hasn't been recalculated in the last 2 seconds (prevents loop from refetch)
    if (isLocked && overrideChanged && !isRecalculating.current && hasMountedRef.current && !tooSoon) {
      isRecalculating.current = true;
      lastRecalcTimestamp.current = now;
      recalculateExpectedDates().finally(() => {
        isRecalculating.current = false;
      });
    }

    prevOverrideRef.current = liveOverride;
    hasMountedRef.current = true;
  }, [liveOverride]);

  // ===== Cycle math + projections =====
  const speciesWire = normalizeSpeciesWire(row.species);

  const cycleStartsAsc = React.useMemo(() => {
    const dates: string[] = [];

    const push = (v: any) => {
      const iso = asISODateOnly(v);
      if (iso) dates.push(iso);
    };

    // cycleStartDates from DB payload
    if (Array.isArray((damRepro as any)?.cycleStartDates)) {
      for (const d of (damRepro as any).cycleStartDates) push(d);
    }

    // last_heat, lastHeat, lastCycle
    push((damRepro as any)?.last_heat);
    push((damRepro as any)?.lastHeat);
    push((damRepro as any)?.lastCycle);

    // repro events
    if (Array.isArray(damRepro?.repro)) {
      for (const e of damRepro.repro) {
        if (e?.kind === "heat_start") push(e.date);
      }
    }

    return reproEngine.normalizeCycleStartsAsc(dates);
  }, [damRepro]);

  const projectedCycles = React.useMemo<string[]>(() => {
    const today =
      asISODateOnly(new Date()) ?? new Date().toISOString().slice(0, 10);

    if (!speciesWire) return [];

    const summary: ReproSummary = {
      species: speciesWire,
      cycleStartsAsc,
      dob: null,
      today,
      femaleCycleLenOverrideDays: liveOverride,
    };

    const { projected } = reproEngine.projectUpcomingCycleStarts(summary, {
      horizonMonths: 36,
      maxCount: 12,
    });

    return projected
      .map((p: any) => asISODateOnly(p?.date) ?? String(p?.date ?? "").slice(0, 10))
      .filter((d: any) => !!d);
  }, [speciesWire, cycleStartsAsc, liveOverride, damRepro]);

  const initialCycle = (row.lockedCycleStart ?? row.expectedCycleStart ?? row.cycleStartDateActual ?? null) as string | null;
  const [pendingCycle, setPendingCycle] = React.useState<string | null>(initialCycle);
  const [lockedPreview, setLockedPreview] = React.useState<boolean>(Boolean(row.lockedCycleStart ?? row.cycleStartDateActual));
  const [expectedPreview, setExpectedPreview] = React.useState<PlannerExpected | null>(() =>
    initialCycle ? computeExpectedForPlan({ species: row.species as any, lockedCycleStart: initialCycle }) : null
  );

  React.useEffect(() => {
    const nextCycle = (row.lockedCycleStart ?? row.expectedCycleStart ?? row.cycleStartDateActual ?? null) as string | null;
    setPendingCycle(nextCycle);
    const e = nextCycle
      ? computeExpectedForPlan({ species: row.species as any, lockedCycleStart: nextCycle })
      : null;

    setExpectedPreview(e);
    setLockedPreview(Boolean(row.lockedCycleStart ?? row.cycleStartDateActual));
  }, [row.lockedCycleStart, row.expectedCycleStart, row.cycleStartDateActual, row.species]);
  async function lockCycle() {
    if (isArchived) return; // Prevent cycle locking for archived plans
    if (!pendingCycle || !String(pendingCycle).trim()) return;
    if (!api) return;

    const expectedRaw = computeExpectedForPlan({
      species: row.species as any,
      lockedCycleStart: pendingCycle,
      femaleCycleLenOverrideDays: liveOverride,
    });

    const expected = normalizeExpectedMilestones(expectedRaw, pendingCycle);
    const testingStart =
      expected.hormoneTestingStart ?? pickExpectedTestingStart(expectedRaw, pendingCycle);

    const payload = {
      lockedCycleStart: expected.cycleStart,

      lockedOvulationDate: expected.breedDate,
      lockedDueDate: expected.birthDate,
      lockedPlacementStartDate: expected.placementStart,

      expectedCycleStart: expected.cycleStart,
      expectedHormoneTestingStart: testingStart ?? null,
      expectedBreedDate: expected.breedDate,
      expectedBirthDate: expected.birthDate,
      expectedWeaned: expected.weanedDate,
      expectedPlacementStartDate: expected.placementStart,
      expectedPlacementCompletedDate: expected.placementCompleted,
    };

    setExpectedPreview(expectedRaw as any);
    setLockedPreview(true);
    // Don't use setDraftLive here - we're immediately persisting, not drafting

    try {
      await api.updatePlan(Number(row.id), payload as any);

      await api.createEvent(Number(row.id), {
        type: "CYCLE_LOCKED",
        occurredAt: new Date().toISOString(),
        label: "Cycle locked",
        data: {
          cycleStart: pendingCycle,
          ovulation: expected.breedDate,
          due: expected.birthDate,
          placementStart: expected.placementStart,
          testingStart,
          expectedCycleStart: pendingCycle,
          expectedHormoneTestingStart: testingStart,
          expectedBreedDate: expected.breedDate,
          expectedBirthDate: expected.birthDate,
        },
      });

      // Refresh the row to ensure lockedCycleStart is in the row prop (not just draft)
      const fresh = await api.getPlan(Number(row.id), "parents,org");
      onPlanUpdated?.(row.id, fresh);

      // Update snapshot to match fresh data (prevents false "unsaved changes" prompt)
      // IMPORTANT: Use planToRow to transform fresh data, ensuring consistency with the
      // row prop that will be passed down from the parent after onPlanUpdated.
      // This prevents snapshot mismatch when the rowSnapshotKey effect runs.
      const freshAsRow = planToRow(fresh || { ...row, ...payload });
      const newSnapshot = buildPlanSnapshot(freshAsRow);

      setPersistedSnapshot(newSnapshot);
      persistedSnapshotRef.current = newSnapshot; // Sync update for ref-based checks

      // Clear ALL dirty state since lock operation fully persists
      // This prevents false "unsaved changes" when closing after locking
      draftRef.current = {};
      setDraftTick((t) => t + 1);
      setDraft({});
      setPendingSave(false);
      pendingSaveRef.current = false; // Sync update for ref-based checks
      // Stay in edit mode - user may want to continue editing after locking
    } catch (e: any) {
      console.error("[Breeding] lockCycle persist or audit failed", e);
      setExpectedPreview(null);
      setLockedPreview(false);
      setDraftLive({
        lockedCycleStart: pendingCycle,
        lockedOvulationDate: expected.breedDate,
        lockedDueDate: expected.birthDate,
        lockedPlacementStartDate: expected.placementStart,

        expectedCycleStart: pendingCycle,
        expectedHormoneTestingStart: testingStart ?? null,
        expectedBreedDate: expected.breedDate,
        expectedBirthDate: expected.birthDate,
        expectedWeaned: expected.weanedDate,
        expectedPlacementStartDate: expected.placementStart,
        expectedPlacementCompletedDate: expected.placementCompleted,
      });
    }
  }

  async function recalculateExpectedDates() {
    if (isArchived) return;
    if (!api) return;

    const lockedStart = effective.lockedCycleStart;
    if (!lockedStart || !String(lockedStart).trim()) {
      return; // Can't recalculate if there's no locked cycle
    }

    const expectedRaw = computeExpectedForPlan({
      species: row.species as any,
      lockedCycleStart: lockedStart,
      femaleCycleLenOverrideDays: liveOverride,
    });

    const expected = normalizeExpectedMilestones(expectedRaw, lockedStart);
    const testingStart =
      expected.hormoneTestingStart ?? pickExpectedTestingStart(expectedRaw, lockedStart);

    // Only update EXPECTED dates, NOT locked dates
    const payload = {
      expectedCycleStart: expected.cycleStart,
      expectedHormoneTestingStart: testingStart ?? null,
      expectedBreedDate: expected.breedDate,
      expectedBirthDate: expected.birthDate,
      expectedWeaned: expected.weanedDate,
      expectedPlacementStartDate: expected.placementStart,
      expectedPlacementCompletedDate: expected.placementCompleted,
    };

    try {
      const updated = await api.updatePlan(Number(row.id), payload as any);

      await api.createEvent(Number(row.id), {
        type: "EXPECTED_DATES_RECALCULATED",
        occurredAt: new Date().toISOString(),
        label: "Expected dates recalculated",
        data: {
          reason: "Cycle length override changed",
          femaleCycleLenOverrideDays: liveOverride,
          lockedCycleStart: lockedStart,
          ...expected,
        },
      });

      // Update the parent list and refresh local state without marking as dirty
      if (onPlanUpdated && updated) {
        onPlanUpdated(row.id, updated);
      }

      // Update persisted snapshot to reflect the new saved state
      // IMPORTANT: Use planToRow to transform API data, ensuring consistency with the
      // row prop that will be passed down from the parent after onPlanUpdated.
      const updatedAsRow = planToRow(updated || { ...row, ...payload });
      setPersistedSnapshot(buildPlanSnapshot(updatedAsRow));
    } catch (e) {
      console.error("[Breeding] recalculateExpectedDates failed", e);
    }
  }

  // Recalculate expected dates when actual cycle start is entered
  // This uses the ACTUAL cycle start as the seed instead of the locked/expected cycle start
  // The original expectedCycleStart is preserved, but all other dates are recalculated
  function recalculateExpectedDatesFromActual(actualCycleStart: string | null) {
    console.log("[Breeding] recalculateExpectedDatesFromActual called with:", actualCycleStart);
    if (!actualCycleStart || !String(actualCycleStart).trim()) {
      return null; // No recalculation if no actual date
    }

    const expectedRaw = computeExpectedForPlan({
      species: row.species as any,
      lockedCycleStart: actualCycleStart, // Use actual as seed
      femaleCycleLenOverrideDays: liveOverride,
    });

    console.log("[Breeding] recalculateExpectedDatesFromActual - expectedRaw:", expectedRaw);
    if (!expectedRaw) return null;

    const expected = normalizeExpectedMilestones(expectedRaw, actualCycleStart);
    const testingStart =
      expected.hormoneTestingStart ?? pickExpectedTestingStart(expectedRaw, actualCycleStart);

    // Return the recalculated expected dates (keep original expectedCycleStart)
    return {
      // Don't update expectedCycleStart - keep the original
      expectedHormoneTestingStart: testingStart ?? null,
      expectedBreedDate: expected.breedDate,
      expectedBirthDate: expected.birthDate,
      expectedWeaned: expected.weanedDate,
      expectedPlacementStartDate: expected.placementStart,
      expectedPlacementCompletedDate: expected.placementCompleted,
    };
  }

  async function unlockCycle() {
    if (isArchived) return; // Prevent cycle unlocking for archived plans
    if (!api) return;

    setExpectedPreview(null);
    setLockedPreview(false);

    const payload = {
      lockedCycleStart: null,
      lockedOvulationDate: null,
      lockedDueDate: null,
      lockedPlacementStartDate: null,

      expectedCycleStart: null,
      expectedHormoneTestingStart: null,
      expectedBreedDate: null,
      expectedBirthDate: null,
      expectedWeaned: null,

      expectedPlacementStartDate: null,
      expectedPlacementCompletedDate: null,
    };
    // Don't use setDraftLive here - we're immediately persisting, not drafting

    try {
      await api.updatePlan(Number(row.id), payload as any);

      await api.createEvent(Number(row.id), {
        type: "CYCLE_UNLOCKED",
        occurredAt: new Date().toISOString(),
        label: "Cycle unlocked",
        data: {},
      });

      // Refresh the row to ensure lockedCycleStart is cleared in the row prop (not just draft)
      const fresh = await api.getPlan(Number(row.id), "parents,org");
      onPlanUpdated?.(row.id, fresh);

      // Update snapshot to match fresh data (prevents false "unsaved changes" prompt)
      // IMPORTANT: Use planToRow to transform fresh data, ensuring consistency with the
      // row prop that will be passed down from the parent after onPlanUpdated.
      // This prevents snapshot mismatch when the rowSnapshotKey effect runs.
      const freshAsRow = planToRow(fresh || { ...row, ...payload });
      const newSnapshot = buildPlanSnapshot(freshAsRow);
      setPersistedSnapshot(newSnapshot);
      persistedSnapshotRef.current = newSnapshot; // Sync update for ref-based checks

      // Clear ALL dirty state since unlock operation fully persists
      // This prevents false "unsaved changes" when closing after unlocking
      draftRef.current = {};
      setDraftTick((t) => t + 1);
      setDraft({});
      setPendingSave(false);
      pendingSaveRef.current = false; // Sync update for ref-based checks
      // Stay in edit mode - user may want to continue editing after unlocking
    } catch (e) {
      console.error("[Breeding] unlockCycle persist or audit failed", e);
      const expected = pendingCycle ? computeExpectedForPlan({ species: row.species as any, lockedCycleStart: pendingCycle }) : null;
      setExpectedPreview(expected);
      setLockedPreview(Boolean(pendingCycle));
    }
  }

  const isLocked = Boolean((effective.lockedCycleStart ?? "").toString().trim());


  const canShowExpected = Boolean(expectedPreview);
  const cycleForExpected = asISODateOnly(
    pendingCycle ??
      row.lockedCycleStart ??
      (draftRef.current as any).lockedCycleStart ??
      ""
  );

  const expectedNorm = React.useMemo(
    () =>
      canShowExpected
        ? normalizeExpectedMilestones(expectedPreview, cycleForExpected)
        : null,
    [canShowExpected, expectedPreview, cycleForExpected]
  );

  const expectedCycleStart = expectedNorm?.cycleStart ?? "";
  const expectedTestingStart = expectedNorm?.hormoneTestingStart ?? pickExpectedTestingStart(expectedPreview, cycleForExpected) ?? "";
  const expectedBreed = expectedNorm?.breedDate ?? "";
  const expectedBirth = expectedNorm?.birthDate ?? "";
  const expectedWeaned = expectedNorm?.weanedDate ?? "";
  const expectedPlacementStart = expectedNorm?.placementStart ?? "";
  const expectedGoHomeExtended = expectedNorm?.placementCompleted ?? "";

  const expectedPlacementCompleted = expectedGoHomeExtended;
  const expectedCompleted = expectedPlacementCompleted;

  // Recalculated dates based on ACTUAL cycle start (when available)
  // This shows what the expected dates WOULD BE if we use the actual cycle start as the seed
  const recalculatedDates = React.useMemo(() => {
    const actualCycleStart = effective.cycleStartDateActual;
    console.log("[Breeding] recalculatedDates memo - actualCycleStart:", actualCycleStart, "species:", row.species);
    if (!actualCycleStart || !String(actualCycleStart).trim()) {
      console.log("[Breeding] recalculatedDates - no actual cycle start, returning null");
      return null; // No recalculation if no actual date
    }
    const result = recalculateExpectedDatesFromActual(actualCycleStart);
    console.log("[Breeding] recalculatedDates - result:", result);
    return result;
  }, [effective.cycleStartDateActual, row.species, liveOverride]);

  // Extract individual recalculated values for display
  const recalcTestingStart = recalculatedDates?.expectedHormoneTestingStart ?? "";
  const recalcBreed = recalculatedDates?.expectedBreedDate ?? "";
  const recalcBirth = recalculatedDates?.expectedBirthDate ?? "";
  const recalcWeaned = recalculatedDates?.expectedWeaned ?? "";
  const recalcPlacementStart = recalculatedDates?.expectedPlacementStartDate ?? "";
  const recalcPlacementCompleted = recalculatedDates?.expectedPlacementCompletedDate ?? "";

  const [editDamQuery, setEditDamQuery] = React.useState<string>("");
  const [editSireQuery, setEditSireQuery] = React.useState<string>("");
  const [editDamOptions, setEditDamOptions] = React.useState<AnimalLite[]>([]);
  const [editSireOptions, setEditSireOptions] = React.useState<AnimalLite[]>([]);
  const [editDamFocus, setEditDamFocus] = React.useState(false);
  const [editSireFocus, setEditSireFocus] = React.useState(false);

  const wasEditRef = React.useRef(isEdit);
  React.useEffect(() => {
    const enteringEdit = !wasEditRef.current && isEdit;
    const editingAndRowChanged = isEdit && wasEditRef.current;

    if (enteringEdit || editingAndRowChanged) {
      setEditDamQuery(row.damName || "");
      setEditSireQuery(row.sireName || "");
    }
    wasEditRef.current = isEdit;
  }, [isEdit, row.damName, row.sireName]);

  React.useEffect(() => {
    if (!isEdit || !row.species || !editDamFocus || !tenantId) return;
    let cancelled = false;
    (async () => {
      const key = toWireSpecies(row.species as SpeciesUi);
      const all = await fetchAnimals({
        baseUrl: "/api/v1",
        tenantId,
        q: editDamQuery.trim() || undefined,
        species: key,
        sexHint: "FEMALE",
        limit: 300,
      });
      if (!cancelled) setEditDamOptions(all.filter((a) => a.species === key && a.sex === "FEMALE"));
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editDamFocus, editDamQuery, row.species, tenantId]);

  React.useEffect(() => {
    if (!isEdit || !row.species || !editSireFocus || !tenantId) return;
    let cancelled = false;
    (async () => {
      const key = toWireSpecies(row.species as SpeciesUi);
      const all = await fetchAnimals({
        baseUrl: "/api/v1",
        tenantId,
        q: editSireQuery.trim() || undefined,
        species: key,
        sexHint: "MALE",
        limit: 300,
      });
      if (!cancelled) setEditSireOptions(all.filter((a) => a.species === key && a.sex === "MALE"));
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editSireFocus, editSireQuery, row.species, tenantId]);

  const hasBreed = typeof (effective.breedText ?? "") === "string" && (effective.breedText ?? "").trim().length > 0;
  const canCommit = Boolean(
    editable &&
    effective.damId != null &&
    effective.sireId != null &&
    hasBreed &&
    ((row.lockedCycleStart ?? draftRef.current.lockedCycleStart) ?? "") &&
    !["COMMITTED", "BRED", "BIRTHED", "WEANED", "PLACEMENT_STARTED", "PLACEMENT_COMPLETED", "COMPLETE", "CANCELED"].includes(effective.status)
  );
  const expectedsEnabled = Boolean(cycleForExpected && speciesWire);

  // Build tooltip showing missing conditions for commit
  const commitTooltip = React.useMemo(() => {
    if (isDeleted) return "Deleted plans cannot be committed";
    if (isArchived) return "Archived plans cannot be committed";
    if (canCommit) return "Ready to commit this plan";

    const missing: string[] = [];
    if (!effective.damId) missing.push("• Please Select a Female");
    if (!effective.sireId) missing.push("• Please Select a Sire");
    if (!hasBreed) missing.push("• Please Select a Breed");

    const hasLockedCycle = !!(effective.lockedCycleStart ?? "").toString().trim();
    if (!hasLockedCycle) {
      // Check if there's a pending cycle selection that hasn't been locked yet
      if (pendingCycle) {
        missing.push("• Please Lock the Selected Cycle");
      } else {
        missing.push("• Please Select and Lock the Cycle");
      }
    }

    if (missing.length === 0) return "Cannot commit at this time";

    return "Missing requirements:\n" + missing.join("\n");
  }, [isArchived, canCommit, effective.damId, effective.sireId, effective.lockedCycleStart, hasBreed, pendingCycle]);

  const breedComboKey = `${effective.species || "Dog"}|${hasBreed}`;

  // Wrap requestSave to manage pendingSave state and update snapshot
  const handleSave = React.useCallback(async () => {
    setPendingSave(true);
    try {
      await requestSave();
      // On successful save, clear draft and pending state
      // The useEffect at line 3704 will update the persisted snapshot when the row prop updates
      draftRef.current = {};
      setDraftTick((t) => t + 1);
      setDraft({});
      setPendingSave(false);
      pendingSaveRef.current = false; // Sync update for ref-based checks
    } catch (error) {
      // On error, clear pending but keep isDirty true
      setPendingSave(false);
      throw error;
    }
  }, [requestSave, setDraft]);

  // Wrap close to check for unsaved changes
  const handleClose = React.useCallback(async () => {
    if (hasPendingChangesLocal) {
      const ok = await confirmModal({
        title: "Unsaved Changes",
        message: "You have unsaved changes. Discard and close?",
        confirmText: "Discard",
        cancelText: "Cancel",
        tone: "danger",
      });
      if (!ok) return;

      // User confirmed discard, reset draft
      draftRef.current = {};
      setPendingSave(false);
    }
    close();
  }, [hasPendingChangesLocal, close]);

  const handleCancel = React.useCallback(() => {
    // Clear all draft state to remove "unsaved changes" indicator
    draftRef.current = {};
    setDraftTick((t) => t + 1);
    setDraft({});
    setPendingSave(false);
    setMode("view");
  }, [setDraft, setMode]);

  type ViewMode = "list" | "calendar" | "timeline";
  const [view, setView] = React.useState<ViewMode>("list");

  return (
    <DetailsScaffold
      title={row.name}
      subtitle=""
      mode={mode}
      onEdit={editable ? () => setMode("edit") : undefined}
      onCancel={handleCancel}
      onSave={handleSave}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={handleClose}
      hasPendingChanges={hasPendingChangesLocal}
      hideCloseButton
      rightActions={undefined}
      tabsRightContent={
        mode === "edit" && (
          <Popover open={overflowMenuOpen} onOpenChange={setOverflowMenuOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-secondary text-xs"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
                <span>More</span>
              </button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-48 p-1">
              {/* Uncommit - only for COMMITTED plans */}
              {row.status === "COMMITTED" && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded disabled:opacity-50"
                  disabled={uncommitting}
                  onClick={async () => {
                    setOverflowMenuOpen(false);
                    if (!api || uncommitting) return;

                    setUncommitting(true);
                    try {
                      const actorId =
                        (utils as any)?.session?.currentUserId?.() ??
                        (utils as any)?.currentUser?.id ??
                        "ui";

                      await (api as any).uncommitPlan(Number(row.id), { actorId });

                      // Refresh the plan
                      const fresh = await api.getPlan(Number(row.id), "parents,org");
                      if (onPlanUpdated) {
                        onPlanUpdated(row.id, fresh);
                      }
                    } catch (e: any) {
                      // Handle 409 Conflict with blockers
                      if (e?.status === 409 || e?.payload?.blockers) {
                        const blockers = e?.payload?.blockers || {};
                        const blockerList: string[] = [];

                        if (blockers.hasOffspring) blockerList.push("Offspring exist in the linked group");
                        if (blockers.hasBuyers) blockerList.push("Buyers are assigned");
                        if (blockers.hasInvoices) blockerList.push("Invoices exist");
                        if (blockers.hasDocuments) blockerList.push("Documents or contracts are attached");
                        if (blockers.hasContracts) blockerList.push("Contracts are linked");
                        if (blockers.other && Array.isArray(blockers.other)) {
                          blockerList.push(...blockers.other);
                        }

                        // Show info-only dialog with blockers
                        await infoModal({
                          title: "Cannot uncommit this plan",
                          message: blockerList.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {blockerList.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                          ) : "This plan cannot be uncommitted at this time.",
                        });
                      } else {
                        console.error("[Breeding] uncommit failed", e);
                      }
                    } finally {
                      setUncommitting(false);
                    }
                  }}
                >
                  <Undo2 className="h-4 w-4" />
                  {uncommitting ? "Uncommitting..." : "Uncommit"}
                </button>
              )}
              {/* Archive / Unarchive */}
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded"
                onClick={async () => {
                  setOverflowMenuOpen(false);
                  if (!onArchive) return;
                  const next = !row.archived;
                  const ok = await confirmModal({
                    title: next ? "Archive plan?" : "Restore plan?",
                    message: next
                      ? "This plan will be hidden from your default views. You can restore it later."
                      : "This plan will reappear in your lists.",
                    confirmText: next ? "Archive" : "Restore",
                    cancelText: "Cancel",
                    tone: next ? "danger" : "default",
                  });
                  if (!ok) return;

                  try {
                    await onArchive(row.id, next);
                  } catch (e) {
                    console.error("[Breeding] archive toggle failed", e);
                  }
                }}
              >
                <Archive className="h-4 w-4" />
                {row.archived ? "Unarchive" : "Archive"}
              </button>
              {/* Delete */}
              {!isDeleted && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded"
                  onClick={async () => {
                    setOverflowMenuOpen(false);
                    if (!onDelete) return;
                    const ok = await confirmModal({
                      title: "Delete this plan?",
                      message: "This will soft delete the plan and any linked Offspring Group. This action can only be undone by an admin.",
                      confirmText: "Delete",
                      cancelText: "Cancel",
                      tone: "danger",
                    });
                    if (!ok) return;

                    try {
                      await onDelete(row.id);
                      closeDrawer();
                    } catch (e) {
                      console.error("[Breeding] delete failed", e);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </Popover.Content>
          </Popover>
        )
      }
    >
      <div className="relative overflow-x-hidden" data-bhq-details>
        {/* DELETED READ-ONLY BANNER */}
        {isDeleted && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <div className="text-sm text-red-400">
              This plan is deleted and read-only. It can only be restored by an admin.
            </div>
          </div>
        )}
        {/* ARCHIVED READ-ONLY BANNER */}
        {isArchived && !isDeleted && (
          <div className="mb-4 p-3 bg-secondary/10 border border-hairline rounded-md">
            <div className="text-sm text-secondary">
              This plan is archived and read-only.
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-4 mt-2">
            {/* Plan Journey - Phase timeline and guidance */}
            <PlanJourney
              status={row.status}
              hasPlanName={Boolean(effective.name)}
              hasSpecies={Boolean(effective.species)}
              hasDam={Boolean(effective.damId)}
              hasSire={Boolean(effective.sireId)}
              hasBreed={Boolean(effective.breedText)}
              hasLockedCycle={Boolean(effective.lockedCycleStart)}
              hasActualCycleStart={Boolean(effective.cycleStartDateActual)}
              hasActualBreedDate={Boolean(effective.breedDateActual)}
              hasActualBirthDate={Boolean(effective.birthDateActual)}
              hasActualWeanedDate={Boolean(effective.weanedDateActual)}
              hasPlacementStarted={Boolean(effective.placementStartDateActual)}
              hasPlacementCompleted={Boolean(effective.placementCompletedDateActual)}
              actualCycleStartDate={effective.cycleStartDateActual}
              actualHormoneTestingStartDate={effective.hormoneTestingStartDateActual}
              actualBreedDate={effective.breedDateActual}
              actualBirthDate={effective.birthDateActual}
              actualWeanedDate={effective.weanedDateActual}
              actualPlacementStartDate={effective.placementStartDateActual}
              actualPlacementCompletedDate={effective.placementCompletedDateActual}
              expectedCycleStartDate={expectedCycleStart}
              expectedHormoneTestingStartDate={expectedTestingStart}
              expectedBreedDate={expectedBreed}
              expectedBirthDate={expectedBirth}
              expectedWeanedDate={expectedWeaned}
              expectedPlacementStartDate={expectedPlacementStart}
              expectedPlacementCompletedDate={expectedPlacementCompleted}
              onDateChange={(field, value) => {
                if (!isEdit) return;
                if (field === "actualCycleStartDate") {
                  setDraftLive({ cycleStartDateActual: value });
                } else if (field === "actualHormoneTestingStartDate") {
                  setDraftLive({ hormoneTestingStartDateActual: value });
                } else if (field === "actualBreedDate") {
                  setDraftLive({ breedDateActual: value });
                } else if (field === "actualBirthDate") {
                  setDraftLive({ birthDateActual: value });
                } else if (field === "actualWeanedDate") {
                  setDraftLive({ weanedDateActual: value });
                } else if (field === "actualPlacementStartDate") {
                  setDraftLive({ placementStartDateActual: value });
                } else if (field === "actualPlacementCompletedDate") {
                  setDraftLive({ placementCompletedDateActual: value });
                }
              }}
              onNavigateToTab={(tab) => setActiveTab(tab as typeof activeTab)}
              onAdvancePhase={async (toPhase) => {
                if (!api || !isEdit) return;
                try {
                  // Translate frontend status to backend status
                  const backendStatus = toBackendStatus(toPhase);
                  console.log("[Breeding] Advancing to phase:", toPhase, "-> backend:", backendStatus, "for plan:", row.id);

                  // Include any pending draft changes along with the status update
                  // This ensures dates entered before clicking "Advance" are saved
                  const currentDraft = draftRef.current;
                  const payload: Record<string, unknown> = { status: backendStatus };

                  // Map draft fields to API field names
                  if (currentDraft.cycleStartDateActual !== undefined) {
                    payload.cycleStartDateActual = currentDraft.cycleStartDateActual;
                  }
                  if (currentDraft.hormoneTestingStartDateActual !== undefined) {
                    payload.hormoneTestingStartDateActual = currentDraft.hormoneTestingStartDateActual;
                  }
                  if (currentDraft.breedDateActual !== undefined) {
                    payload.breedDateActual = currentDraft.breedDateActual;
                  }
                  if (currentDraft.birthDateActual !== undefined) {
                    payload.birthDateActual = currentDraft.birthDateActual;
                  }
                  if (currentDraft.weanedDateActual !== undefined) {
                    payload.weanedDateActual = currentDraft.weanedDateActual;
                  }
                  if (currentDraft.placementStartDateActual !== undefined) {
                    payload.placementStartDateActual = currentDraft.placementStartDateActual;
                  }
                  if (currentDraft.placementCompletedDateActual !== undefined) {
                    payload.placementCompletedDateActual = currentDraft.placementCompletedDateActual;
                  }

                  // VALIDATION: Ensure required date is present before advancing
                  // Merge current row data with draft to get effective values
                  const effectiveCycleStart = payload.cycleStartDateActual ?? row.cycleStartDateActual;
                  const effectiveBreedDate = payload.breedDateActual ?? row.breedDateActual;
                  const effectiveBirthDate = payload.birthDateActual ?? row.birthDateActual;
                  const effectiveWeanedDate = payload.weanedDateActual ?? row.weanedDateActual;
                  const effectivePlacementStart = payload.placementStartDateActual ?? row.placementStartDateActual;
                  const effectivePlacementCompleted = payload.placementCompletedDateActual ?? row.placementCompletedDateActual;

                  const validationErrors: string[] = [];
                  if (toPhase === "BRED" && !effectiveCycleStart) {
                    validationErrors.push("Cycle Start (Actual) date is required to advance to Breeding phase");
                  }
                  if (toPhase === "BIRTHED" && !effectiveBreedDate) {
                    validationErrors.push("Breed Date (Actual) is required to advance to Birth phase");
                  }
                  if (toPhase === "WEANED" && !effectiveBirthDate) {
                    validationErrors.push("Birth Date (Actual) is required to advance to Weaned phase");
                  }
                  if (toPhase === "PLACEMENT_STARTED" && !effectiveWeanedDate) {
                    validationErrors.push("Weaned Date (Actual) is required to advance to Placement Started phase");
                  }
                  if (toPhase === "PLACEMENT_COMPLETED" && !effectivePlacementStart) {
                    validationErrors.push("Placement Start Date is required to advance to Placement Completed phase");
                  }
                  if (toPhase === "COMPLETE" && !effectivePlacementCompleted) {
                    validationErrors.push("Placement Completed Date is required to mark plan as Complete");
                  }

                  if (validationErrors.length > 0) {
                    console.error("[Breeding] Validation failed:", validationErrors);
                    alert(validationErrors.join("\n"));
                    return;
                  }

                  // Backend requires all milestone dates up to the target phase
                  // Include them in the payload even if they weren't just edited
                  if (toPhase === "PLACEMENT_COMPLETED" || toPhase === "COMPLETE") {
                    // Ensure all dates through placement are included
                    if (effectiveCycleStart) payload.cycleStartDateActual = effectiveCycleStart;
                    if (effectiveBreedDate) payload.breedDateActual = effectiveBreedDate;
                    if (effectiveBirthDate) payload.birthDateActual = effectiveBirthDate;
                    if (effectiveWeanedDate) payload.weanedDateActual = effectiveWeanedDate;
                    if (effectivePlacementStart) payload.placementStartDateActual = effectivePlacementStart;
                  }
                  if (toPhase === "COMPLETE") {
                    if (effectivePlacementCompleted) payload.placementCompletedDateActual = effectivePlacementCompleted;
                  }

                  console.log("[Breeding] Advance phase payload:", payload);
                  await api.updatePlan(Number(row.id), payload as any);

                  // Clear the draft since we just saved
                  draftRef.current = {};

                  const fresh = await api.getPlan(Number(row.id), "parents,org");
                  onPlanUpdated?.(row.id, fresh);

                  // Exit edit mode after successful advancement
                  setMode("view");
                } catch (err) {
                  console.error("[Breeding] advance phase failed", err);
                }
              }}
              isEdit={isEdit}
              guidanceCollapsed={guidanceCollapsed}
              onToggleGuidance={setGuidanceCollapsed}
              confirmModal={confirmModal}
            />

            {/* Plan Info */}
            <SectionCard title="Plan Info">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Plan Name <span className="text-red-500">*</span></div>
                  {isEdit ? (
                    <Input
                      defaultValue={row.name}
                      onChange={(e) => setDraftLive({ name: e.currentTarget.value })}
                      disabled={!editable}
                      style={{ height: 42, minHeight: 42 }}
                    />
                  ) : (
                    <DisplayValue value={row.name} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Nickname</div>
                  {isEdit ? (
                    <Input
                      defaultValue={row.nickname ?? ""}
                      onChange={(e) => setDraftLive({ nickname: e.currentTarget.value })}
                      disabled={!editable}
                      style={{ height: 42, minHeight: 42 }}
                    />
                  ) : (
                    <DisplayValue value={row.nickname ?? ""} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Plan Code</div>
                  <DisplayValue value={row.code ?? ""} />
                </div>
              </div>

              {/* Species + Breed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="min-w-0 sm:col-span-1">
                  <div className="text-xs text-secondary mb-1">Species <span className="text-red-500">*</span></div>
                  {isEdit ? (
                    <select
                      className={`w-full h-[42px] rounded-md border bg-card px-2 text-sm text-primary ${
                        isEdit && !effective.species
                          ? "border-amber-500/60 ring-1 ring-amber-500/20"
                          : "border-[#4b5563]"
                      }`}
                      style={{ height: 42, minHeight: 42 }}
                      value={effective.species || ""}
                      disabled={!editable}
                      onChange={async (e) => {
                        const next = e.currentTarget.value as SpeciesUi;
                        const willClear = Boolean(
                          (effective.damId ?? null) ||
                          (effective.sireId ?? null) ||
                          (effective.breedText ?? "")
                        );
                        if (willClear) {
                          const ok = await confirmModal({
                            title: "Change species?",
                            message:
                              "Changing species will clear Dam, Sire, and Breed. Continue?",
                            confirmText: "Yes, reset",
                            cancelText: "Cancel",
                          });
                          if (!ok) return;
                        }
                        setDraftLive({
                          species: next as any,
                          breedText: "",
                          damId: null,
                          damName: "" as any,
                          sireId: null,
                          sireName: "" as any,
                        });
                      }}
                    >
                      <option value="">—</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Horse">Horse</option>
                    </select>
                  ) : (
                    <DisplayValue value={row.species || ""} required />
                  )}
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <div className="text-xs text-secondary mb-1">Breed <span className="text-red-500">*</span></div>
                  {isEdit && !coreFieldsLocked ? (
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 min-w-0 rounded-md ${
                        isEdit && !hasBreed
                          ? "[&_input]:border-amber-500/60 [&_input]:ring-1 [&_input]:ring-amber-500/20"
                          : ""
                      }`}>
                        <BreedCombo
                          key={breedComboKey}
                          orgId={orgIdForBreeds ?? undefined}
                          species={(effective.species || "Dog") as SpeciesUi}
                          value={
                            hasBreed
                              ? ({
                                id: "current",
                                name: (effective.breedText ?? "").trim(),
                                species: effective.species || "Dog",
                                source: "canonical",
                              } as any)
                              : null
                          }
                          onChange={(hit: any) =>
                            setDraftLive({ breedText: hit?.name ?? "" })
                          }
                          api={breedBrowseApi}
                        />
                      </div>

                      {hasBreed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDraftLive({ breedText: "" })}
                          disabled={!editable}
                        >
                          Clear
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openCustomBreed(
                            (effective.species || "Dog") as SpeciesUi,
                            (name) => setDraftLive({ breedText: name || "" })
                          )
                        }
                        disabled={!editable}
                      >
                        New custom
                      </Button>
                    </div>
                  ) : (
                    <DisplayValue value={row.breedText || ""} required />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Parents */}
            <SectionCard title="Parents">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Dam <span className="text-red-500">*</span></div>
                  {!isEdit ? (
                    <DisplayValue value={row.damName || ""} required />
                  ) : coreFieldsLocked ? (
                    <DisplayValue value={row.damName || ""} required />
                  ) : (
                    <>
                      <div className="relative">
                        <Input
                          value={editDamQuery}
                          onChange={(e) => setEditDamQuery(e.currentTarget.value)}
                          onFocus={() => {
                            setEditDamFocus(true);
                            if (
                              editDamQuery.trim() === (row.damName || "").trim()
                            ) {
                              setEditDamQuery("");
                            }
                          }}
                          onBlur={() => setEditDamFocus(false)}
                          placeholder="Search Dam…"
                          disabled={!editable}
                          className={isEdit && !effective.damId ? "!border-amber-500/60 ring-1 ring-amber-500/20" : ""}
                          style={{ height: 42, minHeight: 42 }}
                        />
                        {effective.damId && (
                          <button
                            type="button"
                            onClick={() => {
                              setDraftLive({ damId: null, damName: "" });
                              setEditDamQuery("");
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                            title="Clear Dam"
                            disabled={!editable}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {editDamFocus && (
                        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                          {editDamOptions.length > 0 ? (
                            editDamOptions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setDraftLive({
                                    damId: a.id,
                                    damName: a.name,
                                  });
                                  setEditDamQuery(a.name);
                                  setEditDamFocus(false);
                                }}
                                className={`w-full px-2 py-1 text-left hover:bg-white/5 ${row.damId === a.id ? "bg-white/10" : ""
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{a.name}</span>
                                  {a.organization?.name ? (
                                    <span className="text-xs text-secondary ml-2">
                                      ({a.organization.name})
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-2 py-2 text-sm text-secondary">
                              No females found
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Sire <span className="text-red-500">*</span></div>
                  {!isEdit ? (
                    <DisplayValue value={row.sireName || ""} required />
                  ) : coreFieldsLocked ? (
                    <DisplayValue value={row.sireName || ""} required />
                  ) : (
                    <>
                      <div className="relative">
                        <Input
                          value={editSireQuery}
                          onChange={(e) => setEditSireQuery(e.currentTarget.value)}
                          onFocus={() => {
                            setEditSireFocus(true);
                            if (
                              editSireQuery.trim &&
                              editSireQuery.trim() ===
                              (row.sireName || "").trim()
                            ) {
                              setEditSireQuery("");
                            }
                          }}
                          onBlur={() => setEditSireFocus(false)}
                          placeholder="Search Sire…"
                          disabled={!editable}
                          className={isEdit && !effective.sireId ? "!border-amber-500/60 ring-1 ring-amber-500/20" : ""}
                          style={{ height: 42, minHeight: 42 }}
                        />
                        {effective.sireId && (
                          <button
                            type="button"
                            onClick={() => {
                              setDraftLive({ sireId: null, sireName: "" });
                              setEditSireQuery("");
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                            title="Clear Sire"
                            disabled={!editable}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {editSireFocus && (
                        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                          {editSireOptions.length > 0 ? (
                            editSireOptions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setDraftLive({
                                    sireId: a.id,
                                    sireName: a.name,
                                  });
                                  setEditSireQuery(a.name);
                                  setEditSireFocus(false);
                                }}
                                className={`w-full px-2 py-1 text-left hover:bg-white/5 ${row.sireId === a.id ? "bg-white/10" : ""
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{a.name}</span>
                                  {a.organization?.name ? (
                                    <span className="text-xs text-secondary ml-2">
                                      ({a.organization.name})
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-2 py-2 text-sm text-secondary">
                              No males found
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Next Milestone Summary - show context-aware next milestone based on status */}
            {/* Only show when cycle has started (cycleStartDateActual entered) - not when Breeding Cycle Selection is visible */}
            {/* Use recalculated dates when available (based on actual cycle start), otherwise fall back to original expected */}
            {committedOrLater && expectedsEnabled && effective.cycleStartDateActual && (() => {
              const status = (row.status || "").toUpperCase();
              let milestoneLabel = "";
              let milestoneDate = "";
              let milestoneIcon = "🏠";

              // When actual cycle start is entered, use recalculated dates for accurate "days away"
              // Fall back to original expected dates if recalculation not available
              const useRecalc = Boolean(recalculatedDates);
              const breed = useRecalc ? recalcBreed : expectedBreed;
              const birth = useRecalc ? recalcBirth : expectedBirth;
              const weaned = useRecalc ? recalcWeaned : expectedWeaned;
              const placementStart = useRecalc ? recalcPlacementStart : expectedPlacementStart;
              const placementCompleted = useRecalc ? recalcPlacementCompleted : expectedPlacementCompleted;

              if (status === "COMMITTED") {
                milestoneLabel = "Breeding Window";
                milestoneDate = breed;
                milestoneIcon = "💕";
              } else if (status === "BRED") {
                milestoneLabel = "Expected Birth";
                milestoneDate = birth;
                milestoneIcon = "🐣";
              } else if (status === "BIRTHED") {
                milestoneLabel = "Weaning Completed";
                milestoneDate = weaned;
                milestoneIcon = "🍼";
              } else if (status === "WEANED") {
                milestoneLabel = "Placement Begins";
                milestoneDate = placementStart;
                milestoneIcon = "🏠";
              } else if (status === "PLACEMENT_STARTED") {
                milestoneLabel = "Placement Completed";
                milestoneDate = placementCompleted;
                milestoneIcon = "✅";
              }

              if (!milestoneLabel || !milestoneDate) return null;

              // Calculate days away
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const target = new Date(milestoneDate + "T00:00:00");
              const diffTime = target.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const daysText = diffDays === 0 ? "Today" : diffDays === 1 ? "1 day" : diffDays > 0 ? `${diffDays} days` : `${Math.abs(diffDays)} days ago`;
              const isPast = diffDays < 0;

              return (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-primary mb-2">Next Milestone</div>
                  <div className="relative rounded-lg bg-emerald-950/60 border border-emerald-600/30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      {/* Icon + Label + Date */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/40 flex items-center justify-center text-xl">
                          {milestoneIcon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-emerald-400">{milestoneLabel}</div>
                          <div className="text-sm text-secondary">
                            {fmt(milestoneDate)} — <span className={isPast ? "text-red-400" : "text-emerald-400"}>{daysText} {isPast ? "" : "away"}</span>
                          </div>
                        </div>
                      </div>
                      {/* Days badge */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-emerald-500/50 bg-emerald-950/80">
                        <div className={`text-2xl font-bold ${isPast ? "text-red-400" : "text-emerald-400"}`}>{Math.abs(diffDays)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-emerald-500/80">Days</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Cycle Selection - only show for PLANNING/COMMITTED before cycle starts */}
            {/* Highlight when in EDIT mode, PLANNING phase, and cycle not locked */}
            {!effective.cycleStartDateActual && (statusU === "PLANNING" || statusU === "COMMITTED") && (
            <SectionCard title={(isLocked || lockedPreview) ? <span className="text-green-400">Cycle Start Date (Estimated) — Locked!</span> : "Breeding Cycle Selection"} highlight={isEdit && statusU === "PLANNING" && !(isLocked || lockedPreview)} highlightGreen={isLocked || lockedPreview}>
              {/* Simple compact cycle selector - matches original design */}
              {/* Red border + glow when in view mode and no cycle selected */}
              {/* Yellow border + glow when in view mode and cycle selected but not locked */}
              {/* Yellow border + glow when in edit mode "Ready to Lock" state */}
              {/* Green border when locked */}
              <div className={`relative rounded-xl bg-[#1e1e1e] overflow-hidden ${
                !isEdit && !(isLocked || lockedPreview) && !pendingCycle
                  ? "border-2 border-red-500/60 ring-2 ring-red-500/20"
                  : !isEdit && !(isLocked || lockedPreview) && pendingCycle
                    ? "border-2 border-yellow-500/60 ring-2 ring-yellow-500/20 box-glow-pulse-yellow"
                    : isEdit && !(isLocked || lockedPreview) && pendingCycle
                      ? "border-2 border-yellow-500/60 box-glow-pulse-yellow"
                      : (isLocked || lockedPreview)
                        ? "border-2 border-green-500/60"
                        : ""
              }`}>
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Lock icon button - orange in edit mode with pulse, gray in view mode */}
                  {/* Clicking locks the cycle (when unlocked) or unlocks it (when locked) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEdit) return;
                      if (isLocked) {
                        unlockCycle();
                      } else if (pendingCycle && effective.damId) {
                        lockCycle();
                      }
                    }}
                    disabled={!isEdit || (!isLocked && (!pendingCycle || !effective.damId))}
                    title={isLocked ? "Click to unlock cycle" : (pendingCycle && effective.damId ? "Click to lock cycle" : "Select a dam and cycle first")}
                    style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
                    className={`rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      (isLocked || lockedPreview)
                        ? isEdit
                          ? "bg-green-600 hover:bg-green-500 cursor-pointer"
                          : "bg-green-600 cursor-default"
                        : isEdit && pendingCycle
                          ? "bg-yellow-500 hover:bg-yellow-400 hover:scale-105 cursor-pointer glow-pulse-green"
                          : isEdit
                            ? "bg-[hsl(var(--brand-orange))] hover:scale-105 cursor-pointer glow-pulse-orange"
                            : pendingCycle
                              ? "bg-yellow-500 cursor-default glow-pulse-yellow"
                              : "bg-red-500 cursor-default glow-pulse-red"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {(isLocked || lockedPreview) ? (
                        <>
                          <rect x="5" y="10" width="14" height="10" rx="2" />
                          <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                        </>
                      ) : (
                        <>
                          <rect x="5" y="10" width="14" height="10" rx="2" />
                          <path d="M7 10V7a5 5 0 0 1 9.9-1" />
                        </>
                      )}
                    </svg>
                  </button>

                  {/* Content - view mode shows simple text, edit mode shows label + dropdown */}
                  {isEdit ? (
                    <>
                      {/* Edit mode: label text + dropdown */}
                      {isLocked ? (
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-400">
                            This breeding plan is estimated to begin on {fmt(effective.lockedCycleStart)}
                          </div>
                          <div className="text-xs text-secondary">
                            If you need to change this, click the lock icon to unlock the cycle.
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-shrink-0">
                            {pendingCycle ? (
                              <>
                                <div className="text-sm font-medium text-green-400">Ready to Lock!</div>
                                <div className="text-xs text-secondary">{fmt(pendingCycle)}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-[hsl(var(--brand-orange))]">Select a Cycle</div>
                                <div className="text-xs text-secondary">Choose from dropdown</div>
                              </>
                            )}
                          </div>
                          <div className="flex-1">
                            {(() => {
                              const lastRecordedCycle = cycleStartsAsc.length > 0 ? cycleStartsAsc[cycleStartsAsc.length - 1] : null;
                              const options = [...projectedCycles]
                                .map((d) => asISODateOnly(d) ?? String(d).slice(0, 10))
                                .filter(Boolean) as string[];
                              if (lastRecordedCycle && !options.includes(lastRecordedCycle)) {
                                options.unshift(lastRecordedCycle);
                              }
                              if (pendingCycle && !options.includes(pendingCycle)) {
                                options.unshift(pendingCycle);
                              }
                              const hasDam = !!effective.damId;
                              const hasOptions = options.length > 0;
                              const hasCycleSelected = !!pendingCycle;

                              return (
                                <select
                                  className={`w-full h-10 rounded-lg px-3 text-sm text-primary bg-[#3d3d3d] focus:outline-none focus:ring-2 ${
                                    hasCycleSelected
                                      ? "border-2 border-green-500 focus:ring-green-500/50"
                                      : "border-0 focus:ring-[hsl(var(--brand-orange))]/50"
                                  }`}
                                  value={pendingCycle ?? ""}
                                  onChange={(e) => {
                                    if (!isEdit) return;
                                    const v = e.currentTarget.value || "";
                                    const next = v ? (asISODateOnly(v) ?? v.slice(0, 10)) : null;
                                    setPendingCycle(next);
                                    setExpectedPreview(
                                      next
                                        ? computeExpectedForPlan({ species: row.species as any, lockedCycleStart: next })
                                        : null
                                    );
                                    // Update both draft systems so Save button appears
                                    setDraft({ expectedCycleStart: next });
                                    setDraftLive({ expectedCycleStart: next });
                                  }}
                                  disabled={!hasDam || !editable}
                                >
                                  <option value="">
                                    {!hasDam
                                      ? "Select a Dam to view cycles"
                                      : hasOptions
                                        ? "Select cycle..."
                                        : "No projected cycles found"}
                                  </option>
                                  {options.map((d) => (
                                    <option key={d} value={d}>
                                      {fmt(d)}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    /* View mode: simple text display */
                    <div className="flex-1">
                      {(isLocked || lockedPreview) ? (
                        <>
                          <div className="text-sm font-medium text-green-400">
                            This breeding plan is estimated to begin on {fmt(effective.lockedCycleStart || pendingCycle)}
                          </div>
                          <div className="text-xs text-secondary">
                            If you need to change this, enter edit mode and unlock the cycle.
                          </div>
                        </>
                      ) : pendingCycle ? (
                        <>
                          <div className="text-sm font-medium text-amber-400">
                            Cycle selected: {fmt(pendingCycle)} — not yet locked
                          </div>
                          <div className="text-xs text-secondary">
                            Enter edit mode and click the lock icon to lock this cycle.
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-red-400">No Cycle Selected</div>
                          <div className="text-xs text-secondary">Click Edit to change</div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {!!damLoadError && (
                  <div className="text-xs text-red-600 px-4 pb-2">
                    {damLoadError}
                  </div>
                )}
              </div>
            </SectionCard>
            )}

            {/* Glow pulse animation for lock button */}
            <style>{`
              @keyframes glow-pulse-anim {
                0%, 100% { box-shadow: 0 0 8px 2px hsl(var(--brand-orange) / 0.6); }
                50% { box-shadow: 0 0 16px 6px hsl(var(--brand-orange) / 0.8); }
              }
              .glow-pulse-orange {
                animation: glow-pulse-anim 2s ease-in-out infinite;
              }
              @keyframes glow-pulse-yellow-anim {
                0%, 100% { box-shadow: 0 0 8px 2px rgba(234, 179, 8, 0.6); }
                50% { box-shadow: 0 0 16px 6px rgba(234, 179, 8, 0.8); }
              }
              .glow-pulse-yellow {
                animation: glow-pulse-yellow-anim 2s ease-in-out infinite;
              }
              @keyframes glow-pulse-red-anim {
                0%, 100% { box-shadow: 0 0 8px 2px rgba(239, 68, 68, 0.5); }
                50% { box-shadow: 0 0 14px 4px rgba(239, 68, 68, 0.7); }
              }
              .glow-pulse-red {
                animation: glow-pulse-red-anim 2.5s ease-in-out infinite;
              }
              @keyframes box-glow-pulse-green-anim {
                0%, 100% { box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.4); }
                50% { box-shadow: 0 0 16px 6px rgba(34, 197, 94, 0.6); }
              }
              .box-glow-pulse-green {
                animation: box-glow-pulse-green-anim 2s ease-in-out infinite;
              }
              @keyframes glow-pulse-green-anim {
                0%, 100% { box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.6); }
                50% { box-shadow: 0 0 16px 6px rgba(34, 197, 94, 0.8); }
              }
              .glow-pulse-green {
                animation: glow-pulse-green-anim 2s ease-in-out infinite;
              }
              @keyframes box-glow-pulse-yellow-anim {
                0%, 100% { box-shadow: 0 0 8px 2px rgba(234, 179, 8, 0.4); }
                50% { box-shadow: 0 0 16px 6px rgba(234, 179, 8, 0.6); }
              }
              .box-glow-pulse-yellow {
                animation: box-glow-pulse-yellow-anim 2s ease-in-out infinite;
              }
            `}</style>

            {/* Placement Scheduling (Phase 6) - only show if plan has linked offspring group */}
            {row.offspringGroupId && api && (
              <PlacementSchedulingSection
                offspringGroupId={row.offspringGroupId}
                api={api}
                isEdit={isEdit}
                editable={editable}
              />
            )}

            {/* Sticky footer Close button for Overview */}
            <div className="sticky bottom-0 pt-4 mt-8 bg-gradient-to-t from-[rgba(0,0,0,0.04)] to-transparent">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Use sync check to avoid stale closure issues after lock/unlock
                    const hasPending = checkPendingChangesSync();
                    // In edit mode without pending changes: just exit edit mode
                    // In edit mode with pending changes: close drawer (will prompt for unsaved changes)
                    // In view mode: close drawer
                    if (mode === "edit" && !hasPending) {
                      handleCancel();
                      return;
                    }
                    const fn =
                      (typeof closeDrawer === "function" && closeDrawer) ||
                      __bhq_findDetailsDrawerOnClose();
                    if (typeof fn === "function") {
                      try {
                        fn();
                      } catch (err) {
                        console.error("[Breeding] close fn threw", err);
                      }
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DATES TAB */}
        {activeTab === "dates" && (
          <div className="space-y-4 mt-2 overflow-x-hidden">
            {isEdit && !expectedsEnabled && (
              <div className="text-xs text-[hsl(var(--brand-orange))] mb-3">
                Select a cycle start date to see Expected Dates.
              </div>
            )}
            {!isEdit && committedOrLater && !expectedsEnabled && (
              <div className="text-xs text-secondary mb-3">
                Expected dates are not available for this plan.
              </div>
            )}

            {actualDatesWarning && (
              <div className="mb-4 rounded-md border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-subtle))] px-4 py-3 text-sm leading-snug">
                <div className="font-medium mb-1">Check actual dates</div>
                <div className="whitespace-normal">{actualDatesWarning}</div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md border border-[hsl(var(--border-subtle))] hover:bg-[hsl(var(--surface-subtle-strong))]"
                    onClick={() => setActualDatesWarning(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Stacked layout: Expected on top, Recalculated in middle, Actual on bottom */}
            <div className="flex flex-col gap-4" data-bhq-details-exempt>
              {/* EXPECTED DATES (SYSTEM CALCULATED) */}
              <SectionCard title="EXPECTED DATES (SYSTEM CALCULATED)">
                {/* Phase 1: Cycle Start → Birth */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                      <span className="text-xs">🔄</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Cycle Start → Birth</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-500/40 via-purple-500/20 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-8">
                    <div>
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Cycle Start</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedCycleStart) || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Hormone Testing Start</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedTestingStart) || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Breeding Date</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedBreed) || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Birth Date</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedBirth) || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Phase 2: Weaning → Placement */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                      <span className="text-xs">🏠</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Weaning → Placement</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/40 via-orange-500/20 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-8">
                    <div>
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Weaned Date</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedWeaned) || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Placement Start</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedPlacementStart) || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Placement Completed</div>
                      <div className="text-sm text-primary font-medium">{fmt(expectedPlacementCompleted) || "—"}</div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* RECALCULATED DATES - hidden in PLANNING phase, shows recalculated values when actual cycle start exists */}
              {statusU !== "PLANNING" && (
                <SectionCard title="EXPECTED DATES (RECALCULATED)">
                  {!effective.cycleStartDateActual ? (
                    <div className="text-sm text-secondary italic">
                      Enter an Actual Cycle Start date to see recalculated expected dates.
                    </div>
                  ) : (
                    <>
                      {/* Phase 1: Cycle Start → Birth */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                            <span className="text-xs">🔄</span>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Cycle Start → Birth</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/40 via-purple-500/20 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-8">
                          <div>
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Cycle Start (Actual)</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(effective.cycleStartDateActual) || "—"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Hormone Testing Start</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(recalcTestingStart) ? <>{fmt(recalcTestingStart)} <span className="text-xs text-secondary font-normal">(New Projection)</span></> : "—"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Breeding Date</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(recalcBreed) ? <>{fmt(recalcBreed)} <span className="text-xs text-secondary font-normal">(New Projection)</span></> : "—"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Birth Date</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(recalcBirth) ? <>{fmt(recalcBirth)} <span className="text-xs text-secondary font-normal">(New Projection)</span></> : "—"}</div>
                          </div>
                        </div>
                      </div>

                      {/* Phase 2: Weaning → Placement */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                            <span className="text-xs">🏠</span>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Weaning → Placement</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/40 via-orange-500/20 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-8">
                          <div>
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Weaned Date</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(recalcWeaned) ? <>{fmt(recalcWeaned)} <span className="text-xs text-secondary font-normal">(New Projection)</span></> : "—"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Placement Start</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(recalcPlacementStart) ? <>{fmt(recalcPlacementStart)} <span className="text-xs text-secondary font-normal">(New Projection)</span></> : "—"}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Placement Completed</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{fmt(recalcPlacementCompleted) ? <>{fmt(recalcPlacementCompleted)} <span className="text-xs text-secondary font-normal">(New Projection)</span></> : "—"}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </SectionCard>
              )}

              {/* ACTUAL DATES - with orange/amber border */}
              {showActualDates && (
                <div className="rounded-lg border-2 border-amber-500/60 bg-surface p-4">
                  <div className="text-sm font-semibold text-primary mb-4">ACTUAL DATES</div>

                  {/* Phase 1: Cycle Start → Birth */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                        <span className="text-xs">🔄</span>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Cycle Start → Birth</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-blue-500/40 via-purple-500/20 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-8">
                      <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Cycle Start</div>
                        <div className="flex items-center gap-2">
                          <CalendarInput
                            value={normalizeDateISO(effective.cycleStartDateActual)}
                            expectedValue={expectedCycleStart}
                            readOnly={!canEditCycleStartActual}
                            showIcon={canEditCycleStartActual}
                            onChange={(e) => {
                              if (!canEditCycleStartActual) return;
                              const raw = e.currentTarget.value;
                              if (!raw) {
                                setDraftLive({ cycleStartDateActual: null });
                                return;
                              }
                              warnIfSequenceBroken("cycleStartDateActual", raw);
                              setDraftLive({ cycleStartDateActual: raw });
                            }}
                            className="flex-1"
                            inputClassName={dateInputCls}
                            placeholder="mm/dd/yyyy"
                          />
                          {canEditCycleStartActual && effective.cycleStartDateActual && (
                            <button
                              type="button"
                              onClick={() => clearActualDateAndSubsequent("cycleStartDateActual")}
                              className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Hormone Testing Start</div>
                        <div className="flex items-center gap-2">
                          <CalendarInput
                            value={normalizeDateISO(effective.hormoneTestingStartDateActual)}
                            expectedValue={expectedTestingStart}
                            readOnly={!canEditDates}
                            showIcon={canEditDates}
                            onChange={(e) => {
                              if (!canEditDates) return;
                              const raw = e.currentTarget.value;
                              if (!raw) {
                                setDraftLive({ hormoneTestingStartDateActual: null });
                                return;
                              }
                              warnIfSequenceBroken("hormoneTestingStartDateActual", raw);
                              setDraftLive({ hormoneTestingStartDateActual: raw });
                            }}
                            className="flex-1"
                            inputClassName={dateInputCls}
                            placeholder="mm/dd/yyyy"
                          />
                          {canEditDates && effective.hormoneTestingStartDateActual && (
                            <button
                              type="button"
                              onClick={() => clearActualDateAndSubsequent("hormoneTestingStartDateActual")}
                              className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Breeding Date</div>
                        <div className="flex items-center gap-2">
                          <CalendarInput
                            value={normalizeDateISO(effective.breedDateActual)}
                            expectedValue={expectedBreed}
                            readOnly={!canEditDates}
                            showIcon={canEditDates}
                            onChange={(e) => {
                              if (!canEditDates) return;
                              const raw = e.currentTarget.value;
                              if (!raw) {
                                setDraftLive({ breedDateActual: null });
                                return;
                              }
                              warnIfSequenceBroken("breedDateActual", raw);
                              setDraftLive({ breedDateActual: raw });
                            }}
                            className="flex-1"
                            inputClassName={dateInputCls}
                            placeholder="mm/dd/yyyy"
                          />
                          {canEditDates && effective.breedDateActual && (
                            <button
                              type="button"
                              onClick={() => clearActualDateAndSubsequent("breedDateActual")}
                              className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Birth Date</div>
                        <div className="flex items-center gap-2">
                          <CalendarInput
                            value={normalizeDateISO(effective.birthDateActual)}
                            expectedValue={expectedBirth}
                            readOnly={!canEditDates}
                            showIcon={canEditDates}
                            onChange={(e) => {
                              if (!canEditDates) return;
                              const raw = e.currentTarget.value;
                              if (!raw) {
                                setDraftLive({ birthDateActual: null });
                                return;
                              }
                              warnIfSequenceBroken("birthDateActual", raw);
                              setDraftLive({ birthDateActual: raw });
                            }}
                            className="flex-1"
                            inputClassName={dateInputCls}
                            placeholder="mm/dd/yyyy"
                          />
                          {canEditDates && effective.birthDateActual && (
                            <button
                              type="button"
                              onClick={() => clearActualDateAndSubsequent("birthDateActual")}
                              className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2: Weaning → Placement */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                        <span className="text-xs">🏠</span>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Weaning → Placement</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-amber-500/40 via-orange-500/20 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-8">
                      <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Weaned Date</div>
                      <div className="flex items-center gap-2">
                        <CalendarInput
                          value={normalizeDateISO(effective.weanedDateActual)}
                          expectedValue={expectedWeaned}
                          readOnly={!canEditDates}
                          showIcon={canEditDates}
                          onChange={(e) => {
                            if (!canEditDates) return;
                            const raw = e.currentTarget.value;
                            if (!raw) {
                              setDraftLive({ weanedDateActual: null });
                              return;
                            }
                            warnIfSequenceBroken("weanedDateActual", raw);
                            setDraftLive({ weanedDateActual: raw });
                          }}
                          className="flex-1"
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                        {canEditDates && effective.weanedDateActual && (
                          <button
                            type="button"
                            onClick={() => clearActualDateAndSubsequent("weanedDateActual")}
                            className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Placement Start</div>
                      <div className="flex items-center gap-2">
                        <CalendarInput
                          value={normalizeDateISO(effective.placementStartDateActual)}
                          expectedValue={expectedPlacementStart}
                          readOnly={!canEditDates}
                          showIcon={canEditDates}
                          onChange={(e) => {
                            if (!canEditDates) return;
                            const raw = e.currentTarget.value;
                            if (!raw) {
                              setDraftLive({ placementStartDateActual: null });
                              return;
                            }
                            warnIfSequenceBroken("placementStartDateActual", raw);
                            setDraftLive({ placementStartDateActual: raw });
                          }}
                          className="flex-1"
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                        {canEditDates && effective.placementStartDateActual && (
                          <button
                            type="button"
                            onClick={() => clearActualDateAndSubsequent("placementStartDateActual")}
                            className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Row 4 - Placement Completed */}
                    <div>
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Placement Completed</div>
                      <div className="flex items-center gap-2">
                        <CalendarInput
                          value={normalizeDateISO(effective.placementCompletedDateActual)}
                          expectedValue={expectedPlacementCompleted}
                          readOnly={!canEditDates}
                          showIcon={canEditDates}
                          onChange={(e) => {
                            if (!canEditDates) return;
                            const raw = e.currentTarget.value;
                            if (!raw) {
                              setDraftLive({ placementCompletedDateActual: null });
                              return;
                            }
                            warnIfSequenceBroken("placementCompletedDateActual", raw);
                            setDraftLive({ placementCompletedDateActual: raw });
                          }}
                          className="flex-1"
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                        {canEditDates && effective.placementCompletedDateActual && (
                          <button
                            type="button"
                            onClick={() => clearActualDateAndSubsequent("placementCompletedDateActual")}
                            className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Row 4 - Plan Completed */}
                    <div className="col-span-2">
                        <div className="text-[10px] uppercase text-secondary tracking-wide mb-1">Plan Completed</div>
                      <div className="flex items-center gap-2">
                        <CalendarInput
                          value={normalizeDateISO(effective.completedDateActual)}
                          readOnly={!canEditCompletedActual}
                          showIcon={canEditCompletedActual}
                          onChange={(e) => {
                            if (!canEditCompletedActual) return;
                            const raw = e.currentTarget.value;
                            if (!raw) {
                              setDraftLive({ completedDateActual: null });
                              return;
                            }
                            warnIfSequenceBroken("completedDateActual", raw);
                            setDraftLive({ completedDateActual: raw });
                          }}
                          className="max-w-[200px]"
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                        {canEditCompletedActual && effective.completedDateActual && (
                          <button
                            type="button"
                            onClick={() => clearActualDateAndSubsequent("completedDateActual")}
                            className="text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-hairline hover:border-primary/30"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {canEditDates && !canEditCompletedActual && (
                        <div className="mt-1 text-[10px] text-secondary">
                          Enter all earlier Actual Dates before marking the plan completed.
                        </div>
                      )}
                    </div>
                    </div>
                  </div>

                  {/* Reset All button inside the Actual Dates frame */}
                  {isEdit && (
                    <div className="mt-4 pt-3 border-t border-amber-500/30">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canEditDates}
                        onClick={async () => {
                          if (!canEditDates) return;
                          if (!window.confirm("Reset all actual dates for this plan back to blank?")) {
                            return;
                          }

                          // Build payload with null dates
                          const resetDates = {
                            cycleStartDateActual: null,
                            hormoneTestingStartDateActual: null,
                            breedDateActual: null,
                            birthDateActual: null,
                            weanedDateActual: null,
                            placementStartDateActual: null,
                            placementCompletedDateActual: null,
                            completedDateActual: null,
                          };

                          // Derive status with all dates cleared - should regress to COMMITTED
                          const derivedStatus = deriveBreedingStatus({
                            name: row.name,
                            species: row.species,
                            damId: row.damId,
                            sireId: row.sireId,
                            lockedCycleStart: row.lockedCycleStart,
                            cycleStartDateActual: null,
                            breedDateActual: null,
                            birthDateActual: null,
                            weanedDateActual: null,
                            placementStartDateActual: null,
                            placementCompletedDateActual: null,
                            completedDateActual: null,
                          });

                          // Call API directly with reset dates AND derived status
                          try {
                            const payload = {
                              ...resetDates,
                              status: toBackendStatus(derivedStatus),
                            };
                            console.log("[Breeding] Reset dates - derived status:", derivedStatus);
                            console.log("[Breeding] Reset dates payload:", payload);

                            await api.updatePlan(Number(row.id), payload as any);

                            // Fetch fresh data and update UI
                            const fresh = await api.getPlan(Number(row.id), "parents,org");
                            console.log("[Breeding] Fresh plan status:", fresh.status);

                            onPlanUpdated?.(row.id, fresh);

                            // Clear local draft state
                            draftRef.current = {};
                            setDraftTick((t) => t + 1);
                            setDraft({});
                            setMode("view");
                          } catch (err) {
                            console.error("[Breeding] Reset dates failed", err);
                          }
                        }}
                      >
                        Reset All Actual Dates
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky footer Close button for Dates tab */}
            <div className="sticky bottom-0 pt-4 mt-8 bg-gradient-to-t from-[rgba(0,0,0,0.04)] to-transparent">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Use sync check to avoid stale closure issues after lock/unlock
                    const hasPending = checkPendingChangesSync();
                    // In edit mode without pending changes: just exit edit mode
                    // In edit mode with pending changes: close drawer (will prompt for unsaved changes)
                    // In view mode: close drawer
                    if (mode === "edit" && !hasPending) {
                      handleCancel();
                      return;
                    }
                    const fn =
                      (typeof closeDrawer === "function" && closeDrawer) ||
                      __bhq_findDetailsDrawerOnClose();
                    if (typeof fn === "function") {
                      try {
                        fn();
                      } catch (err) {
                        console.error("[Breeding] close fn threw", err);
                      }
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DEPOSITS TAB */}
        {activeTab === "deposits" && (
          <div className="space-y-2">
            <SectionCard title="Deposits">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-secondary mb-1">
                    Deposits Committed
                  </div>
                  <div>
                    $
                    {((row.depositsCommitted ?? 0) / 100).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-secondary mb-1">
                    Deposits Paid
                  </div>
                  <div>
                    ${((row.depositsPaid ?? 0) / 100).toLocaleString()}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-secondary mb-1">
                    Deposit Risk
                  </div>
                  <div>{row.depositRisk ?? 0}%</div>
                </div>
              </div>
            </SectionCard>

            {/* Sticky footer Close */}
            <div className="sticky bottom-0 pt-4 mt-8 bg-gradient-to-t from-[rgba(0,0,0,0.04)] to-transparent">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mode === "edit") {
                      handleCancel();
                    }
                    const fn =
                      (typeof closeDrawer === "function" && closeDrawer) ||
                      __bhq_findDetailsDrawerOnClose();
                    if (typeof fn === "function") {
                      try {
                        fn();
                      } catch (err) {
                        console.error("[Breeding] close fn threw", err);
                      }
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FINANCES TAB */}
        {activeTab === "finances" && row?.id && (
          <FinanceTab
            invoiceFilters={{ breedingPlanId: row.id }}
            expenseFilters={{ breedingPlanId: row.id }}
            api={api}
            showBreedingPlanSummary={true}
            defaultAnchor={{ breedingPlanId: row.id as number, breedingPlanName: row.name }}
            offspringGroups={[]}
            offspring={[]}
          />
        )}

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div className="space-y-2">
            <SectionCard title="Audit">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-secondary mb-1">Created</div>
                  <div>{fmt(row.createdAt) || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-secondary mb-1">
                    Last Updated
                  </div>
                  <div>{fmt(row.updatedAt) || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-secondary mb-1">
                    Created By
                  </div>
                  <div>{row.createdBy || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-secondary mb-1">
                    Last Updated By
                  </div>
                  <div>{row.updatedBy || "—"}</div>
                </div>
              </div>
            </SectionCard>

            {/* Sticky footer Close */}
            <div className="sticky bottom-0 pt-4 mt-8 bg-gradient-to-t from-[rgba(0,0,0,0.04)] to-transparent">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mode === "edit") {
                      handleCancel();
                    }
                    const fn =
                      (typeof closeDrawer === "function" && closeDrawer) ||
                      __bhq_findDetailsDrawerOnClose();
                    if (typeof fn === "function") {
                      try {
                        fn();
                      } catch (err) {
                        console.error("[Breeding] close fn threw", err);
                      }
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DetailsScaffold>
  );
}
