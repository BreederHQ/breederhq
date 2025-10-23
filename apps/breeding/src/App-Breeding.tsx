// apps/breeding/src/App-Breeding.tsx
import * as React from "react";
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

/** ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */

type PlanRow = {
  id: number | string;
  name: string;
  status: string;
  species: string;
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
  { key: "nickname", label: "Nickname", default: false },
  { key: "breedText", label: "Breed", default: false },
  { key: "status", label: "Status", default: true },
  { key: "damName", label: "Dam", default: true },
  { key: "sireName", label: "Sire", default: false },
  { key: "species", label: "Species", default: false },
  { key: "orgName", label: "Organization", default: false },
  { key: "code", label: "Code", default: false },
  { key: "expectedDue", label: "Expected Due", default: true },
  { key: "expectedGoHome", label: "Expected Go Home", default: true },
  { key: "birthDateActual", label: "Whelped", default: false },
  { key: "weanedDateActual", label: "Weaned", default: false },
  { key: "breedDateActual", label: "Breeding (Actual)", default: false },
  { key: "goHomeDateActual", label: "Go Home (Actual)", default: false },
  { key: "lastGoHomeDateActual", label: "Last Go Home (Actual)", default: false },
  { key: "lockedCycleStart", label: "Cycle Start (Locked)", default: false },
  { key: "lockedOvulationDate", label: "Ovulation (Locked)", default: false },
  { key: "lockedDueDate", label: "Due (Locked)", default: false },
  { key: "lockedGoHomeDate", label: "Go Home (Locked)", default: false },
  { key: "depositsCommitted", label: "Deposits Committed", default: false },
  { key: "depositsPaid", label: "Deposits Paid", default: false },
  { key: "depositRisk", label: "Deposit Risk", default: false },
];

const STORAGE_KEY = "bhq_breeding_cols_v1";

/** ─────────────────────────────────────────────────────────────────────────────
 * Utils
 * ──────────────────────────────────────────────────────────────────────────── */

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
    species: p.species,
    damName: p.dam?.name ?? "",
    sireName: p.sire?.name ?? null,
    orgName: p.organization?.name ?? null,
    code: p.code ?? null,

    expectedDue: p.expectedDue ?? null,
    expectedGoHome: p.expectedGoHome ?? null,

    breedDateActual: p.breedDateActual ?? null,
    birthDateActual: p.birthDateActual ?? null,
    weanedDateActual: p.weanedDateActual ?? null,
    goHomeDateActual: p.goHomeDateActual ?? null,
    lastGoHomeDateActual: p.lastGoHomeDateActual ?? null,

    lockedCycleStart: p.lockedCycleStart ?? null,
    lockedOvulationDate: p.lockedOvulationDate ?? null,
    lockedDueDate: p.lockedDueDate ?? null,
    lockedGoHomeDate: p.lockedGoHomeDate ?? null,

    nickname: (p as any).nickname ?? null,
    breedText: p.breedText ?? null,
    depositsCommitted: (p as any).depositsCommittedCents ?? null,
    depositsPaid: (p as any).depositsPaidCents ?? null,
    depositRisk: (p as any).depositRiskScore ?? null,

    archived: p.archived,
  };
}

/** ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function AppBreeding() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "breeding", label: "Breeding" } }));
  }, []);

  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn("ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell.");
    }
  }, []);

  // Tenant → API (kept, but no extra cards so page layout matches Orgs)
  const { readTenantIdFast, resolveTenantId } = utils;
  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  React.useEffect(() => {
    if (tenantId != null) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await resolveTenantId();
        if (!cancelled) setTenantId(t);
      } catch {
        // Silent. Table will show a resolving row until tenant is set.
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const api = React.useMemo(() => {
    if (tenantId == null) return null;
    return makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });
  }, [tenantId]);

  // Search and filters
  const [q, setQ] = React.useState(() => {
    try { return localStorage.getItem("bhq_breeding_q_v1") || ""; } catch { return ""; }
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("bhq_breeding_filters_v1") || "{}"); } catch { return {}; }
  });

  React.useEffect(() => {
    try { localStorage.setItem("bhq_breeding_q_v1", q); } catch { }
  }, [q]);

  React.useEffect(() => {
    try { localStorage.setItem("bhq_breeding_filters_v1", JSON.stringify(filters || {})); } catch { }
  }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Data
  const [rows, setRows] = React.useState<PlanRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!api) { setLoading(true); return; }
      setLoading(true);
      setError(null);
      try {
        const res = await api.listPlans({
          include: "parents,org",
          page: 1,
          limit: 50,
          q: qDebounced || undefined,
        });
        if (!cancelled) setRows(res.items.map(planToRow));
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

  // Filters
  type FilterKind = "text" | "select" | "date";
  const FILTER_TYPES: Partial<Record<keyof PlanRow & string, { kind: FilterKind; options?: Array<{ label: string; value: string }> }>> = {
    status: {
      kind: "select",
      options: [
        { label: "Planning", value: "Planning" },
        { label: "Pregnant", value: "Pregnant" },
        { label: "Whelped", value: "Whelped" },
        { label: "Weaned", value: "Weaned" },
        { label: "Go Home", value: "Go Home" },
        { label: "Closed", value: "Closed" },
        { label: "Archived", value: "Archived" },
      ],
    },
    species: {
      kind: "select",
      options: [
        { label: "Dog", value: "Dog" },
        { label: "Cat", value: "Cat" },
        { label: "Horse", value: "Horse" },
      ],
    },
    expectedDue: { kind: "date" },
    expectedGoHome: { kind: "date" },
    breedDateActual: { kind: "date" },
    birthDateActual: { kind: "date" },
    weanedDateActual: { kind: "date" },
    goHomeDateActual: { kind: "date" },
    lastGoHomeDateActual: { kind: "date" },
    lockedCycleStart: { kind: "date" },
    lockedOvulationDate: { kind: "date" },
    lockedDueDate: { kind: "date" },
    lockedGoHomeDate: { kind: "date" },
  };

  const filterSchemaForFiltersRow = React.useMemo(() => {
    return visibleSafe.map(col => {
      const cfg = FILTER_TYPES[col.key] || { kind: "text" as const };
      if (cfg.kind === "date") return ({ key: col.key, label: col.label, editor: "date" as const });
      if (cfg.kind === "select") return ({ key: col.key, label: col.label, editor: "select" as const });
      return ({ key: col.key, label: col.label, editor: "text" as const });
    });
  }, [visibleSafe]);

  // Local sorting
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts(prev => {
      const found = prev.find(s => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc") return prev.map(s => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter(s => s.key !== key);
    });
  };

  // Reset to page 1 when search, filters, or sorts change
  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, filters, sorts]);

  const DATE_KEYS = new Set([
    "expectedDue",
    "expectedGoHome",
    "breedDateActual",
    "birthDateActual",
    "weanedDateActual",
    "goHomeDateActual",
    "lastGoHomeDateActual",
    "lockedCycleStart",
    "lockedOvulationDate",
    "lockedDueDate",
    "lockedGoHomeDate",
  ] as const);

  // Global search + column filters (client side)
  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    if (!active.length && !qDebounced) return rows;

    const lc = (v: any) => String(v ?? "").toLowerCase();
    let data = [...rows];

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

    return data;
  }, [rows, filters, qDebounced]);

  const sortedRows = React.useMemo(() => {
    if (!sorts.length) return displayRows;
    const out = [...displayRows];
    out.sort((a, b) => {
      for (const s of sorts) {
        const av = (a as any)[s.key];
        const bv = (b as any)[s.key];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return out;
  }, [displayRows, sorts]);

  // Paging math derived from sortedRows
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);

  const start = sortedRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1; // 1-based
  const end = sortedRows.length === 0 ? 0 : Math.min(sortedRows.length, start - 1 + pageSize);

  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sortedRows.slice(from, to);
  }, [sortedRows, clampedPage, pageSize]);

  // Sections & fields for details drawer
  const planSections = (mode: "view" | "edit") => ([
    {
      title: "Plan",
      fields: [
        { label: "Status",    view: (r: PlanRow) => r.status ?? "—" },
        { label: "Species",   view: (r: PlanRow) => r.species ?? "—" },
        { label: "Dam",       view: (r: PlanRow) => r.damName ?? "—" },
        { label: "Sire",      view: (r: PlanRow) => r.sireName ?? "—" },
        { label: "Org",       view: (r: PlanRow) => r.orgName ?? "—" },
        { label: "Code",      view: (r: PlanRow) => r.code ?? "—",
          edit: (r, set) => <Input size="sm" defaultValue={r.code ?? ""} onChange={e => set({ code: e.target.value })} /> },
        { label: "Nickname",  view: (r: PlanRow) => r.nickname ?? "—",
          edit: (r, set) => <Input size="sm" defaultValue={r.nickname ?? ""} onChange={e => set({ nickname: e.target.value })} /> },
        { label: "Breed",     view: (r: PlanRow) => r.breedText ?? "—",
          edit: (r, set) => <Input size="sm" defaultValue={r.breedText ?? ""} onChange={e => set({ breedText: e.target.value })} /> },
      ],
    },
    {
      title: "Dates",
      fields: [
        { label: "Expected Due",     view: (r: PlanRow) => fmt(r.expectedDue) || "—" },
        { label: "Expected Go Home", view: (r: PlanRow) => fmt(r.expectedGoHome) || "—" },
        { label: "Whelped",          view: (r: PlanRow) => fmt(r.birthDateActual) || "—" },
        { label: "Weaned",           view: (r: PlanRow) => fmt(r.weanedDateActual) || "—" },
        { label: "Go Home",          view: (r: PlanRow) => fmt(r.goHomeDateActual) || "—" },
      ],
    },
  ]);

  // Drawer config (structured like Orgs; guarded until api exists)
  const detailsConfig = React.useMemo(() => {
    if (!api) {
      // Minimal view-only shell so DetailsHost can mount consistently
      return {
        idParam: "planId",
        getRowId: (r: PlanRow) => r.id,
        width: 820,
        placement: "center" as const,
        align: "top" as const,
        header: (r: PlanRow) => ({ title: r.name, subtitle: r.status || "" }),
        tabs: [{ key: "overview", label: "Overview" }],
        customChrome: true,
        render: ({ row, mode }: any) => (
          <DetailsScaffold
            title={row.name}
            subtitle={row.status || ""}
            mode={mode}
            onEdit={() => {}}
            onCancel={() => {}}
            onSave={() => {}}
            tabs={[{ key: "overview", label: "Overview" }]}
            activeTab={"overview"}
            onTabChange={() => {}}
            rightActions={<Button size="sm" variant="outline" disabled>Archive</Button>}
          >
            <DetailsSpecRenderer<PlanRow>
              row={row}
              mode={"view"}
              setDraft={() => {}}
              sections={planSections("view")}
            />
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
      fetchRow: (id: number | string) => api.getPlan(Number(id)),
      onSave: async (id: number | string, draft: Partial<PlanRow>) => {
        const updated = await api.updatePlan(Number(id), draft as any);
        setRows(prev => prev.map(r => (r.id === id ? { ...r, ...planToRow(updated) } : r)));
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
          onCancel={() => { setMode("view"); }}
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

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Breeding"
        subtitle="Create and Manage Breeding Plans for Your Animals"
      />

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
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
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
                schema={filterSchemaForFiltersRow}
              />
            )}

            {/* Table */}
            <table className="min-w-max w-full text-sm">
              <TableHeader
                columns={visibleSafe}
                sorts={sorts}
                onToggleSort={onToggleSort}
              />
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
                      <div className="py-8 text-center text-sm text-secondary">No breeding plans to display yet.</div>
                    </TableCell>
                  </TableRow>
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
              filteredTotal={sortedRows.length}
              total={rows.length}
            />
          </Table>
        </DetailsHost>
      </Card>
    </div>
  );
}
