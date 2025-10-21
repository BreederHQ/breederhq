import * as React from "react";
import { PageHeader, Card, Table, TableHeader, TableRow, TableCell, ColumnsPopover, hooks, utils, Input, SearchBar } from "@bhq/ui";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { makeBreedingApi } from "./api";

type PlanRow = {
  id: number | string;
  status: string;
  code?: string | null;
  name: string;
  species: string;
  damName: string;
  sireName?: string | null;
  orgName?: string | null;

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
const { readTenantIdFast, resolveTenantId } = utils;

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}

function planToRow(p: BreedingPlan): PlanRow {
  return {
    id: p.id,
    status: p.status,
    code: p.code,
    name: p.name,
    species: p.species,
    damName: p.dam?.name ?? "",
    sireName: p.sire?.name ?? null,
    orgName: p.organization?.name ?? null,
    expectedDue: p.expectedDue ?? null,
    expectedGoHome: p.expectedGoHome ?? null,
    lockedCycleStart: p.lockedCycleStart ?? null,
    lockedOvulationDate: p.lockedOvulationDate ?? null,
    lockedDueDate: p.lockedDueDate ?? null,
    lockedGoHomeDate: p.lockedGoHomeDate ?? null,
    breedDateActual: p.breedDateActual ?? null,
    birthDateActual: p.birthDateActual ?? null,
    weanedDateActual: p.weanedDateActual ?? null,
    goHomeDateActual: p.goHomeDateActual ?? null,
    lastGoHomeDateActual: p.lastGoHomeDateActual ?? null,
    nickname: (p as any).nickname ?? null,
    breedText: p.breedText ?? null,
    depositsCommitted: (p as any).depositsCommittedCents ?? null,
    depositsPaid: (p as any).depositsPaidCents ?? null,
    depositRisk: (p as any).depositRiskScore ?? null,
    archived: p.archived,
  };
}

export default function AppBreeding() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "breeding", label: "Breeding" } }));
  }, []);

  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn("ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell.");
    }
  }, []);

  const [q, setQ] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [species, setSpecies] = React.useState<string | undefined>(undefined);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const clearFilters = () => {
    setQ("");
    setStatus(undefined);
    setSpecies(undefined);
  };

  const [tenantId, setTenantId] = React.useState<number | null>(() => readTenantIdFast() ?? null);
  const [tenantErr, setTenantErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (tenantId != null) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await resolveTenantId();
        if (!cancelled) setTenantId(t);
      } catch (e: any) {
        if (!cancelled) setTenantErr(String(e?.message || e) || "Failed to resolve tenant");
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const api = React.useMemo(() => {
    if (tenantId == null) return null;
    return makeBreedingApi({ baseUrl: "/api/v1", tenantId, withCsrf: true });
  }, [tenantId]);

  const [rows, setRows] = React.useState<PlanRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(tenantId != null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!api) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.listPlans({
          include: "parents,org",
          page: 1,
          limit: 50,
          q: qDebounced || undefined,
          status: status || undefined,
          species: species || undefined,
        });
        if (!cancelled) setRows(res.items.map(planToRow));
      } catch (e: any) {
        if (!cancelled) setError(e?.payload?.error || e?.message || "Failed to load plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, qDebounced, status, species]);

  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  const sorts: Array<{ key: string; dir: "asc" | "desc" }> = [];
  const onToggleSort = (_key: string) => { };

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

  return (
    <div className="p-4 space-y-4">

      {tenantId == null && !tenantErr && (
        <Card><div className="p-3 text-sm text-secondary">Resolving tenant…</div></Card>
      )}
      {tenantErr && (
        <Card><div className="p-3 text-sm text-red-600">Tenant error: {tenantErr}</div></Card>
      )}

      <Card>
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
            <div className="px-2 pb-2">
              <div className="rounded-lg border border-hairline p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs mb-1 opacity-70">Species</div>
                    <Input
                      value={species ?? ""}
                      onChange={(e) => setSpecies(e.target.value || undefined)}
                      placeholder="Dog, Cat, Horse"
                    />
                  </div>
                  <div>
                    <div className="text-xs mb-1 opacity-70">Status</div>
                    <Input
                      value={status ?? ""}
                      onChange={(e) => setStatus(e.target.value || undefined)}
                      placeholder="Planning, Pregnant, Weaned…"
                    />
                  </div>
                  <div className="lg:col-span-3 flex justify-end">
                    <button type="button" onClick={clearFilters} className="text-sm text-secondary hover:underline">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <table className="min-w-max w-full text-sm">
            <TableHeader
              columns={visible}
              sorts={sorts}
              onToggleSort={onToggleSort}
            />
            <tbody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">Loading plans…</div>
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

              {!loading && !error && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">No breeding plans to display yet.</div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && rows.length > 0 &&
                rows.map(r => (
                  <TableRow key={r.id}>
                    {visibleSafe.map(c => {
                      let v = (r as any)[c.key] as any;
                      if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                      return <TableCell key={c.key}>{v ?? ""}</TableCell>;
                    })}
                  </TableRow>
                ))}
            </tbody>
          </table>
        </Table>
      </Card>
    </div>
  );
}
