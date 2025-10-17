// apps/animals/src/App-Animals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { components, hooks, overlay, storage } from "@bhq/ui";

import { makeApi } from "./api";
import { BreedFormControl } from "./components/BreedEditor";
import OwnershipEditor from "./components/OwnershipEditor";
import { OwnershipChips } from "./components/OwnershipChips";
import type { OwnerRow as OwnershipRow } from "./components/OwnershipEditor";

/* Local Badge */
function Badge(props: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline bg-surface-strong px-2 py-0.5 text-xs">
      {props.children}
    </span>
  );
}

/* Types */
type ID = string | number;
type SortDir = "asc" | "desc";
type Species = "Dog" | "Cat" | "Horse";
type Sex = "Male" | "Female";
type Status = "Active" | "Breeding" | "Unavailable" | "Retired" | "Deceased" | "Prospect";

type AnimalDTO = {
  id: ID;
  name: string;
  species: Species;
  breed?: string | null;
  sex: Sex;
  dob?: string | null;
  age?: string | null;
  status: Status;
  microchip?: string | null;
  ownerId?: ID | null;
  ownerName?: string | null;
  tags?: string[] | null;
  lastCycle?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  archived?: boolean | null;
};

type AnimalRow = AnimalDTO;
type SortRule = { key: keyof AnimalRow; dir: SortDir };



/* Pref keys */
const COL_STORAGE_KEY = "bhq_animals_cols_v1";
const SORT_STORAGE_KEY = "bhq_animals_sorts_v1";
const Q_STORAGE_KEY = "bhq_animals_q_v1";
const PAGE_SIZE_STORAGE_KEY = "bhq_animals_page_size_v1";
const FILTERS_STORAGE_KEY = "bhq_animals_filters_v1";
const SHOW_FILTERS_STORAGE_KEY = "bhq_animals_show_filters_v1";

/* Columns */
type ColumnDef = {
  key: keyof AnimalRow;
  label: string;
  default?: boolean;
  type?: "text" | "date" | "status" | "tags";
  center?: boolean;
  render?: (r: AnimalRow) => React.ReactNode;
};

const ALL_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name", default: true, type: "text" },
  { key: "species", label: "Species", default: true, type: "text" },
  { key: "breed", label: "Breed", default: true, type: "text" },
  { key: "sex", label: "Sex", default: true, type: "text" },
  { key: "dob", label: "Date of Birth", default: true, type: "date" },
  { key: "age", label: "Age", default: true, type: "text" },
  { key: "status", label: "Status", default: true, type: "status", render: (r) => <Badge>{r.status}</Badge> },
  { key: "ownerName", label: "Owner", default: true, type: "text" },
  {
    key: "tags", label: "Tags", default: true, type: "tags",
    render: (r) => (
      <span className="flex gap-1 flex-wrap">
        {(r.tags || []).map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full border border-hairline bg-surface-strong px-2 py-0.5 text-xs"
          >
            {t}
          </span>
        ))}
      </span>
    ),
  },
  { key: "lastCycle", label: "Last Cycle", default: true, type: "date" },
  { key: "updatedAt", label: "Last Updated", default: true, type: "date" },
  { key: "createdAt", label: "Created", default: false, type: "date" },
  { key: "microchip", label: "Microchip #", default: false, type: "text" },
];



/* Utils */
function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function isInteractive(el: Element | null) {
  if (!el) return false;
  const target = (el as HTMLElement).closest?.(
    "[data-stop-row-open],a,components.Button,components.Input,select,textarea,[role='components.Button']"
  );
  return !!target;
}

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function toEnum(v?: string | null) {
  const s = String(v || "").trim().toUpperCase();
  return s || undefined;
}
function toTitle(v?: string | null) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return null;
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function normalize(dto: AnimalDTO): AnimalRow {
  return {
    ...dto,
    // enums from API (UPPERCASE) → UI (Title Case)
    species: (toTitle(dto.species) || "") as Species,
    sex: (toTitle(dto.sex) || "") as Sex,
    status: (toTitle(dto.status) || "") as Status,

    // server sends birthDate; UI uses dob
    dob: (dto as any).dob ?? (dto as any).birthDate ?? dto.dob ?? null,

    breed: dto.breed ?? null,
    age: dto.age ?? null,
    microchip: dto.microchip ?? null,
    ownerId: dto.ownerId ?? null,
    ownerName: dto.ownerName ?? (dto as any)?.owner?.name ?? null,
    tags: Array.from(new Set((dto.tags || []).filter(Boolean))),
    lastCycle: dto.lastCycle ?? null,
    updatedAt: dto.updatedAt ?? null,
    createdAt: dto.createdAt ?? null,
    archived: dto.archived ?? null,
  };
}

