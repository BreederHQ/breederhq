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
import "@bhq/ui/styles/table.css";
import { makeBreedingApi } from "./api";

/* Local components */
import MiniTimeline from "./components/MiniTimeline";
import EventQuickAdd from "./components/EventQuickAdd";

/* Cycle math */
import {
  useCyclePlanner,
  type Species as PlannerSpecies,
  type ExpectedDates as PlannerExpected,
} from "@bhq/ui/hooks";


const MODAL_Z = 2147485000;
const modalRoot = typeof document !== "undefined" ? document.body : null;

/* ───────────────────────── Types ───────────────────────── */

type ID = number | string;

type SpeciesWire = "DOG" | "CAT" | "HORSE";
type SpeciesUi = "Dog" | "Cat" | "Horse";

const toUiSpecies = (s?: string | null): SpeciesUi | "" =>
  s === "DOG" ? "Dog" : s === "CAT" ? "Cat" : s === "HORSE" ? "Horse" : "";

const toWireSpecies = (s: SpeciesUi | ""): SpeciesWire | undefined =>
  s === "Dog" ? "DOG" : s === "Cat" ? "CAT" : s === "Horse" ? "HORSE" : undefined;

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

  expectedDue?: string | null;
  expectedGoHome?: string | null;

  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  goHomeDateActual?: string | null;
  lastGoHomeDateActual?: string | null;

  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  lockedDueDate?: string | null;
  lockedGoHomeDate?: string | null;

  nickname?: string | null;
  breedText?: string | null;
  depositsCommitted?: number | null;
  depositsPaid?: number | null;
  depositRisk?: number | null;

  archived?: boolean;

  completedDateActual?: string | null;
  notes?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

const COLUMNS: Array<{ key: keyof PlanRow & string; label: string; default?: boolean }> = [
  { key: "name", label: "Plan Name", default: true },
  { key: "status", label: "Status", default: true },
  { key: "species", label: "Species", default: true },
  { key: "damName", label: "Dam", default: true },
  { key: "sireName", label: "Sire", default: true },
  { key: "expectedDue", label: "Birth (Exp)", default: true },
  { key: "expectedGoHome", label: "Go Home (Exp)", default: true },
  { key: "code", label: "Code" },
  { key: "nickname", label: "Nickname" },
  { key: "breedText", label: "Breed" },
  { key: "birthDateActual", label: "Whelped" },
  { key: "weanedDateActual", label: "Weaned" },
  { key: "goHomeDateActual", label: "Go Home (Actual)" },
];

const STORAGE_KEY = "bhq_breeding_cols_v2";

/* ─────────────────────── Helpers ─────────────────────── */

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
  const dt = new Date(d);
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

    expectedDue: p.expectedDue ?? p.lockedDueDate ?? null,
    expectedGoHome: p.expectedGoHome ?? p.lockedGoHomeDate ?? null,

    breedDateActual: p.breedDateActual ?? null,
    birthDateActual: p.birthDateActual ?? null,
    weanedDateActual: p.weanedDateActual ?? null,
    goHomeDateActual: p.goHomeDateActual ?? null,
    lastGoHomeDateActual: p.lastGoHomeDateActual ?? null,

    lockedCycleStart: p.lockedCycleStart ?? null,
    lockedOvulationDate: p.lockedOvulationDate ?? null,
    lockedDueDate: p.lockedDueDate ?? null,
    lockedGoHomeDate: p.lockedGoHomeDate ?? null,

    nickname: p.nickname ?? null,
    breedText: p.breedText ?? null,
    depositsCommitted: p.depositsCommittedCents ?? null,
    depositsPaid: p.depositsPaidCents ?? null,
    depositRisk: p.depositRiskScore ?? null,

    archived: p.archived,

    completedDateActual: p.completedDateActual ?? null,
    notes: p.notes ?? null,

    createdAt: p.createdAt ?? p.created_at ?? null,
    updatedAt: p.updatedAt ?? p.updated_at ?? null,
  };
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
  if (opts.sexHint) qs.set("sex", opts.sexHint);
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

/* ───────────────────────── Confirm Modal (overlay root) ───────────────────────── */

