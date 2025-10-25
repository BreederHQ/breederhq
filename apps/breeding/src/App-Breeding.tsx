// apps/breeding/src/App-Breeding.tsx
import * as React from "react";
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
  DetailsSpecRenderer,
  SectionCard,
  Button,
  Input,
  utils,
} from "@bhq/ui";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { makeBreedingApi } from "./api";

/* ───────────────────────────────── Types ───────────────────────────────── */

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

const STORAGE_KEY = "bhq_breeding_cols_v1";

/* ─────────────────────────────── Helpers ──────────────────────────────── */

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

async function searchAnimals(opts: {
  baseUrl: string;
  tenantId: number;
  q: string;
  species?: SpeciesWire;
  sex?: "FEMALE" | "MALE";
}): Promise<AnimalLite[]> {
  const qs = new URLSearchParams();
  if (opts.q) qs.set("q", opts.q);
  if (opts.species) qs.set("species", opts.species);
  if (opts.sex) qs.set("sex", opts.sex);
  qs.set("limit", "20");
  const res = await fetch(`${opts.baseUrl.replace(/\/+$/, "")}/animals?${qs}`, {
    method: "GET",
    credentials: "include",
    headers: { "content-type": "application/json", "x-tenant-id": String(opts.tenantId) },
  });
  if (!res.ok) return [];
  const body = await res.json();
  const items = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
  return items as AnimalLite[];
}

/* ────────────────────────────── Component ─────────────────────────────── */