/** ========= ColumnsPopover (single definition) ========= */
function ColumnsPopover({
  columns,
  onToggle,
  onSet,
}: {
  columns: Record<string, boolean>;
  onToggle: (k: string) => void;
  onSet: (next: Record<string, boolean>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // ESC to close
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Positioning
  React.useEffect(() => {
    if (!open) return;
    const PAD = 12;
    const sync = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - PAD * 2);
      const estH = 360;
      let top = r.bottom + 8;
      if (top + estH + PAD > window.innerHeight) top = Math.max(PAD, r.top - estH - 8);
      let left = r.right - width;
      left = Math.max(PAD, Math.min(left, window.innerWidth - PAD - width));
      setPos({ top, left });
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [open]);

  // Bulk actions
  const selectAll = () => {
    const next: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((c) => { next[String(c.key)] = true; });
    onSet(next);
  };
  const clearAll = () => {
    const next: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((c) => { next[String(c.key)] = false; });
    onSet(next);
  };
  const setDefault = () => {
    const next: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((c) => { next[String(c.key)] = !!c.default; });
    onSet(next);
  };

  const menu = open && pos
    ? createPortal(
      // Backdrop host
      <div
        style={{ position: "fixed", inset: 0, zIndex: 2147483646, pointerEvents: "auto" }}
        // Close ONLY when the backdrop itself is clicked
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {/* Panel */}
        <div
          role="menu"
          tabIndex={-1}
          className="rounded-md border border-hairline bg-surface p-2 pr-3 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
          style={{
            position: "fixed",
            top: pos.top!,
            left: pos.left!,
            width: 320,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: 360,
            overflow: "auto",
            pointerEvents: "auto",
            zIndex: 2147483647,
          }}
          // Prevent backdrop from seeing inside clicks (bubble only)
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="text-xs font-medium uppercase text-secondary">Show columns</div>
            <div className="flex items-center gap-3">
              <components.Button
                type="components.Button"
                className="text-xs font-medium hover:underline"
                style={{ color: "hsl(24 95% 54%)" }}
                onClick={selectAll}
              >
                All
              </components.Button>
              <components.Button
                type="components.Button"
                className="text-xs font-medium hover:underline"
                style={{ color: "hsl(190 90% 45%)" }}
                onClick={setDefault}
              >
                Default
              </components.Button>
              <components.Button
                type="components.Button"
                className="text-xs font-medium text-secondary hover:underline"
                onClick={clearAll}
              >
                Clear
              </components.Button>
            </div>
          </div>

          {ALL_COLUMNS.map((c) => {
            const k = String(c.key);
            const checked = !!columns[k];
            const inputId = `col-${k}`;
            return (
              <label
                key={k}
                htmlFor={inputId}
                className="flex items-center gap-2 w-full min-w-0 px-2 py-1.5 text-[13px] leading-5 rounded hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none"
                onClick={(e) => {
                  const tag = (e.target as HTMLElement).tagName.toLowerCase();
                  if (tag !== "components.Input") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle(k);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(k); }
                }}
              >
                <components.Input
                  id={inputId}
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[hsl(var(--brand-orange))]"
                  aria-label={c.label}
                  checked={checked}
                  // Ensure checkbox clicks never bubble up to the backdrop and always toggle
                  onChange={(e) => { e.stopPropagation(); onToggle(k); }}
                />
                <span className="truncate text-primary">{c.label}</span>
              </label>
            );
          })}

          <div className="flex justify-end pt-2">
            <components.Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Close
            </components.Button>
          </div>
        </div>
      </div>,
      getOverlayRoot()
    )
    : null;

  return (
    <div className="relative inline-flex">
      <components.Button
        ref={btnRef as any}
        variant="outline"
        size="icon"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Columns"
        className="h-9 w-9"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="10" y="4" width="5" height="16" rx="1.5" />
          <rect x="17" y="4" width="4" height="16" rx="1.5" />
        </svg>
      </components.Button>
      {menu}
    </div>
  );
}

/** Auth headers (X-Org-Id via localStorage) */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const org = localStorage.getItem("BHQ_ORG_ID");
    if (org) headers["X-Org-Id"] = org;
  } catch { }
  return headers;
}

/** JSON fetch with cookies + org header */
async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
  return body;
}


// Lightweight cycle summary util (local replacement for @bhq/biology)
function computeCycleSummary(dates: string[]) {
  const ds = dates
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (ds.length === 0) return {};

  const gaps: number[] = [];
  for (let i = 1; i < ds.length; i++) {
    const deltaDays = Math.round((ds[i].getTime() - ds[i - 1].getTime()) / 86400000);
    if (Number.isFinite(deltaDays) && deltaDays > 0) gaps.push(deltaDays);
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : undefined;

  const lastCycle = ds[ds.length - 1].toISOString();
  const avgAll = avg(gaps);
  const avg3 = avg(gaps.slice(-3));
  const nextEst =
    (avg3 ?? avgAll) !== undefined
      ? new Date(ds[ds.length - 1].getTime() + (avg3 ?? avgAll!) * 86400000).toISOString()
      : undefined;

  return { lastCycle, avgAll, avg3, nextEst };
}

function SpeciesIcon({ species }: { species?: "Dog" | "Cat" | "Horse" | string | null }) {
  const s = String(species || "").toLowerCase();
  const cls = "h-5 w-5 opacity-80";

  // Dog — paw
  if (s === "dog") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M12.3 13.6c-1.3 0-2.7.7-3.5 1.7-.7.9-.8 2-.2 2.7.7.8 2.3 1.4 3.7 1.4s3-.6 3.7-1.4c.6-.7.5-1.8-.2-2.7-.8-1-2.1-1.7-3.5-1.7Z" />
        <circle cx="7.9" cy="9.1" r="2.0" />
        <circle cx="11.9" cy="7.7" r="2.0" />
        <circle cx="16.1" cy="9.1" r="2.0" />
        <circle cx="10.0" cy="11.0" r="1.6" />
      </svg>
    );
  }

  // Cat — cat head
  if (s === "cat") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M5 9V5l4 2 3-2 3 2 4-2v4c0 5-3.5 9-8.5 9S5 14 5 9Z" />
        <circle cx="10" cy="12" r="0.9" fill="currentColor" />
        <circle cx="14" cy="12" r="0.9" fill="currentColor" />
        <path d="M9.5 14.5c1.2.8 3.8.8 5 0" />
      </svg>
    );
  }

  // Horse — horse head
  if (s === "horse") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M6 10l5-4 6 2-1 3 2 3-2 4H9l-3-3V10Z" />
        <circle cx="14.5" cy="11" r="0.8" fill="currentColor" />
      </svg>
    );
  }

  return null;
}