function confirmModal(message: string): Promise<boolean> {
  const rootEl = getOverlayRoot();          // body-level mount point
  const host = document.createElement("div");
  host.style.pointerEvents = "auto";
  rootEl.appendChild(host);

  return new Promise((resolve) => {
    const close = (ok: boolean) => { resolve(ok); try { r.unmount(); } catch { } host.remove(); };
    const r = createRoot(host);
    r.render(
      <div className="fixed inset-0 z-[2147483647]">
        <div className="absolute inset-0 bg-black/50" onClick={() => close(false)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[420px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-base font-semibold mb-2">Change species?</div>
            <div className="text-sm text-secondary mb-4">{message}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button onClick={() => close(true)}>Yes, reset</Button>
            </div>
          </div>
        </div>
      </div>
    );
  });
}

/* ───────────────────────── Component ───────────────────────── */

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
      try { const t = await resolveTenantId(); if (!cancelled) setTenantId(t); } catch { }
    })();
    return () => { cancelled = true; };
  }, [tenantId, resolveTenantId]);

  const api = React.useMemo(() => {
    if (tenantId == null) return null;
    return makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });
  }, [tenantId]);

  // Canonical breed list API (like New Animal)
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
    return () => { alive = false; };
  }, [api]);

  /* Search and filters like Contacts */
  const Q_KEY = "bhq_breeding_q_v2";
  const FILTERS_KEY = "bhq_breeding_filters_v2";

  const [q, setQ] = React.useState(() => { try { return localStorage.getItem(Q_KEY) || ""; } catch { return ""; } });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}"); } catch { return {}; } });
  React.useEffect(() => { try { localStorage.setItem(Q_KEY, q); } catch { } }, [q]);
  React.useEffect(() => { try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters || {})); } catch { } }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  /* Data */
  const [rows, setRows] = React.useState<PlanRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!api) { setLoading(true); return; }
      setLoading(true);
      setError(null);
      try {
        const res = await api.listPlans({ include: "parents,org", page: 1, limit: 100, q: qDebounced || undefined });
        const items = Array.isArray((res as any)?.items) ? (res as any).items : [];
        if (!cancelled) setRows(items.map(planToRow));
      } catch (e: any) {
        if (!cancelled) setError(e?.payload?.error || e?.message || "Failed to load plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, qDebounced]);

  /* Columns */
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  /* Filter schema with date detection like Contacts */
  const FILTER_SCHEMA = React.useMemo(() => {
    const dateKeys = new Set([
      "expectedDue", "expectedGoHome", "breedDateActual", "birthDateActual", "weanedDateActual",
      "goHomeDateActual", "lastGoHomeDateActual", "lockedCycleStart", "lockedOvulationDate", "lockedDueDate", "lockedGoHomeDate",
    ] as const);
    return visibleSafe.map(col => {
      if (dateKeys.has(col.key as any)) return ({ key: col.key, label: col.label, editor: "date" as const });
      if (col.key === "status") {
        return ({
          key: "status",
          label: "Status",
          editor: "select" as const,
          options: [
            { label: "Planning", value: "PLANNING" },
            { label: "Cycle Expected", value: "CYCLE_EXPECTED" },
            { label: "Hormone Testing", value: "HORMONE_TESTING" },
            { label: "Bred", value: "BRED" },
            { label: "Pregnant", value: "PREGNANT" },
            { label: "Whelped", value: "WHELPED" },
            { label: "Weaned", value: "WEANED" },
            { label: "Complete", value: "COMPLETE" },
            { label: "Canceled", value: "CANCELED" },
          ],
        });
      }
      if (col.key === "species") {
        return ({
          key: "species",
          label: "Species",
          editor: "select" as const,
          options: [{ label: "Dog", value: "Dog" }, { label: "Cat", value: "Cat" }, { label: "Horse", value: "Horse" }],
        });
      }
      return ({ key: col.key, label: col.label, editor: "text" as const });
    });
  }, [visibleSafe]);

  /* Sorting */
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts(prev => {
      const found = prev.find(s => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc") return prev.map(s => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter(s => s.key !== key);
    });
  };

  /* Client search and filter composition */
  const DATE_KEYS = new Set([
    "expectedDue", "expectedGoHome", "breedDateActual", "birthDateActual", "weanedDateActual",
    "goHomeDateActual", "lastGoHomeDateActual", "lockedCycleStart", "lockedOvulationDate", "lockedDueDate", "lockedGoHomeDate",
  ] as const);

  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    let data = [...rows];

    const lc = (v: any) => String(v ?? "").toLowerCase();

    if (qDebounced) {
      const ql = qDebounced.toLowerCase();
      data = data.filter(r => {
        const hay = [
          r.name, r.nickname, r.breedText, r.status, r.damName, r.sireName, r.species, r.orgName, r.code,
          r.expectedDue, r.expectedGoHome, r.birthDateActual, r.weanedDateActual, r.breedDateActual, r.goHomeDateActual, r.lastGoHomeDateActual,
          r.lockedCycleStart, r.lockedOvulationDate, r.lockedDueDate, r.lockedGoHomeDate,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      data = data.filter(r =>
        active.every(([key, val]) => {
          const raw = (r as any)[key];
          const isDate = DATE_KEYS.has(key as any);
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        })
      );
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
  }, [rows, filters, qDebounced, sorts]);

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
  const [newCode, setNewCode] = React.useState("");
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

  const filterAnimals = React.useCallback(
    (items: AnimalLite[], sex: "FEMALE" | "MALE") => {
      if (!speciesWire) return [];
      return items
        .filter(a => a.sex === sex && a.species === speciesWire)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }))
        .slice(0, 300);
    },
    [speciesWire]
  );

  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (createOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow || ""; };
  }, [createOpen]);

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
    return () => { cancelled = true; clearTimeout(t); };
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
    return () => { cancelled = true; clearTimeout(t); };
  }, [api, tenantId, speciesSelected, speciesWire, sireFocused, sireQuery, filterAnimals]);

  const canCreate = Boolean(newName.trim() && newSpeciesUi && damId);

  const doCreatePlan = async () => {
    if (!api) return;
    if (!canCreate) { setCreateErr("Enter name, species, and select a Dam."); return; }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      const payload: any = {
        name: newName.trim(),
        species: toWireSpecies(newSpeciesUi),
        damId: damId!,
      };
      if (newCode.trim()) payload.code = newCode.trim();
      if (sireId != null) payload.sireId = sireId;
      if (newBreed?.name) payload.breedText = newBreed.name;

      const res = await api.createPlan(payload);
      const plan = (res as any)?.plan ?? res;
      setRows(prev => [planToRow(plan), ...prev]);

      setNewName(""); setNewSpeciesUi(""); setNewCode(""); setNewBreed(null);
      setDamQuery(""); setSireQuery("");
      setDamOptions([]); setSireOptions([]);
      setDamId(null); setSireId(null);
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

  const createEvent = React.useCallback(async (input: { planId: number; type: string; date: string; note?: string }) => {
    if (!api) return;
    switch (input.type) {
      case "HORMONE_TEST":
        await api.createTest(input.planId, { kind: "PROGESTERONE", date: input.date, note: input.note });
        break;
      case "ATTEMPT":
        await api.createAttempt(input.planId, { method: "NATURAL", date: input.date, note: input.note });
        break;
      case "PREG_CHECK":
        await api.createPregCheck(input.planId, { method: "ULTRASOUND", date: input.date, result: "POSITIVE", note: input.note });
        break;
      case "WHELPED":
        await api.createEvent(input.planId, { type: "WHELPED", date: input.date, note: input.note });
        break;
      case "WEANED":
        await api.createEvent(input.planId, { type: "WEANED", date: input.date, note: input.note });
        break;
    }
    const fresh = await api.getPlan(input.planId, "parents,org");
    setRows(prev => prev.map(r => (Number(r.id) === input.planId ? planToRow(fresh) : r)));
  }, [api]);

  /* Details Drawer Config aligned with Contacts */
  const detailsConfig = React.useMemo(() => {
    return {
      idParam: "planId",
      getRowId: (r: PlanRow) => r.id,
      width: 900,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: async (id: ID) => planToRow(await api!.getPlan(Number(id), "parents,org")),
      onSave: async (id: ID, draft: Partial<PlanRow>) => {
        if (!api) return;
        const updated = await api.updatePlan(Number(id), draft as any);
        setRows(prev => prev.map(r => (r.id === id ? planToRow(updated) : r)));
      },
      header: (r: PlanRow) => ({ title: r.name, subtitle: r.status || "" }),
      tabs: [
        { key: "overview", label: "Overview" },
        { key: "deposits", label: "Deposits" },
        { key: "audit", label: "Audit" },
      ],
      customChrome: true,
      render: (props: any) => (
        <PlanDetailsView
          {...props}
          api={api}
          tenantId={tenantId}
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
        />
      ),
    };
  }, [api, tenantId, setRows]);

  /* Table custom cells */
  const CELL_RENDERERS: Record<string, (r: PlanRow) => React.ReactNode> = {
    expectedDue: (r) => <div className="py-1"><div className="text-xs mb-1">{fmt(r.expectedDue) || ""}</div></div>,
    expectedGoHome: (r) => <div className="py-1"><div className="text-xs mb-1">{fmt(r.expectedGoHome) || ""}</div></div>,
  };

  return (
    <>
      {/* Ensure the overlay host exists at app boot */}
      <OverlayMount />

      <div className="p-4 space-y-4">
        <div className="relative">
          <PageHeader title="Breeding" subtitle="Create and manage breeding plans" />
          <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1" style={{ zIndex: 5, pointerEvents: "auto" }}>
            <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!api}>New Breeding Plan</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setQuickAddPlanId(pageRows[0]?.id ?? null); setQuickAddOpen(true); }}
              disabled={!api}
            >
              + Event
            </Button>
          </div>
        </div>

        {customBreedOpen && modalRoot &&
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
          )
        }

        <Card>
          <div className="bhq-details-drawer">
            <DetailsHost rows={rows} config={detailsConfig}>
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
                    allColumns={COLUMNS}
                    triggerClassName="bhq-columns-trigger"
                  />
                )}
                stickyRightWidthPx={40}
              >
                {/* Toolbar */}
                <div className="bhq-table__toolbar px-2 pt-2 pb-3 relative z-30">
                  <SearchBar
                    value={q}
                    onChange={setQ}
                    placeholder="Search any field…"
                    widthPx={520}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setFiltersOpen(v => !v)}
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
                    {!api && (
                      <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">Resolving tenant…</div></TableCell></TableRow>
                    )}

                    {api && loading && (
                      <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">Loading plans…</div></TableCell></TableRow>
                    )}

                    {api && !loading && error && (
                      <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-red-600">Error: {error}</div></TableCell></TableRow>
                    )}

                    {api && !loading && !error && pageRows.length === 0 && (
                      <TableRow><TableCell colSpan={visibleSafe.length}><div className="py-8 text-center text-sm text-secondary">No breeding plans yet.</div></TableCell></TableRow>
                    )}

                    {api && !loading && !error && pageRows.length > 0 &&
                      pageRows.map(r => (
                        <TableRow key={r.id} detailsRow={r}>
                          {visibleSafe.map(c => {
                            let v = (r as any)[c.key] as any;
                            if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                            if (Array.isArray(v)) v = v.join(", ");
                            const custom = CELL_RENDERERS[c.key];
                            return (
                              <TableCell key={c.key}>
                                {custom ? custom(r) : (v ?? "")}
                              </TableCell>
                            );
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
                  onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                  start={start}
                  end={end}
                  filteredTotal={displayRows.length}
                  total={rows.length}
                />
              </Table>
            </DetailsHost>

            {/* Quick Add Event modal — force its own top-level stacking context */}
            {quickAddOpen && modalRoot &&
              createPortal(
                <div
                  className="fixed inset-0"
                  style={{ zIndex: MODAL_Z, isolation: "isolate" }}
                  onMouseDown={(e) => { if (e.target === e.currentTarget) setQuickAddOpen(false); }}
                >
                  {/* Backdrop */}
                  <div className="absolute inset-0 bg-black/50" />

                  {/* Centered content */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto">
                      <EventQuickAdd
                        planId={quickAddPlanId ?? undefined}
                        onClose={() => setQuickAddOpen(false)}
                        onCreate={createEvent}
                      />
                    </div>
                  </div>
                </div>,
                modalRoot
              )
            }
          </div>
        </Card>

        {/* Create Plan Modal — identical overlay pattern to Contacts */}
        <Overlay
          root={modalRoot}
          open={createOpen}
          onOpenChange={(v) => { if (!createWorking) setCreateOpen(v); }}
          ariaLabel="Create Breeding Plan"
          closeOnEscape
          closeOnOutsideClick
        >
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
              <div
                className="fixed inset-0"
                style={{ zIndex: MODAL_Z, isolation: "isolate" }}
                onMouseDown={handleOutsideMouseDown}
              >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Centered card */}
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
                          <div className="text-xs text-secondary mb-1">Species <span className="text-[hsl(var(--brand-orange))]">*</span></div>
                          <select
                            className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                            value={newSpeciesUi}
                            onChange={(e) => {
                              const next = e.target.value as SpeciesUi | "";
                              setNewSpeciesUi(next);
                              setDamId(null); setSireId(null);
                              setDamQuery(""); setSireQuery("");
                              setDamOptions([]); setSireOptions([]);
                            }}
                          >
                            <option value="">—</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Horse">Horse</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <div className="text-xs text-secondary mb-1">Code</div>
                          <Input value={newCode} onChange={(e) => setNewCode(e.currentTarget.value)} placeholder="PLN-2026-01" />
                        </div>
                      </div>
                      {/* Breed (search + browse + new custom) */}
                      <div className="sm:col-span-3">
                        <div className="text-xs text-secondary mb-1">Breed</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <BreedCombo
                              orgId={orgIdForBreeds ?? undefined}
                              species={newSpeciesUi || "Dog"}
                              value={newBreed}
                              onChange={setNewBreed}
                              api={breedBrowseApi}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const speciesEnum = (String(newSpeciesUi || "Dog").toUpperCase() as "DOG" | "CAT" | "HORSE");
                              setCustomBreedSpecies(speciesEnum);
                              setOnCustomBreedCreated(() => (created) => {
                                setNewBreed({ id: created.id, name: created.name, species: newSpeciesUi || "Dog", source: "custom" } as any);
                                setCustomBreedOpen(false);
                              });
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
                                damOptions.map(a => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setDamId(a.id); setDamQuery(a.name); setDamFocused(false); }}
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
                                onClick={() => { setDamId(null); setDamQuery(""); }}
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
                                sireOptions.map(a => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setSireId(a.id); setSireQuery(a.name); setSireFocused(false); }}
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
                                onClick={() => { setSireId(null); setSireQuery(""); }}
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
                          <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createWorking}>Cancel</Button>
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
      </div>
    </>
  );
}

/* ───────── Small helpers ───────── */

function CalendarInput({
  showIcon,
  readOnly,
  className,
  ...rest
}: React.ComponentProps<typeof Input> & { showIcon?: boolean }) {
  const isReadOnly = !!readOnly;
  const inputType = isReadOnly ? "text" : "date";

  return (
    <div className="relative">
      <Input
        {...rest}
        type={inputType as any}
        readOnly={isReadOnly}
        className={[
          "w-full h-8 py-0 px-2 text-sm bg-transparent border-hairline",
          !isReadOnly ? "appearance-none [::-webkit-calendar-picker-indicator]:hidden [color-scheme:dark]" : "",
          className || "",
        ].join(" ")}
      />
      {showIcon && !isReadOnly && (
        <svg
          viewBox="0 0 24 24"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )}
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

/* ───────── Details View aligned to Contacts ───────── */



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
}) {
  const { row, mode, setMode, setDraft, activeTab, setActiveTab, requestSave, api, tenantId, breedBrowseApi, orgIdForBreeds, openCustomBreed } = props;
  const isEdit = mode === "edit";

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
    return () => { cancelled = true; };
  }, [api, row.damId]);

  const species = (row.species || "Dog") as PlannerSpecies;
  const { projectedCycles, computeFromLocked } = useCyclePlanner({
    species,
    reproAsc: damRepro?.repro ?? [],
    lastActualHeatStart: damRepro?.last_heat ?? null,
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

  function lockCycle() {
    if (!pendingCycle) return; // no mode flip
    const expected = computeFromLocked(pendingCycle);
    setExpectedPreview(expected);
    setLockedPreview(true);
    setDraft({
      lockedCycleStart: pendingCycle,
      lockedOvulationDate: expected.ovulation,
      lockedDueDate: expected.birth_expected,
      lockedGoHomeDate: expected.gohome_expected,
      expectedDue: expected.birth_expected,
      expectedGoHome: expected.gohome_expected,
    });
  }
  function unlockCycle() {
    setExpectedPreview(null);
    setLockedPreview(false);
    setDraft({
      lockedCycleStart: null,
      lockedOvulationDate: null,
      lockedDueDate: null,
      lockedGoHomeDate: null,
      expectedDue: null,
      expectedGoHome: null,
    });
  }

  const expectedBirth = expectedPreview?.birth_expected || row.lockedDueDate || row.expectedDue || "";
  const expectedGoHome = expectedPreview?.gohome_expected || row.lockedGoHomeDate || row.expectedGoHome || "";
  const expectedBreed = expectedPreview?.ovulation || row.lockedOvulationDate || "";

  const [editDamQuery, setEditDamQuery] = React.useState<string>("");
  const [editSireQuery, setEditSireQuery] = React.useState<string>("");
  const [editDamOptions, setEditDamOptions] = React.useState<AnimalLite[]>([]);
  const [editSireOptions, setEditSireOptions] = React.useState<AnimalLite[]>([]);
  const [editDamFocus, setEditDamFocus] = React.useState(false);
  const [editSireFocus, setEditSireFocus] = React.useState(false);

  const wasEditRef = React.useRef(isEdit);
  React.useEffect(() => {
    if (!wasEditRef.current && isEdit) {
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
      if (!cancelled) setEditDamOptions(all.filter(a => a.species === key && a.sex === "FEMALE"));
    })();
    return () => { cancelled = true; };
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
      if (!cancelled) setEditSireOptions(all.filter(a => a.species === key && a.sex === "MALE"));
    })();
    return () => { cancelled = true; };
  }, [isEdit, editSireFocus, editSireQuery, row.species, tenantId]);

  const canEditDates = isEdit && !!row.damId && (lockedPreview || !!row.lockedCycleStart);

  const CycleLockButton = () => {
    const locked = lockedPreview;
    const hasSelection = !!pendingCycle;
    const disabled = !locked && !hasSelection;

    const borderColor = disabled
      ? "hsl(var(--hairline))"
      : locked
        ? "hsl(var(--green-600))"
        : "hsl(var(--red-600))";

    const textColor = disabled
      ? "hsl(var(--secondary))"
      : locked
        ? "hsl(var(--green-300))"
        : "hsl(var(--red-300))";

    return (
      <div className="rounded-md" style={{ background: borderColor, padding: 2 }}>
        <button
          type="button"
          onClick={locked ? unlockCycle : lockCycle}
          disabled={disabled}
          className={[
            "h-9 px-3 rounded-[6px] text-sm font-medium",
            "bg-transparent flex items-center gap-2",
            disabled ? "cursor-not-allowed" : "hover:bg-white/5",
          ].join(" ")}
          style={{ color: textColor, boxShadow: `inset 0 0 0 9999px rgba(0,0,0,0)` }}
          title={locked ? "Unlock cycle" : hasSelection ? "Lock cycle" : "Select a cycle first"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {locked ? (
              <>
                <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                <rect x="5" y="10" width="14" height="10" rx="2" />
              </>
            ) : (
              <>
                <path d="M12 5a5 5 0 0 1 5 5" />
                <rect x="5" y="10" width="14" height="10" rx="2" />
              </>
            )}
          </svg>
          Cycle Lock
        </button>
      </div>
    );
  };

  return (
    <DetailsScaffold
      title={row.name}
      subtitle={row.status || ""}
      mode={mode}
      onEdit={() => setMode("edit")}
      onCancel={() => setMode("view")}
      onSave={requestSave}
      tabs={[
        { key: "overview", label: "Overview" },
        { key: "deposits", label: "Deposits" },
        { key: "audit", label: "Audit" },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      rightActions={<Button size="sm" variant="outline">Archive</Button>}
    >
      {activeTab === "overview" && (
        <div className="space-y-4 mt-2">
          {/* Plan Info matches Contacts grid patterns */}
          <SectionCard title="Plan Info">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="min-w-0">
                <div className="text-xs text-secondary mb-1">Plan Name</div>
                {isEdit
                  ? <Input defaultValue={row.name} onChange={(e) => setDraft({ name: e.currentTarget.value })} />
                  : <DisplayValue value={row.name} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-secondary mb-1">Nickname</div>
                {isEdit
                  ? <Input defaultValue={row.nickname ?? ''} onChange={(e) => setDraft({ nickname: e.currentTarget.value })} />
                  : <DisplayValue value={row.nickname ?? ''} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-secondary mb-1">Plan Code</div>
                {isEdit
                  ? <Input defaultValue={row.code ?? ''} onChange={(e) => setDraft({ code: e.currentTarget.value })} />
                  : <DisplayValue value={row.code ?? ''} />}
              </div>
            </div>

            {/* Row 2 */}
            {/* Row 2 — make Species ~1/3 width and Breed ~2/3 width */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {/* Species: 1 column on sm+ */}
              <div className="min-w-0 sm:col-span-1">
                <div className="text-xs text-secondary mb-1">Species</div>
                {isEdit ? (
                  <select
                    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                    defaultValue={row.species || ""}
                    onChange={(e) => setDraft({ species: e.currentTarget.value as any, breedText: null })}
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

              {/* Breed: 2 columns on sm+ */}
              <div className="min-w-0 sm:col-span-2">
                <div className="text-xs text-secondary mb-1">Breed</div>
                {isEdit ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <BreedCombo
                        orgId={orgIdForBreeds ?? undefined}
                        species={(row.species || "Dog") as SpeciesUi}
                        value={row.breedText ? { id: "current", name: row.breedText, species: row.species || "Dog", source: "canonical" } as any : null}
                        onChange={(hit: any) => setDraft({ breedText: hit?.name ?? null })}
                        api={breedBrowseApi}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCustomBreed((row.species || "Dog") as SpeciesUi, (name) => setDraft({ breedText: name }))}
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

          {/* Parents section mirrors Contacts editor behavior for popovers */}
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
                      onFocus={() => setEditDamFocus(true)}
                      onBlur={() => setEditDamFocus(false)}
                      placeholder="Search Dam…"
                    />
                    {editDamFocus && (
                      <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                        {editDamOptions.length > 0 ? editDamOptions.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setDraft({ damId: a.id, damName: a.name });
                              setEditDamQuery(a.name);
                              setEditDamFocus(false);
                            }}
                            className={`w-full px-2 py-1 text-left hover:bg-white/5 ${row.damId === a.id ? "bg-white/10" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{a.name}</span>
                              {a.organization?.name ? <span className="text-xs text-secondary ml-2">({a.organization.name})</span> : null}
                            </div>
                          </button>
                        )) : <div className="px-2 py-2 text-sm text-secondary">No females found</div>}
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
                      onFocus={() => setEditSireFocus(true)}
                      onBlur={() => setEditSireFocus(false)}
                      placeholder="Search Sire…"
                    />
                    {editSireFocus && (
                      <div className="mt-2 max-h-56 overflow-auto rounded-md border border-hairline bg-surface">
                        {editSireOptions.length > 0 ? editSireOptions.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setDraft({ sireId: a.id, sireName: a.name });
                              setEditSireQuery(a.name);
                              setEditSireFocus(false);
                            }}
                            className={`w-full px-2 py-1 text-left hover:bg-white/5 ${row.sireId === a.id ? "bg-white/10" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{a.name}</span>
                              {a.organization?.name ? <span className="text-xs text-secondary ml-2">({a.organization.name})</span> : null}
                            </div>
                          </button>
                        )) : <div className="px-2 py-2 text-sm text-secondary">No males found</div>}
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
                <div className="text-xs text-secondary mb-1">Upcoming Cycles (Projected)</div>
                {(() => {
                  const hasSelection = !!pendingCycle;
                  const ringColor = !row.damId
                    ? "hsl(var(--hairline))"
                    : lockedPreview
                      ? "hsl(var(--green-600))"
                      : hasSelection
                        ? "hsl(var(--red-600))"
                        : "hsl(var(--hairline))";
                  return (
                    <div className="relative">
                      <select
                        className={[
                          "relative z-10 w-full h-9 rounded-md px-2 text-sm text-primary bg-surface border border-hairline",
                          lockedPreview || !row.damId ? "opacity-60 pointer-events-none" : "",
                        ].join(" ")}
                        value={pendingCycle ?? ""}
                        onChange={(e) => setPendingCycle(e.currentTarget.value || null)}
                        disabled={lockedPreview || !row.damId}
                      >
                        <option value="">{!row.damId ? "Select a Dam to view cycles" : "—"}</option>
                        {projectedCycles.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-md" style={{ boxShadow: `0 0 0 2px ${ringColor}` }} />
                    </div>
                  );
                })()}
                {!!damLoadError && <div className="text-xs text-red-600 mt-1">{damLoadError}</div>}
              </div>

              <CycleLockButton />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="EXPECTED DATES (SYSTEM CALCULATED)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-secondary mb-1">BREED DATE (EXPECTED)</div>
                  <Input value={expectedBreed} readOnly className="h-8 py-0 px-2 text-sm bg-transparent border-hairline" />
                </div>
                <div>
                  <div className="text-xs text-secondary mb-1">BIRTH DATE (EXPECTED)</div>
                  <Input value={expectedBirth} readOnly className="h-8 py-0 px-2 text-sm bg-transparent border-hairline" />
                </div>
                <div>
                  <div className="text-xs text-secondary mb-1">GO HOME DATE (EXPECTED)</div>
                  <Input value={expectedGoHome} readOnly className="h-8 py-0 px-2 text-sm bg-transparent border-hairline" />
                </div>
                <div>
                  <div className="text-xs text-secondary mb-1">LAST OFFSPRING GO HOME DATE (EXPECTED)</div>
                  <Input value={expectedGoHome} readOnly className="h-8 py-0 px-2 text-sm bg-transparent border-hairline" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="ACTUAL DATES">
              {isEdit && !canEditDates && (
                <div className="text-xs text-[hsl(var(--brand-orange))] mb-2">
                  Select a Female and Male and lock the cycle period to enable dates
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <div className="text-xs text-secondary mb-1">BREEDING DATE (ACTUAL)</div>
                  <CalendarInput
                    defaultValue={row.breedDateActual ?? ""}
                    onChange={(e) => canEditDates && setDraft({ breedDateActual: e.currentTarget.value })}
                    readOnly={!canEditDates}
                    showIcon={canEditDates}
                  />
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">WHELPED (ACTUAL)</div>
                  <CalendarInput
                    defaultValue={row.birthDateActual ?? ""}
                    onChange={(e) => canEditDates && setDraft({ birthDateActual: e.currentTarget.value })}
                    readOnly={!canEditDates}
                    showIcon={canEditDates}
                  />
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">WEANED (ACTUAL)</div>
                  <CalendarInput
                    defaultValue={row.weanedDateActual ?? ""}
                    onChange={(e) => canEditDates && setDraft({ weanedDateActual: e.currentTarget.value })}
                    readOnly={!canEditDates}
                    showIcon={canEditDates}
                  />
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">HOMING STARTED (ACTUAL)</div>
                  <CalendarInput
                    defaultValue={row.goHomeDateActual ?? ""}
                    onChange={(e) => canEditDates && setDraft({ goHomeDateActual: e.currentTarget.value })}
                    readOnly={!canEditDates}
                    showIcon={canEditDates}
                  />
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">COMPLETED (ACTUAL)</div>
                  <CalendarInput
                    defaultValue={row.completedDateActual ?? ""}
                    onChange={(e) => canEditDates && setDraft({ completedDateActual: e.currentTarget.value })}
                    readOnly={!canEditDates}
                    showIcon={canEditDates}
                  />
                </div>

                <div className="flex justify-end items-end">
                  <Button
                    variant="outline"
                    disabled={!canEditDates}
                    onClick={() => {
                      if (!canEditDates) return;
                      if (!window.confirm("Reset ALL actual date fields (Breeding, Whelped, Weaned, Homing Started, Completed)?")) return;
                      setDraft({
                        breedDateActual: null,
                        birthDateActual: null,
                        weanedDateActual: null,
                        goHomeDateActual: null,
                        lastGoHomeDateActual: null,
                        completedDateActual: null,
                      });
                    }}
                  >
                    Reset Dates
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="NOTES">
              {isEdit ? (
                <textarea
                  className="w-full min-h-[120px] rounded-md px-2 py-2 text-sm border border-hairline bg-surface"
                  defaultValue={row.notes ?? ""}
                  onChange={(e) => setDraft({ notes: e.currentTarget.value })}
                  placeholder="Add notes…"
                />
              ) : (
                <div className="text-sm select-none pointer-events-none min-h-[24px]">
                  {row.notes || "—"}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

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
        </div>
      )}
    </DetailsScaffold>
  );
}

/* ───────── Very light Gantt (SVG) ───────── */
function GanttBar({ start, end, height = 12 }: { start?: string | null; end?: string | null; height?: number }) {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null;

  const days = Math.round((e - s) / 86400000);
  const width = Math.max(100, days * 6);
  const pad = 12;

  return (
    <svg className="w-full" viewBox={`0 0 ${width + pad * 2} ${height + pad * 2}`} preserveAspectRatio="xMinYMid meet">
      <rect x={pad} y={pad} width={width} height={height} rx={4} className="fill-current" style={{ color: "hsl(var(--hairline))" }} opacity={0.25} />
      <line x1={pad} y1={pad + height / 2} x2={pad + width} y2={pad + height / 2} stroke="currentColor" strokeWidth="2" style={{ color: "hsl(var(--hairline))" }} />
    </svg>
  );
}
