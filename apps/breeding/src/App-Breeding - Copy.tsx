// apps/breeding/src/App-Breeding.tsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
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
} from "@bhq/ui";
import { Overlay } from "@bhq/ui/overlay";
import { OverlayMount } from "@bhq/ui/overlay/OverlayMount";
import { getOverlayRoot } from "@bhq/ui/overlay/core";
import { NavLink, useInRouterContext } from "react-router-dom";
import RollupGantt from "./components/RollupGantt";
import PerPlanGantt from "./components/PerPlanGantt";
import PlannerSwitch from "./components/PlannerSwitch";
import "@bhq/ui/styles/table.css";
import "@bhq/ui/styles/details.css";
import "@bhq/ui/styles/datefield.css";
import { makeBreedingApi } from "./api";
import {
  windowsFromPlan,
  expectedMilestonesFromLocked,
  expectedTestingFromCycleStart,
  pickPlacementCompletedAny,
} from "@bhq/ui/utils";

// ── Calendar / Planning wiring ─────────────────────────────
import BreedingCalendar from "./components/BreedingCalendar";


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
  { key: "dates", label: "Dates" }, // NEW
  { key: "deposits", label: "Deposits" },
  { key: "audit", label: "Audit" },
] as const;

/* ───────────────────────── Types ───────────────────────── */
type ID = number | string;

type SpeciesWire = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";

type BHQDateFieldProps = {
  label: string;
  value?: string | null;
  defaultValue?: string | null;
  readOnly?: boolean;
  onChange?: (v: string) => void; // will receive ISO yyyy-mm-dd or ""
};

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