/* =================== App =================== */
export default function AppAnimals() {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("bhq:module", {
        detail: { key: "animals", label: "Animals" },
      })
    );
  }, []);
  const api = useMemo(() => {
    return makeApi(undefined, () => {
      const headers: Record<string, string> = {};
      try {
        const org = localStorage.getItem("BHQ_ORG_ID");
        if (org) headers["X-Org-Id"] = org;
      } catch { }
      return headers;
    });
  }, []);

  const safeGetCreatingOrg = React.useCallback(async () => {
    try {
      const org = await (api as any)?.lookups?.getCreatingOrganization?.();
      if (org && org.id != null) return org;
    } catch { /* fall through */ }
    try {
      const id = localStorage.getItem("BHQ_ORG_ID");
      if (id) {
        return {
          id,
          display_name: localStorage.getItem("BHQ_ORG_NAME") || "My Organization",
        };
      }
    } catch { /* ignore */ }
    return null;
  }, [api]);


  const [creatingOrg, setCreatingOrg] = useState<{ id: string; display_name: string } | null>(null);

  const orgIdLS = React.useMemo(() => {
    try { return localStorage.getItem("BHQ_ORG_ID") || undefined; } catch { return undefined; }
  }, []);

  useEffect(() => {
    (async () => setCreatingOrg(await safeGetCreatingOrg()))();
  }, [safeGetCreatingOrg]);

  // Resolve the org id we will send along with breed search requests
  const [orgIdForBreeds, setOrgIdForBreeds] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Prefer server/session org id; fall back to localStorage (orgIdLS)
    if (creatingOrg?.id) setOrgIdForBreeds(String(creatingOrg.id));
    else if (orgIdLS) setOrgIdForBreeds(String(orgIdLS));
  }, [creatingOrg?.id, orgIdLS]);


  function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="rounded-md border border-hairline p-3">
        <div className="text-[11px] font-semibold uppercase text-secondary">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    );
  }

  function CycleTab({ animal }: { animal: AnimalRow }) {
    const [dates, setDates] = React.useState<string[]>(
      () => (animal as any).cycleStartDates || []
    );
    const [newDate, setNewDate] = React.useState<string>("");
    const [note, setNote] = React.useState<string>("");

    React.useEffect(() => {
      (animal as any).cycleStartDates = dates;
    }, [dates, animal]);

    // KPI summary (biology helper with safe fallback)
    let last = "—", avgAll = "—", avg3 = "—", nextEst = "—";
    try {
      const s: any = computeCycleSummary?.(dates) || {};
      if (s.lastCycle) last = new Date(s.lastCycle).toLocaleDateString();
      if (s.avgAll) avgAll = `${s.avgAll} d`;
      if (s.avg3) avg3 = `${s.avg3} d`;
      if (s.nextEst) nextEst = new Date(s.nextEst).toLocaleDateString();
    } catch {
      if (dates.length) {
        last = new Date(dates[dates.length - 1]).toLocaleDateString();
        nextEst = new Date(
          new Date(dates[dates.length - 1]).getTime() + 180 * 24 * 3600 * 1000
        ).toLocaleDateString();
      }
    }

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <Field label="Last Cycle" value={last} />
          <Field label="Avg Cycle (All)" value={avgAll} />
          <Field label="Avg (Last 3)" value={avg3} />
          <Field label="Next Cycle (Est.)" value={nextEst} />
        </div>

        <div className="rounded-md border border-hairline">
          <div className="flex items-center justify-between p-2 text-sm border-b border-hairline">
            <div className="font-medium">Cycle Start Dates</div>
            <components.Button
              type="components.Button"
              onClick={() => {
                if (!newDate) return;
                setDates(arr => [...arr, newDate].sort());
                setNewDate("");
                setNote("");
              }}
            >
              + Add Cycle Start Date
            </components.Button>
          </div>

          <div className="p-2 flex gap-2">
            <components.Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <components.Input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {dates.map((d) => (
            <div key={d} className="flex items-center justify-between px-2 py-1 border-t border-hairline text-sm">
              <div className="flex-1">{new Date(d).toLocaleDateString()}</div>
              <div className="flex items-center gap-2">
                <components.Button
                  variant="outline"
                  onClick={() => {
                    const next = window.prompt("Edit date (yyyy-mm-dd)", d);
                    if (next) setDates((arr) => arr.map((x) => (x === d ? next : x)).sort());
                  }}
                >
                  Edit
                </components.Button>
                <components.Button variant="ghost" onClick={() => setDates((arr) => arr.filter((x) => x !== d))}>
                  Delete
                </components.Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  /* Prefs */
  const [columns, setColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(COL_STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : ALL_COLUMNS.reduce((acc, c) => ({ ...acc, [String(c.key)]: !!c.default }), {} as Record<string, boolean>);
  });
  useEffect(() => {
    const valid = new Set(ALL_COLUMNS.map((c) => String(c.key)));
    const hasStale = Object.keys(columns).some((k) => !valid.has(k));
    if (hasStale) {
      const next: Record<string, boolean> = {};
      ALL_COLUMNS.forEach((c) => { next[String(c.key)] = !!columns[String(c.key)]; });
      setColumns(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // one-time clean
  const [sorts, setSorts] = useState<SortRule[]>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [q, setQ] = useState<string>(() => localStorage.getItem(Q_STORAGE_KEY) || "");
  const dq = useDebounced(q, 300);

  const [pageSize, setPageSize] = useState<number>(() => Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY) || 25));
  const [page, setPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(() => localStorage.getItem(SHOW_FILTERS_STORAGE_KEY) === "1");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sorts)); }, [sorts]);
  useEffect(() => { localStorage.setItem(Q_STORAGE_KEY, q); }, [q]);
  useEffect(() => { localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize)); }, [pageSize]);
  useEffect(() => { localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters)); }, [filters]);
  useEffect(() => { localStorage.setItem(SHOW_FILTERS_STORAGE_KEY, showFilters ? "1" : "0"); }, [showFilters]);

  /* Create/Edit */
  type AnimalStatus =
    | "Active" | "Breeding" | "Unavailable" | "Retired" | "Deceased" | "Prospect";

  const EMPTY_FORM: Partial<AnimalRow> = {
    name: "",
    species: "Dog",
    breed: "",
    _canonicalBreedId: undefined as string | undefined,
    _customBreedId: undefined as number | undefined,
    _breedSnapshot: undefined as any,
    sex: "Female",
    dob: "",
    status: "Active" as AnimalStatus,
    ownerId: null,
    ownerName: "",
    owners: [] as OwnershipRow[],
    microchip: "",
    tags: [],
    notes: "",
  };

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [form, setForm] = useState<Partial<AnimalRow>>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /* Drawer (declare BEFORE any effect that references it) */
  const [drawer, setDrawer] = useState<AnimalRow | null>(null);

  const [drawerTab, setDrawerTab] = useState<
    "overview" | "cycle" | "offspring" | "health" | "documents" | "audit"
  >(() => (localStorage.getItem("bhq_animals_drawertab_v1") as any) || "overview");
  useEffect(() => localStorage.setItem("bhq_animals_drawertab_v1", drawerTab), [drawerTab]);

  // Load ownership when a drawer is opened
  useEffect(() => {
    if (!drawer?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const ownersRes = await (api as any)?.animals?.getOwners?.(drawer.id);
        const ownersArr = Array.isArray(ownersRes) ? ownersRes : (ownersRes?.items ?? []);
        if (!cancelled) {
          setDrawer((d: any) =>
            d && String(d.id) === String(drawer.id) ? { ...d, owners: ownersArr } : d
          );
        }
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [drawer?.id, api]);


  // Default ownership: on *create* only, if empty, seed to creating org (100%)
  useEffect(() => {
    if (!formOpen) return;
    if (editingId != null) return;
    if ((form.owners as OwnershipRow[] | undefined)?.length) return;

    (async () => {
      const org = await safeGetCreatingOrg();
      if (org) {
        setForm((f) => ({
          ...f,
          owners: [{
            partyType: "Organization",
            organizationId: org.id,
            contactId: null,
            display_name: org.display_name,
            is_primary: true,
            percent: 100,
          }] as OwnershipRow[],
        }));
      }
    })();
  }, [formOpen, editingId, safeGetCreatingOrg, form.owners]);


  /* Data */
  const [loading, setLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<AnimalRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  // Close kebab menu on outside click or Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);


  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const sortParam = sorts.map((s) => `${s.dir === "desc" ? "-" : ""}${String(s.key)}`).join(",");
    const query: any = {
      q: dq || undefined,
      limit: pageSize,
      page,
      includeArchived,
      sort: sortParam || undefined,
    };
    (api as any)?.animals
      ?.list?.(query)
      ?.then((res: any) => {
        if (ignore) return;
        const items = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data?.items)
            ? res.data.items
            : Array.isArray(res)
              ? res
              : [];
        setRows(items.map(normalize));
        setTotal(Number(res?.total ?? res?.data?.total ?? items.length ?? 0));
      })
      ?.catch(() => {
        if (!ignore) {
          setRows([]);
          setTotal(0);
        }
      })
      ?.finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [api, dq, pageSize, includeArchived, page, sorts]);

  function clearFieldError(setErr: React.Dispatch<React.SetStateAction<Record<string, string>>>, key: string) {
    setErr((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _drop, ...rest } = prev;
      return rest;
    });
  }


  function validateAnimalForm(f: Partial<AnimalRow>, rows: AnimalRow[]) {
    const e: Record<string, string> = {};

    if (!f.name || String(f.name).trim().length < 2) e.name = "Name is required";
    if (!f.species) e.species = "Species is required";
    if (!f.sex) e.sex = "Sex is required";
    if (!f.dob) e.dob = "Date of Birth is required";

    // Breed must be a REAL selection:
    //  - either Advanced saved a snapshot (_breedSnapshot),
    //  - or user picked a pure breed (one of *_breedId set)
    const hasMixed = !!(f as any)._breedSnapshot;
    const hasPure = !!(f as any)._canonicalBreedId || !!(f as any)._customBreedId;

    if (!hasMixed && !hasPure) {
      e.breed = "Select a breed from the list or use Advanced for a mix.";
    }

    if (f.dob) {
      const d = new Date(String(f.dob));
      if (Number.isNaN(d.getTime()) || d.getTime() > Date.now()) {
        e.dob = "DOB must be a valid date in the past";
      }
    }

    if (f.microchip) {
      const dup = rows.find(
        r => r.microchip && r.microchip === f.microchip && r.id !== (editingId ?? -1)
      );
      if (dup) e.microchip = "Microchip must be unique";
    }

    return e;
  }

  async function saveAnimal() {
    const errs = validateAnimalForm(form, rows);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    const payload: any = {
      name: String(form.name ?? "").trim(),
      species: toEnum(form.species),
      sex: toEnum(form.sex),
      status: toEnum(form.status),
      birthDate: form.dob ? new Date(String(form.dob)).toISOString() : null,
      microchip: (form.microchip ?? "").trim() || null,
      notes: (form as any).notes ?? "",
      ownerId: form.ownerId ?? null,
      ...(form.ownerName ? { ownerName: String(form.ownerName).trim() } : {}),
      tags: Array.isArray(form.tags) ? form.tags : [],
      breed: form.breed || null,
      canonicalBreedId: (form as any)._canonicalBreedId ?? null,
      customBreedId: (form as any)._customBreedId ?? null,
    };

    try {
      // 1) create or update
      // 1) create or update
      let targetId: ID | null = null;
      if (editingId == null) {
        const created = await (api as any)?.animals?.create?.(payload);
        const idLike = created?.id ?? created?.data?.id ?? created?.animalId ?? created;
        targetId =
          idLike !== undefined && idLike !== null
            ? (typeof idLike === "number" ? idLike : String(idLike))
            : null;
      } else {
        await (api as any)?.animals?.update?.(editingId as ID, payload);
        targetId = editingId as ID;
      }

      // --- OWNERSHIP: persist after create/update ---
      // ...
      if (targetId != null) {
        let owners: OwnershipRow[] = (form.owners as OwnershipRow[]) || [];

        if (editingId == null && owners.length === 0) {
          const org = await safeGetCreatingOrg();
          if (org) {
            owners = [{
              partyType: "Organization",
              organizationId: org.id,
              contactId: null,
              display_name: org.display_name,
              is_primary: true,
              percent: 100,
            }];
          }
        }

        if (owners && owners.length >= 0) {
          const saved = await (api as any)?.animals?.putOwners?.(targetId as ID, owners);
          const ownersEcho = Array.isArray(saved) ? saved : owners;
          setRows((prev) =>
            prev.map((r) =>
              String(r.id) === String(targetId) ? { ...(r as any), owners: ownersEcho } : r
            )
          );
          setDrawer((prev: any) =>
            prev && String(prev.id) === String(targetId) ? { ...prev, owners: ownersEcho } : prev
          );
        }
      }
      // ...

      // 2) breeds
      const speciesApi = toEnum(form.species) as "DOG" | "CAT" | "HORSE" | undefined;
      const pendingSnap = (form as any)._breedSnapshot as any | undefined;
      const canonicalId = (form as any)._canonicalBreedId ?? null;
      const customId = (form as any)._customBreedId ?? null;

      if (targetId != null && speciesApi) {
        let body: any | null = null;

        if (pendingSnap) {
          const c = Array.isArray(pendingSnap.canonicalMix) ? pendingSnap.canonicalMix : [];
          const u = Array.isArray(pendingSnap.customMix) ? pendingSnap.customMix : [];
          const total = c.length + u.length;

          body = {
            species: speciesApi,
            primaryBreedId:
              total > 1
                ? null
                : (pendingSnap.primaryBreedId ??
                  (c[0]?.breedId ? String(c[0].breedId) : null)),
            canonical: c.map((r: any) => ({ breedId: String(r.breedId), percentage: Number(r.percentage) || 0 })),
            custom: u.map((r: any) => ({ id: String(r.id), percentage: Number(r.percentage) || 0 })),
          };
        } else if (canonicalId || customId) {
          body = canonicalId
            ? {
              species: speciesApi,
              primaryBreedId: canonicalId,
              canonical: [{ breedId: String(canonicalId), percentage: 100 }],
              custom: [],
            }
            : {
              species: speciesApi,
              primaryBreedId: null,
              canonical: [],
              custom: [{ id: String(customId), percentage: 100 }],
            };
        }

        if (body) {
          const snap = await (api as any)?.animals?.putBreeds?.(targetId as ID, body);

          const nextBreed =
            (snap?.primaryBreedName && String(snap.primaryBreedName)) ||
            (Array.isArray(snap?.canonicalMix) && snap.canonicalMix[0]?.name) ||
            null;

          setRows((prev) =>
            prev.map((r) => (String(r.id) === String(targetId) ? { ...r, breed: nextBreed } : r))
          );
          setDrawer((prev: any) =>
            prev && String(prev.id) === String(targetId) ? { ...prev, breed: nextBreed } : prev
          );

          setForm((s: any) => ({ ...s, _breedSnapshot: undefined }));
        }
      }

      // 3) refresh list
      const sortParam = sorts.map((s) => `${s.dir === "desc" ? "-" : ""}${String(s.key)}`).join(",");
      const query: any = {
        q: dq || undefined,
        limit: pageSize,
        page,
        includeArchived,
        sort: sortParam || undefined,
      };
      const res: any = await (api as any)?.animals?.list?.(query);
      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res)
            ? res
            : [];
      setRows(items.map(normalize));
      setTotal(Number(res?.total ?? items.length ?? 0));

      // Close modal + open saved row
      setFormOpen(false);
      if (editingId == null) {
        const match =
          (payload.microchip
            ? items.find((r: any) => r.microchip === payload.microchip)
            : null) ||
          items.find((r: any) => r.name === payload.name && r.dob === payload.dob) ||
          null;
        setDrawer(match);
      } else {
        const match = items.find((r: any) => String(r.id) === String(editingId)) || null;
        setDrawer(match);
      }
    } catch (e: any) {
      const msg = (e && (e.message || e.error || e.statusText)) || "Failed to save. Please check required fields.";
      setFormErrors((prev) => ({ ...prev, __server: String(msg) }));
    }
  }


  /* Filtering, sorting, paging */
  const dFilters = useDebounced(filters, 250);
  const filteredRows = useMemo(() => {
    const text = (dFilters.__text || "").trim().toLowerCase();
    const f = (k: string) => (dFilters[k] || "").trim().toLowerCase();
    const includes = (hay?: string | null, needle?: string) => !needle || !!hay?.toLowerCase().includes(needle);

    function matchAnyExact(value: string | null | undefined, qv: string | undefined) {
      const tokens = String(qv || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (!tokens.length) return true;
      const v = String(value || "").toLowerCase();
      return tokens.some((t) => v === t);
    }
    function matchesTags(rowTags: string[] | null | undefined, qv: string) {
      if (!qv) return true;
      const tokens = String(qv)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (!tokens.length) return true;
      const have = (rowTags || []).map((t) => String(t).toLowerCase());
      return tokens.some((tok) => have.some((h) => h.includes(tok)));
    }

    return rows.filter((r) => {
      if (!includeArchived && !!r.archived) return false;
      if (text) {
        const hay = [r.name, r.species, r.breed, r.ownerName, ...(r.tags || [])].map((x) =>
          String(x || "").toLowerCase()
        );
        if (!hay.some((h) => h.includes(text))) return false;
      }
      if (!matchAnyExact(r.species, dFilters.species)) return false;
      if (!matchAnyExact(r.status, dFilters.status)) return false;
      if (!includes(r.breed || "", f("breed"))) return false;
      if (!includes(r.ownerName || "", f("ownerName"))) return false;
      if (!matchesTags(r.tags, f("tags"))) return false;
      return true;
    });
  }, [rows, dFilters, includeArchived]);

  const sortedRows = useMemo(() => {
    if (sorts.length === 0) return filteredRows;
    const copy = [...filteredRows];
    const comps = sorts.map((s) => {
      const key = s.key;
      const dir = s.dir === "asc" ? 1 : -1;
      return (a: AnimalRow, b: AnimalRow) => {
        const va = (a as any)[key],
          vb = (b as any)[key];
        if (va == null && vb == null) return 0;
        if (va == null) return -1 * dir;
        if (vb == null) return 1 * dir;
        if (["dob", "lastCycle", "updatedAt", "createdAt"].includes(String(key))) {
          return (new Date(va).getTime() - new Date(vb).getTime()) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      };
    });
    copy.sort((a, b) => {
      for (const cmp of comps) {
        const r = cmp(a, b);
        if (r !== 0) return r;
      }
      return 0;
    });
    return copy;
  }, [filteredRows, sorts]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(pageCount, Math.max(1, page));
  const pageRows = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, clampedPage, pageSize]);

  /* Handlers */
  const toggleColumn = (k: string) => setColumns((prev) => ({ ...prev, [k]: !prev[k] }));
  const cycleSort = (key: keyof AnimalRow, withShift: boolean) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      if (!withShift) {
        if (idx === -1) return [{ key, dir: "asc" }];
        if (prev[idx].dir === "asc") return [{ key, dir: "desc" }];
        return [];
      }
      if (idx === -1) return [...prev, { key, dir: "asc" }];
      const cur = prev[idx];
      if (cur.dir === "asc") {
        const copy = prev.slice();
        copy[idx] = { key, dir: "desc" };
        return copy;
      }
      const copy = prev.slice();
      copy.splice(idx, 1);
      return copy;
    });
    setPage(1);
  };
  const toggleSelectAll = () =>
    setSelected((prev) => (prev.size === pageRows.length ? new Set() : new Set(pageRows.map((r) => r.id))));
  const toggleSelect = (id: ID) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  /* Export */
  const visibleCols = useMemo(() => ALL_COLUMNS.filter((c) => columns[String(c.key)]), [columns]);
  const exportCSV = (selectedOnly = false) => {
    const header = ["id", ...visibleCols.map((c) => c.label)];
    const src = selectedOnly ? sortedRows.filter((r) => selected.has(r.id)) : sortedRows;
    const lines: string[] = [header.join(",")];
    src.forEach((r) => {
      const vals = [String(r.id)];
      visibleCols.forEach((c) => {
        const raw = (r as any)[c.key];
        let value = "";
        if (c.type === "date") value = formatDate(String(raw || ""));
        else if (c.type === "tags") value = (r.tags || []).join("; ");
        else value = String(raw ?? "");
        vals.push('"' + String(value).replace(/"/g, '""') + '"');
      });
      lines.push(vals.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = selectedOnly ? "animals-selected.csv" : "animals.csv";
    a.click();
  };

  /* Render */
  return (
    <div className="space-y-3">
      <components.Card className="bhq-components.Card bg-surface/80 bg-gradient-to-b from-[hsl(var(--glass))/65] to-[hsl(var(--glass-strong))/85] backdrop-blur-sm border border-hairline transition-shadow">
        {/* Toolbar */}
        <div className="bhq-section-fixed px-3 py-4 sm:px-4 sm:py-5 bg-surface bg-gradient-to-b from-[hsl(var(--glass))/35] to-[hsl(var(--glass-strong))/55] rounded-t-xl">
          <div className="flex items-center gap-3 justify-between min-w-0">
            {/* LEFT: Search + Filters */}
            <div className="pr-2 flex-none w-full sm:w-[480px] md:w-[560px] lg:w-[640px] max-w-full">
              <div className="relative w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <components.Input
                  value={q}
                  onChange={(e) => { const v = (e.currentTarget?.value ?? ""); setQ(v); setPage(1); }}
                  placeholder="Search any field..."
                  aria-label="Search animals"
                  className="pl-9 pr-20 w-full h-10 rounded-full shadow-sm bg-surface border border-hairline focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] focus:outline-none"
                />
                {q && (
                  <components.Button
                    type="components.Button"
                    aria-label="Clear search"
                    onClick={() => setQ("")}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--brand-orange))]/12"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </components.Button>
                )}
                <span aria-hidden className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-px bg-hairline" />
                <components.Button
                  type="components.Button"
                  aria-label="Toggle filters"
                  aria-pressed={showFilters ? "true" : "false"}
                  onClick={(e) => { setShowFilters((v) => !v); (e.currentTarget as HTMLButtonElement).blur(); }}
                  className={[
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "inline-grid place-items-center h-7 w-7 rounded-full",
                    showFilters ? "bg-[hsl(var(--brand-orange))] text-black" : "text-secondary hover:bg-white/10 focus:bg-white/10",
                  ].join(" ")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="7" x2="14" y2="7" />
                    <circle cx="18" cy="7" r="1.5" fill="currentColor" />
                    <line x1="4" y1="12" x2="11" y2="12" />
                    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                    <line x1="4" y1="17" x2="12" y2="17" />
                    <circle cx="16" cy="17" r="1.5" fill="currentColor" />
                  </svg>
                </components.Button>
              </div>
            </div>

            {/* RIGHT: New + kebab */}
            <div className="flex justify-end gap-2 shrink-0">
              <components.Button
                className="whitespace-nowrap"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...EMPTY_FORM });
                  setFormOpen(true);
                }}
              >
                New&nbsp;Animal
              </components.Button>

              {/* Kebab menu */}
              <div className="relative">
                <components.Button
                  type="components.Button"
                  className="h-10 w-10 rounded-md border border-hairline bg-surface hover:bg-surface-strong text-lg leading-none"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen ? "true" : "false"}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                  onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }}
                >
                  …
                </components.Button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-[999] mt-2 w-48 rounded-xl border border-hairline bg-surface p-2 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <components.Button
                      role="menuitem"
                      className="w-full text-left rounded px-2 py-1.5 text-sm hover:bg-surface-strong"
                      onClick={() => { setMenuOpen(false); exportCSV(false); }}
                      type="components.Button"
                    >
                      Export all (CSV)
                    </components.Button>
                    <components.Button
                      role="menuitem"
                      disabled={selected.size === 0}
                      className={`w-full text-left rounded px-2 py-1.5 text-sm hover:bg-surface-strong ${selected.size === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      onClick={() => { if (selected.size) { setMenuOpen(false); exportCSV(true); } }}
                      type="components.Button"
                    >
                      Export selected (CSV)
                    </components.Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bhq-section-fixed px-4 pb-2 sm:px-5">
            <div className="rounded-xl border border-hairline bg-components.Card p-4">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-3">
                  <div className="text-xs text-secondary mb-1">Species</div>
                  <components.Input placeholder="Dog, Cat, Horse" value={filters.species || ""} onChange={(e: any) => setFilters((f) => ({ ...f, species: e.target.value }))} className="h-9" />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <div className="text-xs text-secondary mb-1">Status</div>
                  <components.Input placeholder="Active, Retired, Prospect" value={filters.status || ""} onChange={(e: any) => setFilters((f) => ({ ...f, status: e.target.value }))} className="h-9" />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <div className="text-xs text-secondary mb-1">Breed</div>
                  <components.Input placeholder="Breed" value={filters.breed || ""} onChange={(e: any) => setFilters((f) => ({ ...f, breed: e.target.value }))} className="h-9" />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <div className="text-xs text-secondary mb-1">Owner</div>
                  <components.Input placeholder="Owner name" value={filters.ownerName || ""} onChange={(e: any) => setFilters((f) => ({ ...f, ownerName: e.target.value }))} className="h-9" />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <div className="text-xs text-secondary mb-1">Tags</div>
                  <components.Input placeholder="tag1, tag2" value={filters.tags || ""} onChange={(e: any) => setFilters((f) => ({ ...f, tags: e.target.value }))} className="h-9" />
                </div>
                <div className="col-span-12 md:col-span-6 flex items-end justify-end gap-2">
                  <components.Button variant="ghost" onClick={() => setFilters({})}>Clear</components.Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bhq-table overflow-hidden">
          <div className="overflow-x-auto overscroll-contain">
            <table className="min-w-max w-full text-sm">
              <thead className="px-3 py-2 cursor-pointer select-none text-center whitespace-nowrap font-medium">
                <tr className="border-t border-b border-hairline">
                  <th className="w-10 px-3 py-2 text-center">
                    <components.Input type="checkbox" aria-label="Select all" checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))} onChange={toggleSelectAll} />
                  </th>
                  {ALL_COLUMNS.filter((c) => columns[String(c.key)]).map((c) => {
                    const active = sorts.find((s) => s.key === c.key);
                    return (
                      <th
                        key={String(c.key)}
                        onClick={(e) => cycleSort(c.key, (e as any).shiftKey)}
                        className={"px-3 py-2 cursor-pointer select-none text-center whitespace-nowrap"}
                      >
                        <span className="inline-flex items-center gap-1">
                          {c.label}
                          {active ? (
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-70">
                              <path fill="currentColor" d={active.dir === "asc" ? "M3 10l5-5 5 5H3z" : "M3 6l5 5 5-5H3z"} />
                            </svg>
                          ) : null}
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-right w-8">
                    <ColumnsPopover
                      columns={columns}
                      onToggle={(k) => setColumns((prev) => ({ ...prev, [k]: !prev[k] }))}
                      onSet={(next) => setColumns(next)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={1 + visibleCols.length} className="px-3 py-8 text-center text-secondary">Loading…</td>
                  </tr>
                )}
                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={1 + visibleCols.length} className="px-3 py-8 text-center">
                      <components.EmptyState title="No results" description="Try adjusting filters or adding a new record." />
                    </td>
                  </tr>
                )}
                {!loading &&
                  pageRows.map((r) => (
                    <tr
                      key={String(r.id)}
                      className="border-b border-hairline hover:bg-surface-strong/50 cursor-pointer"
                      tabIndex={0}
                      onClick={(e) => { if (!isInteractive(e.target as Element)) setDrawer(r); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !isInteractive(e.target as Element)) setDrawer(r); }}
                    >
                      {/* selection checkbox */}
                      <td className="w-10 px-3 py-2">
                        <components.Input
                          data-stop-row-open
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          aria-label={`Select ${r.name}`}
                        />
                      </td>

                      {ALL_COLUMNS.filter((c) => columns[String(c.key)]).map((c) => {
                        const content = c.render
                          ? c.render(r)
                          : c.type === "date"
                            ? (formatDate((r as any)[c.key]) || <span className="text-secondary">—</span>)
                            : c.type === "tags"
                              ? ((r.tags || []).length ? (r.tags || []).join(", ") : <span className="text-secondary">—</span>)
                              : ((r as any)[c.key] ?? <span className="text-secondary">—</span>);

                        return (
                          <td key={String(c.key)} className="px-3 py-2 text-center align-middle">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer — match Contacts */}
        <div className="bhq-section-fixed flex items-start justify-between px-3 py-2 text-sm">
          {/* Left: showing + include archived */}
          <div>
            <div>
              Showing {pageRows.length ? (clampedPage - 1) * pageSize + 1 : 0} to{" "}
              {(clampedPage - 1) * pageSize + pageRows.length} of {total}
            </div>
            <label className="mt-1 inline-flex items-center gap-2 text-xs text-secondary">
              <components.Input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.currentTarget.checked)}
              />
              <span>Include archived</span>
            </label>
          </div>

          {/* Right: pager controls */}
          <div className="flex items-center gap-2">
            <span className="text-secondary">Rows</span>
            <select
              className="h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.currentTarget.value))}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <components.Button
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
            >
              Prev
            </components.Button>

            <div>Page {clampedPage} of {pageCount}</div>

            <components.Button
              variant="ghost"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={clampedPage >= pageCount}
            >
              Next
            </components.Button>
          </div>
        </div>
        {/* Create / Edit Animal */}
        {formOpen &&
          createPortal(
            <div className="fixed inset-0 z-[1000]">
              {/* Single backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setFormOpen(false); }}
              />

              {/* Positioner: place modal slightly higher, like Contacts */}
              <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
                <div className="pointer-events-auto w-[min(720px,calc(100vw-2rem))] rounded-2xl border border-hairline bg-surface p-4 shadow-xl text-primary" style={{ marginTop: "12vh" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-semibold">
                      {editingId == null ? "Create Animal" : "Edit Animal"}
                    </div>
                    <components.Button variant="ghost" onClick={() => setFormOpen(false)}>✕</components.Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1 text-secondary">Name *</label>
                      <components.Input className="text-primary" value={form.name || ""} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} />
                      {formErrors.name && <div className="text-xs text-red-500 mt-1">{formErrors.name}</div>}
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-secondary">Species *</label>
                      <select
                        className="h-10 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none"
                        value={(form.species as any) || "Dog"}
                        onChange={(e) =>
                          setForm((s: any) => ({
                            ...s,
                            species: e.target.value as any,
                            // reset breed selection when SPECIES changes
                            breed: "",
                            _canonicalBreedId: null,
                            _customBreedId: null,
                            _breedSnapshot: undefined,
                          }))
                        }
                      >
                        <option>Dog</option><option>Cat</option><option>Horse</option>
                      </select>
                    </div>

                    <div>
                      <BreedFormControl
                        api={api}
                        speciesUi={(form.species as any) || "Dog"}
                        animalId={editingId ?? null}
                        organizationId={orgIdForBreeds}   // ← UPDATED
                        valueName={form.breed || ""}

                        onPureSelected={(sel) => {
                          setForm((s: any) => ({
                            ...s,
                            breed: sel.name,
                            _canonicalBreedId: sel.canonicalBreedId ?? null,
                            _customBreedId: sel.customBreedId ?? null,
                            _breedSnapshot: undefined,
                          }));
                          clearFieldError(setFormErrors, "breed");
                        }}
                        onMixedSaved={(snap) => {
                          const nextName =
                            (snap.primaryBreedName && String(snap.primaryBreedName)) ||
                            (Array.isArray(snap.canonicalMix) && snap.canonicalMix[0]?.name) ||
                            "";
                          setForm((s: any) => ({
                            ...s,
                            breed: nextName,
                            _canonicalBreedId: null,
                            _customBreedId: null,
                            _breedSnapshot: snap,
                          }));
                          clearFieldError(setFormErrors, "breed");
                        }}
                      />

                      {formErrors.breed && (
                        <div className="text-xs text-red-500 mt-1">{formErrors.breed}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-secondary">Sex *</label>
                      <select
                        className="h-10 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none"
                        value={(form.sex as any) || "Female"}
                        onChange={(e) => {
                          setForm((s: any) => ({ ...s, sex: e.target.value as any }));
                          clearFieldError(setFormErrors, "sex");
                        }}
                      >
                        <option>Female</option><option>Male</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs mb-1 text-secondary">Date of Birth *</label>
                      <components.Input className="text-primary" type="date" value={form.dob || ""} onChange={(e) => setForm(s => ({ ...s, dob: e.target.value }))} />
                      {formErrors.dob && <div className="text-xs text-red-500 mt-1">{formErrors.dob}</div>}
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-secondary">Status</label>
                      <select
                        className="h-10 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary outline-none"
                        value={(form.status as any) || "Active"}
                        onChange={(e) => setForm(s => ({ ...s, status: e.target.value as any }))}
                      >
                        {["Active", "Breeding", "Unavailable", "Retired", "Deceased", "Prospect"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs mb-1 text-secondary">Microchip #</label>
                      <components.Input className="text-primary" value={form.microchip || ""} onChange={(e) => setForm(s => ({ ...s, microchip: e.target.value }))} />
                      {formErrors.microchip && <div className="text-xs text-red-500 mt-1">{formErrors.microchip}</div>}
                    </div>
                    <div className="sm:col-span-2">
                      <OwnershipEditor
                        api={{
                          searchContacts: (q) => (api as any)?.lookups?.searchContacts?.(q) ?? Promise.resolve([]),
                          searchOrganizations: (q) => (api as any)?.lookups?.searchOrganizations?.(q) ?? Promise.resolve([]),
                        }}
                        value={(form.owners as OwnershipRow[]) || []}
                        onChange={(rows) => setForm((s) => ({ ...s, owners: rows }))}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-1 text-secondary">Tags</label>
                      <components.Input
                        className="text-primary"
                        placeholder="tag1, tag2"
                        value={(form.tags as string[] | undefined)?.join(", ") || ""}
                        onChange={(e) => {
                          const tags = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          setForm(s => ({ ...s, tags }));
                        }}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-1 text-secondary">Notes</label>
                      <textarea
                        className="h-28 w-full rounded-md bg-surface border border-hairline px-3 text-sm text-primary placeholder:text-secondary outline-none"
                        value={(form.notes as any) || ""}
                        onChange={(e) => setForm(s => ({ ...s, notes: e.target.value }))}
                        placeholder="Temperament, observations, etc."
                      />
                    </div>
                  </div>

                  {formErrors.__server && (
                    <div className="mt-3 text-sm text-red-500">{formErrors.__server}</div>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <components.Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</components.Button>
                    <components.Button onClick={saveAnimal}>Save</components.Button>
                  </div>
                </div>
              </div>
            </div>,
            getOverlayRoot()
          )
        }
        {/* Drawer (Contacts-style centered panel) */}
        {drawer &&
          createPortal(
            <div className="fixed inset-0 z-[1000]">
              {/* single backdrop */}
              <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setDrawer(null); }}
              />
              {/* same centering + pointer event trick as Create/Edit */}
              <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
                <div
                  className="pointer-events-auto w-[min(720px,calc(100vw-2rem))] max-h-[min(90vh,800px)]
                     overflow-auto rounded-2xl border border-hairline bg-surface p-4 shadow-xl text-primary"
                  style={{ marginTop: "8vh" }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <SpeciesIcon species={drawer.species as any} />
                    <div className="text-xl font-semibold text-primary">{drawer.name}</div>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-surface-strong">
                      {drawer.status}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <components.Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(drawer.id as ID);
                          const safeOwners: OwnershipRow[] = Array.isArray((drawer as any).owners)
                            ? (drawer as any).owners
                            : [];
                          setForm({
                            ...drawer,
                            owners: safeOwners,
                          } as any);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </components.Button>
                      <components.Button variant="ghost" onClick={() => setDrawer(null)}>✕</components.Button>
                    </div>
                  </div>

                  {/* Possible duplicate banner */}
                  {(() => {
                    const sameChip = drawer.microchip
                      ? rows.some(r => String(r.id) !== String(drawer.id) && r.microchip && r.microchip === drawer.microchip)
                      : false;
                    const sameNameDob = drawer.name && drawer.dob
                      ? rows.some(r => String(r.id) !== String(drawer.id) && r.name === drawer.name && r.dob === drawer.dob)
                      : false;
                    if (sameChip || sameNameDob) {
                      return (
                        <div className="mb-3 rounded-md border border-red-300 bg-red-500/10 p-2 text-sm">
                          Possible duplicate detected (same microchip or same name + DOB).
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Tabs */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {[
                      ["overview", "Overview"],
                      ["cycle", "Cycle Info"],
                      ["offspring", "Offspring"],
                      ["health", "Health & Compliance"],
                      ["documents", "Documents"],
                      ["audit", "Audit Log"],
                    ].map(([k, label]) => (
                      <components.Button
                        key={k}
                        onClick={() => setDrawerTab(k as any)}
                        className={`px-3 py-1.5 rounded-md border text-sm ${drawerTab === k ? "bg-primary/10 border-primary" : "bg-surface border-hairline"
                          }`}
                      >
                        {label}
                      </components.Button>
                    ))}
                  </div>

                  {/* Tab bodies (unchanged) */}
                  {drawerTab === "overview" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Species" value={drawer.species} />
                      <Field label="Breed" value={drawer.breed || "Unset"} />
                      <Field label="Sex" value={drawer.sex} />
                      <Field label="DOB" value={drawer.dob ? new Date(drawer.dob).toLocaleDateString() : "None"} />
                      <Field label="Age" value={drawer.age || "None"} />
                      <Field
                        label="Ownership"
                        value={
                          ((drawer as any)?.owners || []).length ? (
                            <OwnershipChips owners={(drawer as any)?.owners || []} />
                          ) : (
                            <span className="text-secondary">None</span>
                          )
                        }
                      />
                      <Field label="Microchip" value={drawer.microchip || "None"} />
                      <div className="sm:col-span-2">
                        <div className="text-[11px] font-semibold uppercase text-secondary mb-1">Tags</div>
                        {(drawer.tags && drawer.tags.length)
                          ? drawer.tags.map(t => (
                            <span key={t} className="mr-1 mb-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                              {t}
                            </span>
                          ))
                          : <div className="text-sm text-secondary">None</div>}
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[11px] font-semibold uppercase text-secondary mb-1">Notes</div>
                        <div className="text-sm">{(drawer as any).notes || "None"}</div>
                      </div>
                    </div>
                  )}

                  {drawerTab === "cycle" && <CycleTab animal={drawer as any} />}
                  {drawerTab === "offspring" && <div className="text-sm text-secondary">No recorded offspring for this animal in the mock.</div>}
                  {drawerTab === "health" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Last Vet Visit" value={(drawer as any).lastVetVisit ? new Date((drawer as any).lastVetVisit).toLocaleDateString() : "None"} />
                      <Field label="Vaccinations" value={((drawer as any).vaccinations || []).length ? ((drawer as any).vaccinations || []).join(", ") : "None"} />
                      <div className="sm:col-span-2 text-xs text-secondary mt-2">Compliance info is informational in this mock.</div>
                    </div>
                  )}
                  {drawerTab === "documents" && <div className="text-sm text-secondary">No documents</div>}
                  {drawerTab === "audit" && <div className="text-sm text-secondary">No audit entries</div>}
                </div>
              </div>
            </div>,
            getOverlayRoot()
          )
        }
      </components.Card>
    </div>
  );
}