export default function AppBreeding() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "breeding", label: "Breeding" } }));
  }, []);

  // Ensure overlay root exists
  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn("ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell.");
    }
  }, []);

  // Tenant → API
  const { readTenantIdFast, resolveTenantId } = utils;
  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  React.useEffect(() => {
    if (tenantId != null) return;
    let cancelled = false;
    (async () => {
      try { const t = await resolveTenantId(); if (!cancelled) setTenantId(t); } catch {}
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const api = React.useMemo(() => {
    if (tenantId == null) return null;
    return makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });
  }, [tenantId]);

  // Search and filters
  const [q, setQ] = React.useState(() => { try { return localStorage.getItem("bhq_breeding_q_v1") || ""; } catch { return ""; } });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem("bhq_breeding_filters_v1") || "{}"); } catch { return {}; } });
  React.useEffect(() => { try { localStorage.setItem("bhq_breeding_q_v1", q); } catch {} }, [q]);
  React.useEffect(() => { try { localStorage.setItem("bhq_breeding_filters_v1", JSON.stringify(filters || {})); } catch {} }, [filters]);
  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  // Data
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

  // Columns
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  // Filters schema
  const FILTER_SCHEMA = React.useMemo(() => {
    const dateKeys = new Set([
      "expectedDue","expectedGoHome","breedDateActual","birthDateActual","weanedDateActual",
      "goHomeDateActual","lastGoHomeDateActual","lockedCycleStart","lockedOvulationDate","lockedDueDate","lockedGoHomeDate",
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

  // Sorting
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts(prev => {
      const found = prev.find(s => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc") return prev.map(s => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter(s => s.key !== key);
    });
  };

  // Client search + filter + sort
  const DATE_KEYS = new Set([
    "expectedDue","expectedGoHome","breedDateActual","birthDateActual","weanedDateActual",
    "goHomeDateActual","lastGoHomeDateActual","lockedCycleStart","lockedOvulationDate","lockedDueDate","lockedGoHomeDate",
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

  // Paging
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

  /* ─────────────────────── Create Plan Drawer State ─────────────────────── */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newSpeciesUi, setNewSpeciesUi] = React.useState<SpeciesUi | "">("");
  const [newCode, setNewCode] = React.useState("");

  const [damQuery, setDamQuery] = React.useState("");
  const [sireQuery, setSireQuery] = React.useState("");
  const [damOptions, setDamOptions] = React.useState<AnimalLite[]>([]);
  const [sireOptions, setSireOptions] = React.useState<AnimalLite[]>([]);
  const [damId, setDamId] = React.useState<number | null>(null);
  const [sireId, setSireId] = React.useState<number | null>(null);

  // Toggle shared overlay interactivity while drawer is open
  React.useEffect(() => {
    const root = getOverlayRoot();
    if (!root) return;
    const prevPointer = root.style.pointerEvents;
    const prevOverflow = document.body.style.overflow;

    if (createOpen) {
      root.style.pointerEvents = "auto";
      document.body.style.overflow = "hidden";
    } else {
      root.style.pointerEvents = "none";
      document.body.style.overflow = prevOverflow || "";
    }
    return () => {
      root.style.pointerEvents = "none";
      document.body.style.overflow = prevOverflow || "";
    };
  }, [createOpen]);

  // ESC support and focus trap entry
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !createWorking) setCreateOpen(false);
  };
  React.useEffect(() => {
    if (createOpen) dialogRef.current?.focus();
  }, [createOpen]);

  // Async animal options
  React.useEffect(() => {
    if (!api || tenantId == null) return;
    const baseUrl = "/api/v1";
    const speciesWire = toWireSpecies(newSpeciesUi);
    const t = setTimeout(async () => {
      const opts = await searchAnimals({ baseUrl, tenantId, q: damQuery, species: speciesWire, sex: "FEMALE" });
      setDamOptions(opts);
    }, 250);
    return () => clearTimeout(t);
  }, [api, tenantId, damQuery, newSpeciesUi]);

  React.useEffect(() => {
    if (!api || tenantId == null) return;
    const baseUrl = "/api/v1";
    const speciesWire = toWireSpecies(newSpeciesUi);
    const t = setTimeout(async () => {
      const opts = await searchAnimals({ baseUrl, tenantId, q: sireQuery, species: speciesWire, sex: "MALE" });
      setSireOptions(opts);
    }, 250);
    return () => clearTimeout(t);
  }, [api, tenantId, sireQuery, newSpeciesUi]);

  // Dam is required for creation. Sire is optional here.
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

      const res = await api.createPlan(payload);
      const plan = (res as any)?.plan ?? res;
      setRows(prev => [planToRow(plan), ...prev]);

      // reset
      setNewName(""); setNewSpeciesUi(""); setNewCode("");
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

  /* ─────────────────────── Details Drawer Config ─────────────────────── */

  const planSections = (mode: "view" | "edit") => ([
    {
      title: "Plan",
      fields: [
        { label: "Status", view: (r: PlanRow) => r.status ?? "—" },
        { label: "Species", view: (r: PlanRow) => r.species ?? "—" },
        { label: "Dam", view: (r: PlanRow) => r.damName ?? "—" },
        { label: "Sire", view: (r: PlanRow) => r.sireName ?? "—" },
        { label: "Org", view: (r: PlanRow) => r.orgName ?? "—" },
        {
          label: "Code",
          view: (r: PlanRow) => r.code ?? "—",
          edit: (r, set) => <Input size="sm" defaultValue={r.code ?? ""} onChange={e => set({ code: e.target.value })} />,
        },
        {
          label: "Nickname",
          view: (r: PlanRow) => r.nickname ?? "—",
          edit: (r, set) => <Input size="sm" defaultValue={r.nickname ?? ""} onChange={e => set({ nickname: e.target.value })} />,
        },
        {
          label: "Breed",
          view: (r: PlanRow) => r.breedText ?? "—",
          edit: (r, set) => <Input size="sm" defaultValue={r.breedText ?? ""} onChange={e => set({ breedText: e.target.value })} />,
        },
      ],
    },
    {
      title: "Dates",
      fields: [
        { label: "Birth (Expected)", view: (r: PlanRow) => fmt(r.expectedDue) || "—" },
        { label: "Go Home (Expected)", view: (r: PlanRow) => fmt(r.expectedGoHome) || "—" },
        { label: "Whelped", view: (r: PlanRow) => fmt(r.birthDateActual) || "—" },
        { label: "Weaned", view: (r: PlanRow) => fmt(r.weanedDateActual) || "—" },
        { label: "Go Home", view: (r: PlanRow) => fmt(r.goHomeDateActual) || "—" },
      ],
    },
  ]);

  const detailsConfig = React.useMemo(() => {
    if (!api) {
      return {
        idParam: "planId",
        getRowId: (r: PlanRow) => r.id,
        width: 820,
        placement: "center" as const,
        align: "top" as const,
        header: (r: PlanRow) => ({ title: r.name, subtitle: r.status || "" }),
        tabs: [{ key: "overview", label: "Overview" }],
        customChrome: true,
        render: ({ row }: any) => (
          <DetailsScaffold
            title={row.name}
            subtitle={row.status || ""}
            mode="view"
            onEdit={() => {}}
            onCancel={() => {}}
            onSave={() => {}}
            tabs={[{ key: "overview", label: "Overview" }]}
            activeTab={"overview"}
            onTabChange={() => {}}
            rightActions={<Button size="sm" variant="outline" disabled>Archive</Button>}
          >
            <DetailsSpecRenderer<PlanRow> row={row} mode={"view"} setDraft={() => {}} sections={planSections("view")} />
          </DetailsScaffold>
        ),
      };
    }

    return {
      idParam: "planId",
      getRowId: (r: PlanRow) => r.id,
      width: 820,
      placement: "center" as const,
      align: "top" as const,
      fetchRow: (id: ID) => api.getPlan(Number(id), "parents,org"),
      onSave: async (id: ID, draft: Partial<PlanRow>) => {
        const updated = await api.updatePlan(Number(id), draft as any);
        setRows(prev => prev.map(r => (r.id === id ? planToRow(updated) : r)));
      },
      header: (r: PlanRow) => ({ title: r.name, subtitle: r.status || "" }),
      tabs: [
        { key: "overview", label: "Overview" },
        { key: "audit", label: "Audit" },
      ],
      customChrome: true,
      render: ({ row, mode, setMode, setDraft, activeTab, setActiveTab, requestSave }: any) => (
        <DetailsScaffold
          title={row.name}
          subtitle={row.status || ""}
          mode={mode}
          onEdit={() => setMode("edit")}
          onCancel={() => setMode("view")}
          onSave={requestSave}
          tabs={[{ key: "overview", label: "Overview" }, { key: "audit", label: "Audit" }]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rightActions={<Button size="sm" variant="outline">Archive</Button>}
        >
          {activeTab === "overview" && (
            <DetailsSpecRenderer<PlanRow>
              row={row}
              mode={mode}
              setDraft={(p) => setDraft((d: any) => ({ ...d, ...p }))}
              sections={planSections(mode)}
            />
          )}
          {activeTab === "audit" && (
            <div className="space-y-2">
              <SectionCard title="Audit">
                <div className="text-sm text-secondary">Events will appear here.</div>
              </SectionCard>
            </div>
          )}
        </DetailsScaffold>
      ),
    };
  }, [api, setRows]);

  /* ─────────────────────────────── Render ─────────────────────────────── */

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <PageHeader title="Breeding" subtitle="Create and manage breeding plans" />
        <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1" style={{ zIndex: 5, pointerEvents: "auto" }}>
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!api}>New Breeding Plan</Button>
        </div>
      </div>

      <Card>
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
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
              start={start}
              end={end}
              filteredTotal={displayRows.length}
              total={rows.length}
            />
          </Table>
        </DetailsHost>
      </Card>

      {/* Create Plan Drawer in shared overlay root */}
      {createOpen && getOverlayRoot() && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          ref={dialogRef}
          tabIndex={-1}
          onKeyDown={onDialogKeyDown}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => !createWorking && setCreateOpen(false)} />

          {/* Card */}
          <div
            className="relative w-[720px] max-w-[94vw] rounded-xl border border-hairline bg-surface shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
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
                <Input value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="Luna × TBD — Fall 2026" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-secondary mb-1">Species <span className="text-[hsl(var(--brand-orange))]">*</span></div>
                  <select
                    className="w-full h-9 rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                    value={newSpeciesUi}
                    onChange={(e) => setNewSpeciesUi(e.target.value as SpeciesUi | "")}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-secondary mb-1">
                    Dam <span className="text-[hsl(var(--brand-orange))]">*</span>
                  </div>
                  <Input
                    value={damQuery}
                    onChange={(e) => setDamQuery(e.currentTarget.value)}
                    placeholder="Search females by name…"
                  />
                  <div className="mt-2 max-h-40 overflow-auto rounded-md border border-hairline">
                    {damOptions.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setDamId(a.id); setDamQuery(a.name); }}
                        className={`w-full px-2 py-1 text-left hover:bg-white/5 ${damId === a.id ? "bg-white/10" : ""}`}
                      >
                        {a.name} <span className="text-xs text-secondary">({a.organization?.name || "—"})</span>
                      </button>
                    ))}
                    {damOptions.length === 0 && <div className="px-2 py-2 text-sm text-secondary">No results</div>}
                  </div>
                  {damId == null && <div className="mt-1 text-xs text-[hsl(var(--brand-orange))]">Select a Dam to continue</div>}
                </div>

                <div>
                  <div className="text-xs text-secondary mb-1">Sire (optional for now)</div>
                  <Input
                    value={sireQuery}
                    onChange={(e) => setSireQuery(e.currentTarget.value)}
                    placeholder="Search males by name…"
                  />
                  <div className="mt-2 max-h-40 overflow-auto rounded-md border border-hairline">
                    {sireOptions.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setSireId(a.id); setSireQuery(a.name); }}
                        className={`w-full px-2 py-1 text-left hover:bg-white/5 ${sireId === a.id ? "bg-white/10" : ""}`}
                      >
                        {a.name} <span className="text-xs text-secondary">({a.organization?.name || "—"})</span>
                      </button>
                    ))}
                    {sireOptions.length === 0 && <div className="px-2 py-2 text-sm text-secondary">No results</div>}
                  </div>
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
        </div>,
        getOverlayRoot()!
      )}
    </div>
  );
}