function computeExpectedForPlan(plan: { species?: string; lockedCycleStart?: string | null }) {
  const speciesWire = toWireSpecies(plan.species as any) ?? "DOG";
  const locked = (plan.lockedCycleStart || "").slice(0, 10) || null;

  if (!locked) {
    return {
      expectedCycleStart: null,
      expectedHormoneTestingStart: null,
      expectedBreedDate: null,
      expectedBirthDate: null,
      expectedWeanedDate: null,
      expectedPlacementStartDate: null,
      expectedPlacementCompletedDate: null,
    };
  }

  // ---- helpers: keep everything date-only in UTC, no local Date() drift ----
  const onlyDay = (v: any): string | null => {
    if (!v) return null;
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // If it's ISO with time, slice the day; otherwise bail out.
    const iso = s.includes("T") ? s.slice(0, 10) : null;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso : null;
  };

  const addDays = (yyyyMmDd: string, n: number): string => {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const t = Date.UTC(y, m - 1, d);
    const dt = new Date(t + n * 86400000);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  // Core projections from breeding math
  const m = expectedMilestonesFromLocked(locked, speciesWire) || {};

  // Match the Dates tab’s preference order for each field
  const expectedCycleStart = locked;

  // Testing start: mirror pickExpectedTestingStart() logic used in Dates tab
  const expectedHormoneTestingStart = pickExpectedTestingStart(m, locked);

  // Breed/ovulation (Dates tab shows ovulation as “Breeding (Expected)”)
  const expectedBreedDate = onlyDay(m.ovulation ?? m.breeding_expected) || null;

  const expectedBirthDate = onlyDay(m.birth_expected) || null;

  // Weaned date: Dates tab prefers weaning_expected, then weaned_expected, then puppy_care_likely[0]
  const expectedWeanedDate =
    onlyDay(m.weaning_expected ?? m.weaned_expected ?? m.puppy_care_likely?.[0]) || null;

  // Placement start: Dates tab uses placement_expected primarily
  const expectedPlacementStartDate =
    onlyDay(m.placement_expected ?? m.placement_start_expected ?? m.placement_start) || null;

  // Placement completed: Dates tab prefers extended end, then expected end, then “full” window end
  const expectedPlacementCompletedDate =
    onlyDay(
      m.placement_extended_end ??
      m.placement_extended_end_expected ??
      m.placement_expected_end ??
      m.placement_completed_expected ??
      m.placement_extended_full?.[1]
    ) || null;

  return {
    expectedCycleStart,
    expectedHormoneTestingStart,
    expectedBreedDate,
    expectedBirthDate,
    expectedWeanedDate,
    expectedPlacementStartDate,
    expectedPlacementCompletedDate,
  };
}

function DateField({ label, value, defaultValue, readOnly, onChange }: BHQDateFieldProps) {
  const isReadOnly = !!readOnly;
  const current = value ?? defaultValue ?? "";

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
  s === "DOG" ? "Dog" : s === "CAT" ? "Cat" : s === "HORSE" ? "Horse" : "";

const toWireSpecies = (s: SpeciesUi | SpeciesWire | ""): SpeciesWire | undefined => {
  const v = String(s || "").toUpperCase();
  if (v === "DOG" || v === "CAT" || v === "HORSE") return v as SpeciesWire; // pass-through if already wire
  if (v === "DOG") return "DOG";
  if (v === "CAT") return "CAT";
  if (v === "HORSE") return "HORSE";
  return undefined;
};

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
  expectedWeanedDate?: string | null;
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
  { key: "expectedWeanedDate", label: "Weaned (Exp)", default: false },
  { key: "expectedPlacementStartDate", label: "Placement Start (Exp)", default: false },
  { key: "expectedPlacementCompletedDate", label: "Placement Completed (Exp)", default: false },


  // Actuals
  { key: "cycleStartDateActual", label: "Cycle Start (Actual)", default: false },
  { key: "hormoneTestingStartDateActual", label: "Hormone Testing Start (Actual)", default: false },
  { key: "breedDateActual", label: "Breeding (Actual)", default: false },
  { key: "birthDateActual", label: "Birth (Actual)", default: false },
  { key: "weanedDateActual", label: "Weaned", default: false },
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

function DisplayValue({ value }: { value?: string | null }) {
  return (
    <div className="h-8 flex items-center text-sm select-none pointer-events-none">
      {value ? <span className="font-medium">{value}</span> : <span className="text-secondary">—</span>}
    </div>
  );
}

function fmt(d?: string | null) {
  if (!d) return "";
  const s = String(d);
  // If it's date-only, parse as UTC midnight to avoid TZ drift + invalid parsing
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : new Date(s);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}

function planToRow(p: any): PlanRow {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    species: toUiSpecies(p.species),

    damId: p.dam?.id ?? null,
    sireId: p.sire?.id ?? null,

    damName: p.dam?.name ?? "",
    sireName: p.sire?.name ?? null,
    orgName: p.organization?.name ?? null,
    code: p.code ?? null,

    /* Canonical expected timeline (strict, breedingMath-driven) */
    expectedCycleStart: p.lockedCycleStart ?? null,
    expectedHormoneTestingStart: p.expectedHormoneTestingStart ?? null,
    expectedBreedDate: p.lockedOvulationDate ?? null,
    expectedBirthDate: p.lockedDueDate ?? null,
    expectedWeanedDate: p.expectedWeanedDate ?? null,
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

    notes: p.notes ?? null,

    createdAt: p.createdAt ?? p.created_at ?? null,
    updatedAt: p.updatedAt ?? p.updated_at ?? null,

    /* Planner overrides */
    femaleCycleLenOverrideDays: p.femaleCycleLenOverrideDays ?? null,
    homingStartWeeksOverride: p.homingStartWeeksOverride ?? null,
  } as any;
}

type Status =
  | "PLANNING"
  | "COMMITTED"
  | "BRED"
  | "BIRTHED"
  | "WEANED"
  | "HOMING_STARTED"
  | "COMPLETE"
  | "CANCELED";

function deriveBreedingStatus(p: {
  name?: string | null;
  species?: string | null;
  damId?: number | null;
  sireId?: number | null;
  lockedCycleStart?: string | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  status?: string | null; // ⟵ allow pass-through
}): Status {
  const explicit = (p.status ?? "").toUpperCase();
  if (explicit === "CANCELED") return "CANCELED";

  if (p.completedDateActual?.trim()) return "COMPLETE";
  if ((p.placementCompletedDateActual ?? p.placementStartDateActual)?.trim()) return "HOMING_STARTED";
  if (p.weanedDateActual?.trim()) return "WEANED";
  if (p.birthDateActual?.trim()) return "BIRTHED";
  if (p.breedDateActual?.trim()) return "BRED";

  const hasBasics = Boolean((p.name ?? "").trim() && (p.species ?? "").trim() && p.damId != null);
  const hasCommitPrereqs = hasBasics && p.sireId != null && (p.lockedCycleStart ?? "").trim();

  // If you have a committedAt field in your backend, you can check it here (omitted in this POJO).
  if (hasCommitPrereqs) return "COMMITTED";
  return "PLANNING";
}

/** Minimal animal for Dam/Sire search */
type AnimalLite = {
  id: number;
  name: string;
  species: SpeciesWire;
  sex: "FEMALE" | "MALE";
  organization?: { name: string } | null;
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
  return undefined;
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

  // Cast to NormalizedPlan[] to avoid the missing adapter helper.
  const normalized = React.useMemo<NormalizedPlan[]>(
    () => (allPlans as unknown as NormalizedPlan[]),
    [allPlans]
  );


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
      "expectedWeanedDate",
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
            { label: "Placement Started", value: "HOMING_STARTED" },
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
    "expectedWeanedDate",
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
  const [plannerMode, setPlannerMode] = React.useState<"per-plan" | "master">("per-plan");

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

        const derived = deriveBreedingStatus({
          name: merged.name,
          species: merged.species,
          damId: merged.damId as any,
          sireId: merged.sireId as any,
          lockedCycleStart: merged.lockedCycleStart as any,
          breedDateActual: merged.breedDateActual as any,
          birthDateActual: merged.birthDateActual as any,
          weanedDateActual: merged.weanedDateActual as any,
          placementStartDateActual: merged.placementStartDateActual as any,
          placementCompletedDateActual: merged.placementCompletedDateActual as any,
          completedDateActual: merged.completedDateActual as any,
          status: merged.status as any, // pass-through
        });

        // Respect an explicit status in the draft (e.g., "CANCELED"); else fall back to derived.
        const status = draft.status ?? derived;

        const updated = await api.updatePlan(Number(id), { ...draft, status } as any);
        setRows((prev) => prev.map((r) => (r.id === id ? planToRow(updated) : r)));
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

              // optional toast
              utils.toast?.success?.("Plan committed, group linked.");
            } catch (e: any) {
              const msg = e?.payload?.error || e?.message || "Commit failed";
              utils.toast?.error?.(msg);
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
          closeDrawer={props.close}
          onModeChange={setDrawerIsEditing}
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
          <>
            <div className="bhq-details-guard" data-testid="bhq-details-guard">
              <DetailsHost rows={rows} config={detailsConfig} closeOnOutsideClick={!drawerIsEditing} closeOnEscape={false}>
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
                        // widthPx={520}  // ⟵ remove this so it flexes
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setFiltersOpen((v) => !v)}
                            aria-expanded={filtersOpen}
                            title="Filters"
                            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/5 focus:outline-none"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
                  </div>

                  {/* Filters */}
                  {filtersOpen && <FiltersRow filters={filters} onChange={(next) => setFilters(next)} schema={FILTER_SCHEMA} />}

                  {/* Table */}
                  <table className="min-w-max w-full text-sm">
                    <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
                    <tbody>
                      {!api && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-secondary">Resolving tenant…</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {api && loading && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-secondary">Loading plans…</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {api && !loading && error && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-red-600">Error: {error}</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {api && !loading && !error && pageRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={visibleSafe.length}>
                            <div className="py-8 text-center text-sm text-secondary">No breeding plans yet.</div>
                          </TableCell>
                        </TableRow>
                      )}

                      {api &&
                        !loading &&
                        !error &&
                        pageRows.length > 0 &&
                        pageRows.map((r) => (
                          <TableRow key={r.id} detailsRow={r} className={r.archived ? "opacity-60" : ""}>
                            {visibleSafe.map((c) => {
                              let v = (r as any)[c.key] as any;
                              if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                              if (Array.isArray(v)) v = v.join(", ");
                              const custom = CELL_RENDERERS[c.key];
                              return <TableCell key={c.key}>{custom ? custom(r) : v ?? ""}</TableCell>;
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
          </>
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
          <div className="p-2">
            <SectionCard
              title="Planner"
              className="flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 flex-none">
                <PlannerSwitch mode={plannerMode} onChange={setPlannerMode} />
                <div className="text-sm text-secondary">Planner view</div>
              </div>

              <div
                ref={plannerContentRef}
                className="flex-1 min-h-0 overflow-y-auto pr-2"
                style={
                  plannerContentMaxHeight != null
                    ? { maxHeight: plannerContentMaxHeight }
                    : undefined
                }
              >
                {plannerMode === "per-plan" ? (
                  <PerPlanGantt
                    plans={normalized}
                    computeExpected={computeExpectedForPlan}
                    className="w-full"
                  />
                ) : (
                  <RollupGantt
                    items={normalized ?? []}
                    computeExpected={computeExpectedForPlan}
                    prefsOverride={{ defaultExactBandsVisible: availabilityOn }}
                    selected={selectedKeys ?? new Set<ID>()}
                    onSelectedChange={(next) => {
                      setSelectionTouched(true);
                      setSelectedKeys(next);
                    }}
                  />
                )}
              </div>
            </SectionCard>
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
                    <div className="text-lg font-semibold mb-1">New breeding plan</div>
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
                        <div className="text-xs text-secondary mb-1">Breed</div>
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

/* ───────── Small helpers ───────── */

// Helper: choose hormone testing start from preview (aliases) or fallback to cycleStart + 7d

/* ───────── CalendarInput: text field + native date picker ───────── */
type CalendarInputProps = Omit<React.ComponentProps<typeof Input>, "className" | "onChange"> & {
  showIcon?: boolean;
  className?: string;      // wrapper width
  inputClassName?: string; // visible input styling
  onChange?: (e: { currentTarget: { value: string } }) => void; // emits ISO
};

function CalendarInput({
  readOnly,
  className,
  inputClassName,
  onChange,
  value,
  defaultValue,
  placeholder = "mm/dd/yyyy",
  showIcon = true,
  ...rest
}: CalendarInputProps) {
  const isReadOnly = !!readOnly;

  // ISO <-> display helpers
  const onlyISO = (s: string) => (s || "").slice(0, 10);
  const toDisplay = (s?: string) => {
    if (!s) return "";
    const iso = onlyISO(s);
    const [y, m, d] = iso.split("-");
    return y && m && d ? `${Number(m)}/${Number(d)}/${y}` : s!;
  };
  const toISO = (s?: string) => {
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return onlyISO(s);
    const m = s.match(/^\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s*$/);
    if (m) {
      const mm = String(m[1]).padStart(2, "0");
      const dd = String(m[2]).padStart(2, "0");
      const yyyy = String(m[3]).padStart(4, "20");
      return `${yyyy}-${mm}-${dd}`;
    }
    const dt = new Date(s);
    if (Number.isFinite(dt.getTime())) {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };

  const [internal, setInternal] = React.useState<string>(
    () => (value !== undefined ? toDisplay(String(value)) : toDisplay(String(defaultValue ?? "")))
  );
  React.useEffect(() => {
    if (value !== undefined) setInternal(toDisplay(String(value ?? "")));
  }, [value]);

  const pushChange = React.useCallback(
    (nextDisplay: string) => {
      setInternal(nextDisplay);
      const iso = toISO(nextDisplay);
      onChange?.({ currentTarget: { value: iso || "" } } as any);
    },
    [onChange]
  );

  // Refs
  const shellRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  // Track popup so we can (a) keep ring on, (b) place it by the icon
  const setExpanded = (on: boolean) => {
    const b = buttonRef.current;
    if (!b) return;
    if (on) b.setAttribute("aria-expanded", "true");
    else b.removeAttribute("aria-expanded");
  };

  // Helper imported above in this file — positions any 3rd-party date popup.
  // If you moved it out, keep this call the same.
  const placePopup = React.useCallback(() => {
    try {
      // @ts-ignore - helper exists earlier in file
      hoistAndPlaceDatePopup(buttonRef.current!);
    } catch { }
  }, []);

  // Close watcher: when popup disappears, drop aria-expanded
  React.useEffect(() => {
    const mo = new MutationObserver(() => {
      // if no known date popups remain, drop expanded
      const any =
        document.querySelector('[data-radix-popper-content-wrapper],.react-datepicker,.rdp,.rdp-root,[role="dialog"][data-state="open"]');
      if (!any) setExpanded(false);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div data-bhq-details-exempt className={["min-w-0", className || "w-full"].join(" ")} style={{ position: "relative" }}>
      {/* SHELL owns the border so the orange ring can wrap input+icon together */}
      <div
        ref={shellRef}
        className="w-full rounded-md"
        style={{
          position: "relative",
          height: "2rem",
          display: "flex",
          alignItems: "center",
          background: "var(--surface, transparent)",
          border: "1px solid var(--hairline, hsl(0 0% 20%))",
        }}
      >
        <Input
          {...rest}
          ref={inputRef as any}
          type="text"
          readOnly={isReadOnly}
          value={internal}
          onChange={(e) => pushChange(e.currentTarget.value)}
          placeholder={placeholder}
          className={["min-w-0 flex-1", inputClassName || ""].join(" ")}
          style={{
            height: "100%",
            paddingLeft: "0.5rem",
            paddingRight: "2.25rem",
            background: "transparent",
            border: 0,
            outline: "none",
            boxShadow: "none",
            WebkitAppearance: "none",
            appearance: "none",
          }}
        />

        {!isReadOnly && showIcon && (
          <button
            ref={buttonRef}
            type="button"
            title="Open date picker"
            aria-label="Open date picker"
            onMouseDown={(e) => {
              // keep focus on the input so :focus-within triggers
              e.preventDefault();
              inputRef.current?.focus();
              setExpanded(true);
            }}
            onClick={() => {
              // Focus input (orange ring), open picker, and force placement by the icon
              inputRef.current?.focus();
              setExpanded(true);

              const hid = hiddenRef.current;
              try {
                if (hid) {
                  const iso = ((): string => {
                    const v = internal;
                    const iso = toISO(v);
                    return iso || "";
                  })();
                  if (iso) hid.value = iso;
                  // @ts-ignore
                  if (typeof hid?.showPicker === "function") hid.showPicker();
                  else hid?.click();
                }
              } catch { }

              placePopup();
              // re-place after render/layout settles
              setTimeout(placePopup, 30);
            }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: 0, padding: 0, cursor: "pointer", lineHeight: 0,
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
        )}
      </div>

      {/* Hidden native date input (drives OS picker) */}
      <input
        ref={hiddenRef}
        type="date"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        tabIndex={-1}
        onChange={(e) => {
          const iso = e.currentTarget.value;
          const [y, m, d] = (iso || "").split("-");
          const display = y && m && d ? `${Number(m)}/${Number(d)}/${y}` : "";
          pushChange(display);
          // picker closed after selection – drop expanded
          setExpanded(false);
        }}
      />
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
  onArchive?: (id: ID, archived: boolean) => Promise<void> | void;
  onPlanUpdated?: (id: ID, fresh: any) => void;
  tabs: ReadonlyArray<{ key: string; label: string }>;
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
    closeDrawer,
    onModeChange,
    onPlanUpdated,
    tabs,
  } = props;

  const isEdit = mode === "edit";
  React.useEffect(() => {
    onModeChange?.(isEdit);
  }, [isEdit, onModeChange]);

  // ---- status flags used by Dates tab and other sections ----
  const statusU = String(row.status || "").toUpperCase();
  const committedOrLater = ["COMMITTED", "BRED", "BIRTHED", "WEANED", "HOMING_STARTED", "COMPLETE"].includes(statusU);
  const isCommitted = statusU === "COMMITTED"; // keep if other UI still checks it
  const canEditDates = isEdit && committedOrLater;


  // live draft overlay
  const draftRef = React.useRef<Partial<PlanRow>>({});
  const [draftTick, setDraftTick] = React.useState(0);
  const setDraftLive = React.useCallback(
    (patch: Partial<PlanRow>) => {
      draftRef.current = { ...draftRef.current, ...patch };
      setDraft(patch);
      setDraftTick((t) => t + 1);
    },
    [setDraft]
  );
  const effective = React.useMemo(() => ({ ...row, ...draftRef.current }), [row, draftTick]);

  type DamReproEvent = { kind: "heat_start" | "ovulation" | "insemination" | "whelp"; date: string };
  type DamReproData = { last_heat: string | null; repro: DamReproEvent[] };

  const [damRepro, setDamRepro] = React.useState<DamReproData | null>(null);
  const [damLoadError, setDamLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setDamLoadError(null);
      setDamRepro(null);
      if (!api || !row.damId) return;
      try {
        let data: DamReproData | null = null;
        try {
          const res: any = await (api as any).getAnimal?.(row.damId, "repro,last_heat");
          if (res) {
            const repro: DamReproEvent[] = Array.isArray(res?.repro) ? res.repro : [];
            const last_heat = (res?.last_heat ?? res?.lastHeat ?? null) as string | null;
            data = { repro, last_heat };
          }
        } catch { }
        if (!cancelled) setDamRepro(data ?? { repro: [], last_heat: null });
      } catch (e: any) {
        if (!cancelled) setDamLoadError(e?.message || "Failed to load Dam cycle history");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, row.damId]);

  // ===== Cycle math + projections =====
  const species = (row.species || "Dog") as PlannerSpecies;

  const damHeatStartsAsc = React.useMemo(
    () =>
      (damRepro?.repro ?? [])
        .filter((e) => e.kind === "heat_start" && e.date)
        .map((e) => e.date)
        .sort(),
    [damRepro]
  );
  const lastHeatStart = damRepro?.last_heat ?? (damHeatStartsAsc.length ? damHeatStartsAsc[damHeatStartsAsc.length - 1] : null);

  const { projectedCycles, computeFromLocked } = useCyclePlanner({
    species,
    reproAsc: (damRepro?.repro ?? []) as any,
    lastActualHeatStart: lastHeatStart as any,
    futureCount: 12,
  });

  const [pendingCycle, setPendingCycle] = React.useState<string | null>(row.lockedCycleStart ?? null);
  const [lockedPreview, setLockedPreview] = React.useState<boolean>(Boolean(row.lockedCycleStart));
  const [expectedPreview, setExpectedPreview] = React.useState<PlannerExpected | null>(() =>
    row.lockedCycleStart ? computeFromLocked(row.lockedCycleStart) : null
  );

  React.useEffect(() => {
    setPendingCycle(row.lockedCycleStart ?? null);
    const e = row.lockedCycleStart ? computeFromLocked(row.lockedCycleStart) : null;
    setExpectedPreview(e);
    setLockedPreview(Boolean(row.lockedCycleStart));
  }, [row.lockedCycleStart, computeFromLocked]);

  async function lockCycle() {
    if (!pendingCycle || !String(pendingCycle).trim()) return;
    if (!api) return;

    const expected = computeFromLocked(pendingCycle);
    const testingStart = pickExpectedTestingStart(expected, pendingCycle);

    const payload = {
      lockedCycleStart: pendingCycle,
      lockedOvulationDate: expected.ovulation,
      lockedDueDate: expected.birth_expected,
      lockedPlacementStartDate: expected.placement_expected,

      expectedCycleStart: pendingCycle,
      expectedHormoneTestingStart: testingStart ?? null,
      expectedBreedDate: expected.ovulation ?? null,
      expectedBirthDate: expected.birth_expected ?? null,

      expectedPlacementStartDate: expected.placement_expected ?? null,
      expectedPlacementCompletedDate:
        expected.placement_extended_end ??
        expected.placement_expected_end ??
        expected.placement_extended_full?.[1] ??
        null,
    };

    setExpectedPreview(expected);
    setLockedPreview(true);
    setDraftLive(payload);

    try {
      await api.updatePlan(Number(row.id), payload as any);

      await api.createEvent(Number(row.id), {
        type: "CYCLE_LOCKED",
        occurredAt: new Date().toISOString(),
        label: "Cycle locked",
        data: {
          cycleStart: pendingCycle,
          ovulation: expected.ovulation,
          due: expected.birth_expected,
          placementStart: expected.placement_expected,
          testingStart,
          expectedCycleStart: pendingCycle,
          expectedHormoneTestingStart: testingStart,
          expectedBreedDate: expected.ovulation ?? null,
          expectedBirthDate: expected.birth_expected ?? null,
        },
      });

      const fresh = await api.getPlan(Number(row.id), "parents,org");
      onPlanUpdated?.(row.id, fresh);
    } catch (e) {
      console.error("[Breeding] lockCycle persist or audit failed", e);
      setExpectedPreview(null);
      setLockedPreview(false);
      setDraftLive({
        lockedCycleStart: pendingCycle,
        lockedOvulationDate: expected.ovulation,
        lockedDueDate: expected.birth_expected,
        lockedPlacementStartDate: expected.placement_expected,

        expectedCycleStart: pendingCycle,
        expectedHormoneTestingStart: testingStart ?? null,
        expectedBreedDate: expected.ovulation ?? null,
        expectedBirthDate: expected.birth_expected ?? null,
      });
      utils.toast?.error?.("Failed to lock cycle. Please try again.");
    }
  }

  async function unlockCycle() {
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

      expectedPlacementStartDate: null,
      expectedPlacementCompletedDate: null,
    };
    setDraftLive(payload);

    try {
      await api.updatePlan(Number(row.id), payload as any);

      await api.createEvent(Number(row.id), {
        type: "CYCLE_UNLOCKED",
        occurredAt: new Date().toISOString(),
        label: "Cycle unlocked",
        data: {},
      });

      const fresh = await api.getPlan(Number(row.id), "parents,org");
      onPlanUpdated?.(row.id, fresh);
    } catch (e) {
      console.error("[Breeding] unlockCycle persist or audit failed", e);
      const expected = pendingCycle ? computeFromLocked(pendingCycle) : null;
      setExpectedPreview(expected);
      setLockedPreview(Boolean(pendingCycle));
      utils.toast?.error?.("Failed to unlock cycle. Please try again.");
    }
  }

  const isLocked = Boolean(((row.lockedCycleStart ?? draftRef.current.lockedCycleStart) ?? "").toString().trim());

  // Always treat cycle start as the locked value once locked
  const expectedCycleStart = isLocked ? (row.lockedCycleStart || pendingCycle || "") : "";

  // Strict: use breedingMath output only for Expected fields (no persisted fallbacks)
  const expectedBreed = isLocked ? (expectedPreview?.ovulation ?? "") : "";
  const expectedBirth = isLocked ? (expectedPreview?.birth_expected ?? "") : "";
  const expectedWeaned =
    isLocked
      ? (
        (expectedPreview as any)?.weaning_expected ??
        (expectedPreview as any)?.weaned_expected ??
        (expectedPreview as any)?.puppy_care_likely?.[0] ??
        ""
      )
      : "";
  const expectedPlacementStart = isLocked ? (expectedPreview?.placement_expected ?? "") : "";
  const expectedGoHomeExtended =
    isLocked
      ? (
        (expectedPreview as any)?.placement_extended_end ??
        (expectedPreview as any)?.placement_extended_end_expected ??
        (expectedPreview as any)?.placement_extended_full?.[1] ??
        ""
      )
      : "";

  // New: expected Testing Start with aliases + 7d fallback
  const expectedTestingStart = isLocked ? (pickExpectedTestingStart(expectedPreview, row.lockedCycleStart) ?? "") : "";


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
    effective.damId != null &&
    effective.sireId != null &&
    hasBreed &&
    ((row.lockedCycleStart ?? draftRef.current.lockedCycleStart) ?? "") &&
    !["COMMITTED", "BRED", "BIRTHED", "WEANED", "HOMING_STARTED", "COMPLETE", "CANCELED"].includes(effective.status)
  );
  const expectedsEnabled = Boolean(
    effective.damId != null && effective.sireId != null && ((row.lockedCycleStart ?? draftRef.current.lockedCycleStart) ?? "")
  );

  const breedComboKey = `${effective.species || "Dog"}|${hasBreed}`;

  const handleCancel = React.useCallback(() => {
    const undo: Partial<PlanRow> = {};
    for (const k of Object.keys(draftRef.current)) {
      (undo as any)[k] = (row as any)[k];
    }
    if (Object.keys(undo).length) setDraft(undo);
    draftRef.current = {};
    setMode("view");
  }, [row, setDraft, setMode]);

  type ViewMode = "list" | "calendar" | "timeline";
  const [view, setView] = React.useState<ViewMode>("list");

  return (
    <DetailsScaffold
      title={row.name}
      subtitle={row.status || ""}
      mode={mode}
      onEdit={() => setMode("edit")}
      onCancel={handleCancel}
      onSave={requestSave}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      rightActions={
        <div className="flex gap-2 items-center" data-bhq-details>
          {row.status === "COMMITTED" ? (
            <Button size="sm" variant="outline" disabled>
              Committed
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={async () => {
                if (!api || !canCommit) return;

                if (!row.lockedCycleStart && draftRef.current.lockedCycleStart) {
                  const locked = String(draftRef.current.lockedCycleStart);
                  const expected = (computeFromLocked as any)(locked);
                  const testingStart = pickExpectedTestingStart(expected, locked);

                  const payload = {
                    lockedCycleStart: locked,
                    lockedOvulationDate: expected.ovulation,
                    lockedDueDate: expected.birth_expected,
                    lockedPlacementStartDate: expected.placement_expected,

                    // Canonical expected (system-derived)
                    expectedCycleStart: locked,
                    expectedHormoneTestingStart: testingStart ?? null,
                    expectedBreedDate: expected.ovulation ?? null,
                    expectedBirthDate: expected.birth_expected ?? null,
                  };

                  try {
                    await api.updatePlan(Number(row.id), payload as any);
                  } catch (err) {
                    console.error("[Breeding] commit pre-persist (lock) failed", err);
                    return; // stop commit if lock couldn’t be persisted
                  }
                }

                const parentPatch: any = {};
                if (effective.damId !== row.damId) parentPatch.damId = effective.damId;
                if (effective.sireId !== row.sireId) parentPatch.sireId = effective.sireId;
                if (Object.keys(parentPatch).length) {
                  try {
                    await api.updatePlan(Number(row.id), parentPatch);
                  } catch (err) {
                    console.error("[Breeding] commit pre-persist (parents) failed", err);
                    return;
                  }
                }

                await onCommitted?.(effective.id);
              }}
              disabled={!canCommit || !api}
            >
              Commit Plan
            </Button>
          )}
          {(() => {
            const isArchived = !!row.archived;
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!onArchive) return;
                  const next = !isArchived;
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
                    utils.toast?.success?.(next ? "Plan archived." : "Plan restored.");
                  } catch (e) {
                    console.error("[Breeding] archive toggle failed", e);
                    const verb = next ? "archive" : "restore";
                    utils.toast?.error?.(`Failed to ${verb} plan. Try again.`);
                  }
                }}
                title={isArchived ? "Unarchive" : "Archive"}
              >
                {isArchived ? "Unarchive" : "Archive"}
              </Button>
            );
          })()}
        </div>
      }
    >
      <div className="relative overflow-x-hidden" data-bhq-details>
        {activeTab === "overview" && (
          <div className="space-y-4 mt-2">
            {/* Plan Info */}
            <SectionCard title="Plan Info">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Plan Name</div>
                  {isEdit ? (
                    <Input defaultValue={row.name} onChange={(e) => setDraftLive({ name: e.currentTarget.value })} />
                  ) : (
                    <DisplayValue value={row.name} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-secondary mb-1">Nickname</div>
                  {isEdit ? (
                    <Input defaultValue={row.nickname ?? ""} onChange={(e) => setDraftLive({ nickname: e.currentTarget.value })} />
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
                  <div className="text-xs text-secondary mb-1">Species</div>
                  {isEdit ? (
                    <select
                      className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                      value={effective.species || ""}
                      onChange={async (e) => {
                        const next = e.currentTarget.value as SpeciesUi;
                        const willClear = Boolean((effective.damId ?? null) || (effective.sireId ?? null) || (effective.breedText ?? ""));
                        if (willClear) {
                          const ok = await confirmModal({
                            title: "Change species?",
                            message: "Changing species will clear Dam, Sire, and Breed. Continue?",
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
                    <DisplayValue value={row.species || ""} />
                  )}
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <div className="text-xs text-secondary mb-1">Breed</div>
                  {isEdit ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
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
                          onChange={(hit: any) => setDraftLive({ breedText: hit?.name ?? "" })}
                          api={breedBrowseApi}
                        />
                      </div>

                      {hasBreed && (
                        <Button variant="ghost" size="sm" onClick={() => setDraftLive({ breedText: "" })}>
                          Clear
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openCustomBreed((effective.species || "Dog") as SpeciesUi, (name) =>
                            setDraftLive({ breedText: name || "" })
                          )
                        }
                      >
                        New custom
                      </Button>
                    </div>
                  ) : (
                    <DisplayValue value={row.breedText ?? ""} />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Parents */}
            <SectionCard title="Parents">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Dam">
                  {!isEdit ? (
                    <div className="text-sm">{row.damName || "—"}</div>
                  ) : (
                    <>
                      <Input
                        value={editDamQuery}
                        onChange={(e) => setEditDamQuery(e.currentTarget.value)}
                        onFocus={() => {
                          setEditDamFocus(true);
                          if (editDamQuery.trim() === (row.damName || "").trim()) setEditDamQuery("");
                        }}
                        onBlur={() => setEditDamFocus(false)}
                        placeholder="Search Dam…"
                      />
                      {editDamFocus && (
                        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                          {editDamOptions.length > 0 ? (
                            editDamOptions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setDraftLive({ damId: a.id, damName: a.name });
                                  setEditDamQuery(a.name);
                                  setEditDamFocus(false);
                                }}
                                className={`w-full px-2 py-1 text-left hover:bg-white/5 ${row.damId === a.id ? "bg-white/10" : ""}`}
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
                            <div className="px-2 py-2 text-sm text-secondary">No females found</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Field>

                <Field label="Sire">
                  {!isEdit ? (
                    <div className="text-sm">{row.sireName || "—"}</div>
                  ) : (
                    <>
                      <Input
                        value={editSireQuery}
                        onChange={(e) => setEditSireQuery(e.currentTarget.value)}
                        onFocus={() => {
                          setEditSireFocus(true);
                          if (editSireQuery.trim && editSireQuery.trim() === (row.sireName || "").trim()) setEditSireQuery("");
                        }}
                        onBlur={() => setEditSireFocus(false)}
                        placeholder="Search Sire…"
                      />
                      {editSireFocus && (
                        <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                          {editSireOptions.length > 0 ? (
                            editSireOptions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setDraftLive({ sireId: a.id, sireName: a.name });
                                  setEditSireQuery(a.name);
                                  setEditSireFocus(false);
                                }}
                                className={`w-full px-2 py-1 text-left hover:bg-white/5 ${row.sireId === a.id ? "bg-white/10" : ""}`}
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
                            <div className="px-2 py-2 text-sm text-secondary">No males found</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Field>
              </div>
            </SectionCard>

            {/* Cycle Selection */}
            <SectionCard title="Breeding Cycle Selection">
              <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <div className="text-xs text-secondary mb-1">Upcoming Cycles (Projected Start Dates)</div>

                  {isLocked ? (
                    <DisplayValue value={fmt(effective.lockedCycleStart)} />
                  ) : (
                    (() => {
                      const hasSelection = !!pendingCycle;
                      const parentsSet = effective.damId != null && effective.sireId != null;
                      const ringColor = hasSelection && parentsSet ? "hsl(var(--green-600))" : "hsl(var(--hairline))";
                      const options = [...projectedCycles];
                      if (pendingCycle && !options.includes(pendingCycle)) options.unshift(pendingCycle);

                      return (
                        <div className="relative">
                          <select
                            className="relative z-10 w-full h-9 rounded-md px-2 text-sm text-primary bg-surface border border-hairline"
                            value={pendingCycle ?? ""}
                            onChange={(e) => setPendingCycle(e.currentTarget.value || null)}
                            disabled={!row.damId}
                          >
                            <option value="">{!row.damId ? "Select a Dam to view cycles" : "—"}</option>
                            {options.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-md" style={{ boxShadow: `0 0 0 2px ${ringColor}` }} />
                        </div>
                      );
                    })()
                  )}
                  {!!damLoadError && <div className="text-xs text-red-600 mt-1">{damLoadError}</div>}
                </div>

                {/* Lock / Unlock button */}
                {isLocked ? (
                  <div className="rounded-md" style={{ padding: 2, background: "var(--green-600,#166534)" }}>
                    <button
                      type="button"
                      onClick={unlockCycle}
                      className="h-9 px-3 rounded-[6px] text-sm font-medium bg-transparent flex items-center gap-2"
                      style={{ color: "var(--green-200,#bbf7d0)" }}
                      title="Unlock cycle"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                        <rect x="5" y="10" width="14" height="10" rx="2" />
                      </svg>
                      Cycle LOCKED
                    </button>
                  </div>
                ) : (
                  (() => {
                    const lockEnabled = !!(pendingCycle && effective.damId != null && effective.sireId != null);
                    return (
                      <div className="rounded-md" style={{ padding: 2 }}>
                        <button
                          type="button"
                          onClick={lockCycle}
                          disabled={!lockEnabled}
                          className={[
                            "h-9 px-3 rounded-[6px] text-sm font-medium flex items-center gap-2",
                            "border-2",
                            lockEnabled ? "border-[hsl(var(--green-600))] text-[hsl(var(--green-200))]" : "border-hairline text-secondary",
                            "bg-transparent disabled:opacity-60",
                          ].join(" ")}
                          title={lockEnabled ? "Lock cycle" : "Select a cycle and both parents first"}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M12 5a5 5 0 0 1 5 5" />
                            <rect x="5" y="10" width="14" height="10" rx="2" />
                          </svg>
                          Select Cycle to Lock
                        </button>
                      </div>
                    );
                  })()
                )}
              </div>
            </SectionCard>

            {/* Sticky footer Close button for Overview */}
            <div className="sticky bottom-0 pt-4 mt-8 bg-gradient-to-t from-[rgba(0,0,0,0.04)] to-transparent">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mode === "edit") {
                      handleCancel();
                    }
                    const fn = (typeof closeDrawer === "function" && closeDrawer) || __bhq_findDetailsDrawerOnClose();
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="min-w-0">
                <SectionCard title="EXPECTED DATES (SYSTEM CALCULATED)">
                  {isEdit && !expectedsEnabled && (
                    <div className="text-xs text-[hsl(var(--brand-orange))] mb-2">
                      Select a <b>Female</b>, select a <b>Male</b>, and <b>lock the cycle</b> to enable Expected Dates.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateField label="CYCLE START (EXPECTED)" value={expectedCycleStart} readOnly />
                    <DateField label="HORMONE TESTING START (EXPECTED)" value={expectedTestingStart} readOnly />
                    <DateField label="BREEDING DATE (EXPECTED)" value={expectedBreed} readOnly />
                    <DateField label="BIRTH DATE (EXPECTED)" value={fmt(expectedBirth)} readOnly />
                    <DateField label="WEANED DATE (EXPECTED)" value={expectedWeaned} readOnly />
                    <DateField label="PLACEMENT START (EXPECTED)" value={expectedPlacementStart} readOnly />
                    <DateField label="PLACEMENT COMPLETED (EXPECTED)" value={expectedGoHomeExtended} readOnly />
                  </div>
                </SectionCard>
              </div>

              <div className="min-w-0">
                <SectionCard title="ACTUAL DATES">
                  {/* Exempt this whole section from drawer compaction */}
                  <div data-bhq-details-exempt className="bhq-details-exempt">
                    {isEdit && !committedOrLater && (
                      <div className="text-xs text-[hsl(var(--brand-orange))] mb-2">
                        Commit the plan to enable Actual Dates.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <div className="text-xs text-secondary mb-1">CYCLE START (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.cycleStartDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ cycleStartDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">HORMONE TESTING START (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.hormoneTestingStartDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ hormoneTestingStartDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">BREEDING DATE (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.breedDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ breedDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">BIRTH DATE (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.birthDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ birthDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">WEANED DATE (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.weanedDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ weanedDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">PLACEMENT START (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.placementStartDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ placementStartDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">PLACEMENT COMPLETED (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.placementCompletedDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ placementCompletedDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-secondary mb-1">PLAN COMPLETED (ACTUAL)</div>
                        <CalendarInput
                          defaultValue={row.completedDateActual ?? ""}
                          readOnly={!canEditDates}
                          onChange={(e) => canEditDates && setDraftLive({ completedDateActual: e.currentTarget.value })}
                          className={dateFieldW}
                          inputClassName={dateInputCls}
                          placeholder="mm/dd/yyyy"
                        />
                      </div>
                    </div>

                    {isEdit && (
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          variant="outline"
                          disabled={!canEditDates}
                          onClick={() => {
                            if (!canEditDates) return;
                            if (!window.confirm(
                              "Reset ALL actual date fields (Cycle Start, Hormone Testing Start, Breeding, Birthed, Weaned, Placement Start, Placement Completed, Plan Completed)?"
                            )) return;
                            setDraftLive({
                              cycleStartDateActual: null,
                              hormoneTestingStartDateActual: null,
                              breedDateActual: null,
                              birthDateActual: null,
                              weanedDateActual: null,
                              placementStartDateActual: null,
                              placementCompletedDateActual: null,
                              completedDateActual: null,
                            });
                          }}
                        >
                          Reset Dates
                        </Button>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>

            {/* Sticky footer Close button for Dates tab */}
            <div className="sticky bottom-0 pt-4 mt-8 bg-gradient-to-t from-[rgba(0,0,0,0.04)] to-transparent">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mode === "edit") {
                      handleCancel();
                    }
                    const fn = (typeof closeDrawer === "function" && closeDrawer) || __bhq_findDetailsDrawerOnClose();
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

      {activeTab === "deposits" && (
        <div className="space-y-2">
          <SectionCard title="Deposits">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-secondary mb-1">Deposits Committed</div>
                <div>${((row.depositsCommitted ?? 0) / 100).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Deposits Paid</div>
                <div>${((row.depositsPaid ?? 0) / 100).toLocaleString()}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-secondary mb-1">Deposit Risk</div>
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
                  const fn = (typeof closeDrawer === "function" && closeDrawer) || __bhq_findDetailsDrawerOnClose();
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

      {activeTab === "audit" && (
        <div className="space-y-2">
          <SectionCard title="Audit">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-secondary mb-1">Created</div>
                <div>{fmt(row.createdAt) || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Last Updated</div>
                <div>{fmt(row.updatedAt) || "—"}</div>
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
                  const fn = (typeof closeDrawer === "function" && closeDrawer) || __bhq_findDetailsDrawerOnClose();
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
    </DetailsScaffold>
  );
}
