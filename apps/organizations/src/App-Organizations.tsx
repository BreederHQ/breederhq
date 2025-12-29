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
  FilterChips,
  FiltersRow,
  DetailsHost,
  DetailsScaffold,
  DetailsSpecRenderer,
  SectionCard,
  Button,
  Input,
  // ranges
  buildRangeAwareSchema,
  inDateRange,
} from "@bhq/ui";
import { FinanceTab } from "@bhq/ui/components/Finance";
import { getOverlayRoot } from "@bhq/ui/overlay";
import "@bhq/ui/styles/table.css";
import { makeApi } from "./api";

/** ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */

type OrgRow = {
  id: number;
  partyId?: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  tags: string[];
  status: "Active" | "Archived" | string;
  created_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
};

const COLUMNS: Array<{ key: keyof OrgRow & string; label: string; default?: boolean }> = [
  { key: "name", label: "Name", default: true },
  { key: "email", label: "Email", default: true },
  { key: "phone", label: "Phone", default: true },
  { key: "website", label: "Website", default: false },
  { key: "city", label: "City", default: false },
  { key: "state", label: "State", default: false },
  { key: "country", label: "Country", default: false },
  { key: "tags", label: "Tags", default: true },
  { key: "status", label: "Status", default: true },
  { key: "created_at", label: "Created", default: false },
  { key: "updated_at", label: "Updated", default: true },
];

const STORAGE_KEY = "bhq_organizations_cols_v1";

/** ─────────────────────────────────────────────────────────────────────────────
 * Utils
 * ──────────────────────────────────────────────────────────────────────────── */

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "";
}

function orgToRow(p: any): OrgRow {
  return {
    id: p.id,
    partyId: p.partyId ?? p.party_id ?? p.id,
    name: p.name,
    email: p.email ?? null,
    phone: p.phone ?? null,
    website: p.website ?? null,
    street: p.street ?? null,
    street2: p.street2 ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    zip: p.zip ?? null,
    country: p.country ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    status: p.status ?? "Active",
    created_at: p.created_at ?? p.createdAt ?? null,
    updated_at: p.updated_at ?? p.updatedAt ?? null,
    notes: p.notes ?? null,
  };
}

const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

/** ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function AppOrganizations() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("bhq:module", { detail: { key: "organizations", label: "Organizations" } }));
  }, []);

  React.useEffect(() => {
    if (!getOverlayRoot()) {
      console.warn("ColumnsPopover needs an overlay root. Add <div id='bhq-overlay-root'></div> to the shell.");
    }
  }, []);

  const api = React.useMemo(() => makeApi("/api/v1"), []);

  // Search and filters
  const [q, setQ] = React.useState(() => {
    try { return localStorage.getItem("bhq_organizations_q_v1") || ""; } catch { return ""; }
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("bhq_organizations_filters_v1") || "{}"); } catch { return {}; }
  });

  React.useEffect(() => { try { localStorage.setItem("bhq_organizations_q_v1", q); } catch {} }, [q]);
  React.useEffect(() => { try { localStorage.setItem("bhq_organizations_filters_v1", JSON.stringify(filters || {})); } catch {} }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Data
  const [rows, setRows] = React.useState<OrgRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.organizations.list({
          q: qDebounced || undefined,
          page: 1,
          limit: 50,
        });
        if (!cancelled) setRows((res.items || []).map(orgToRow));
      } catch (e: any) {
        if (!cancelled) setError(e?.data?.error || e?.message || "Failed to load organizations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, qDebounced]);

  // Columns
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  // Build the filter schema: create dateRange inputs for snake_case date fields
  const filterSchemaForFiltersRow = React.useMemo(() => {
    return buildRangeAwareSchema(
      visibleSafe.map(c => ({ key: c.key, label: c.label })),
      ["created_at", "updated_at"]
    );
  }, [visibleSafe]);

  const DATE_KEYS = new Set(["created_at", "updated_at"] as const);

  // Global search + column filters (client side)
  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    if (!active.length && !qDebounced) return rows;

    const lc = (v: any) => String(v ?? "").toLowerCase();
    let data = [...rows];

    // Global search
    if (qDebounced) {
      const ql = qDebounced.toLowerCase();
      data = data.filter(r => {
        const hay = [
          r.name, r.email, r.phone, r.website,
          r.city, r.state, r.zip, r.country,
          r.status, r.notes,
          ...(r.tags || []),
          r.created_at, r.updated_at,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      const createdFrom = filters["created_at_from"];
      const createdTo = filters["created_at_to"];
      const updatedFrom = filters["updated_at_from"];
      const updatedTo = filters["updated_at_to"];

      data = data.filter(r => {
        // 1) text/select filters (ignore range keys here)
        const textOk = active.every(([key, val]) => {
          if (key === "created_at_from" || key === "created_at_to" ||
              key === "updated_at_from" || key === "updated_at_to") {
            return true;
          }
          if (key === "tags") {
            const str = String(val).toLowerCase().trim();
            return (r.tags || []).some(t => String(t).toLowerCase().includes(str));
          }
          const raw = (r as any)[key];
          const isDate = key === "created_at" || key === "updated_at";
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        });
        if (!textOk) return false;

        // 2) inclusive date ranges
        const createdOk = (createdFrom || createdTo) ? inDateRange(r.created_at, createdFrom, createdTo) : true;
        const updatedOk = (updatedFrom || updatedTo) ? inDateRange(r.updated_at, updatedFrom, updatedTo) : true;

        return createdOk && updatedOk;
      });
    }

    return data;
  }, [rows, filters, qDebounced]);

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

  // Clear filters helper
  const clearFilters = () => { setQ(""); setFilters({}); };

  // Sections & fields (use shared Input so focus ring + sizing is consistent)
  const orgSections = (mode: "view" | "edit") => ([
    {
      title: "Profile",
      fields: [
        {
          label: "Email", view: (r: OrgRow) => r.email ?? "—",
          edit: (r, set) => (<Input size="sm" defaultValue={r.email ?? ""} onChange={e => set({ email: e.target.value })} />),
        },
        {
          label: "Phone", view: (r) => r.phone ?? "—",
          edit: (r, set) => (<Input size="sm" defaultValue={r.phone ?? ""} onChange={e => set({ phone: e.target.value })} />),
        },
        {
          label: "Website", view: (r) => r.website ?? "—",
          edit: (r, set) => (<Input size="sm" defaultValue={r.website ?? ""} onChange={e => set({ website: e.target.value })} />),
        },
        {
          label: "Address", view: (r) =>
            [r.street, r.street2, r.city, r.state, r.zip, r.country].filter(Boolean).join(", ") || "—",
        },
        { label: "Tags", view: (r) => (r.tags || []).join(", ") || "—" },
        { label: "Status", view: (r) => r.status || "Active" },
      ],
    },
  ]);

  // Drawer config
  const detailsConfig = React.useMemo(() => ({
    idParam: "orgId",
    getRowId: (r: OrgRow) => r.id,
    width: 820,
    placement: "center",
    align: "top",
    fetchRow: (id: number) => api.organizations.get(id),
    onSave: async (id: number, draft: Partial<OrgRow>) => {
      const updated = await api.organizations.update(id, draft);
      setRows(prev => prev.map(r => (r.id === id ? { ...r, ...orgToRow(updated) } : r)));
    },
    header: (r: OrgRow) => ({ title: r.name, subtitle: r.email || r.website || "" }),
    tabs: [
      { key: "overview", label: "Overview" },
      { key: "animals", label: "Animals" },
      { key: "documents", label: "Documents" },
      { key: "finances", label: "Finances" },
      { key: "audit", label: "Audit" },
    ],
    customChrome: true,
    render: ({ row, mode, setMode, setDraft, activeTab, setActiveTab, requestSave }: any) => (
      <DetailsScaffold
        title={row.name}
        subtitle={row.email || row.website || ""}
        mode={mode}
        onEdit={() => setMode("edit")}
        onCancel={() => { setMode("view"); }}
        onSave={requestSave}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "animals", label: "Animals" },
          { key: "documents", label: "Documents" },
          { key: "finances", label: "Finances" },
          { key: "audit", label: "Audit" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rightActions={<Button size="sm" variant="outline">Archive</Button>}
      >
        {activeTab === "overview" && (
          <DetailsSpecRenderer<OrgRow>
            row={row}
            mode={mode}
            setDraft={(p) => setDraft((d: any) => ({ ...d, ...p }))}
            sections={orgSections(mode)}
          />
        )}
        {activeTab === "animals" && (
          <div className="space-y-2">
            <SectionCard title="Animals">
              <div className="text-sm text-secondary">No animals yet.</div>
            </SectionCard>
          </div>
        )}
        {activeTab === "audit" && (
          <div className="space-y-2">
            <SectionCard title="Audit">
              <div className="text-sm text-secondary">Events will appear here.</div>
            </SectionCard>
          </div>
        )}
        {activeTab === "documents" && (
          <div className="space-y-2">
            <SectionCard title="Documents">
              <div className="text-sm text-secondary">Coming Soon</div>
            </SectionCard>
          </div>
        )}

        {activeTab === "finances" && row.partyId && (
          <FinanceTab
            invoiceFilters={{ clientPartyId: row.partyId }}
            expenseFilters={{ vendorPartyId: row.partyId }}
            api={api}
            defaultClientParty={{ id: row.partyId, label: row.name }}
          />
        )}
      </DetailsScaffold>
    ),
  }), [api]);

  /* ───────────── New Organization Modal state ───────────── */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorking, setCreateWorking] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newWebsite, setNewWebsite] = React.useState("");

  const canCreate = newName.trim().length > 0 && (newEmail.trim() === "" || isEmail(newEmail.trim()));

  const doCreateOrganization = async () => {
    if (!canCreate) {
      setCreateErr("Please enter a name and a valid email (or leave email blank).");
      return;
    }
    try {
      setCreateWorking(true);
      setCreateErr(null);

      // Adjust this to match your API shape if needed:
      const created = await (api.organizations as any).create?.({
        name: newName.trim(),
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        website: newWebsite.trim() || null,
        status: "Active",
      });

      const row = orgToRow(created);
      setRows(prev => [row, ...prev]);

      setNewName(""); setNewEmail(""); setNewPhone(""); setNewWebsite("");
      setCreateOpen(false);
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to create organization");
    } finally {
      setCreateWorking(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header row with absolutely-positioned right actions (same pattern as Admin) */}
      <div className="relative">
        <PageHeader
          title="Organizations"
          subtitle="Manage organizations, vendors, and partners"
        />

        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5, pointerEvents: "auto" }}
        >
          <Button size="sm" onClick={() => setCreateOpen(true)}>New Organization</Button>
          <Button size="sm" variant="outline">...</Button>
        </div>
      </div>

      <Card>
        <DetailsHost rows={rows} config={detailsConfig}>
          <Table
            columns={COLUMNS}
            columnState={map}
            onColumnStateChange={setAll}
            getRowId={(r: OrgRow) => r.id}
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
                schema={filterSchemaForFiltersRow}
              />
            )}

            {/* Chips */}
            <FilterChips
              filters={filters}
              onChange={setFilters}
              prettyLabel={(k) => {
                if (k === "created_at_from") return "Created ≥";
                if (k === "created_at_to") return "Created ≤";
                if (k === "updated_at_from") return "Updated ≥";
                if (k === "updated_at_to") return "Updated ≤";
                if (k === "email") return "Email";
                return k;
              }}
            />

            {/* Table */}
            <table className="min-w-max w-full text-sm">
              <TableHeader
                columns={visibleSafe}
                sorts={sorts}
                onToggleSort={onToggleSort}
              />
              <tbody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={visibleSafe.length}>
                      <div className="py-8 text-center text-sm text-secondary">Loading organizations…</div>
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
                      <div className="py-8 text-center text-sm text-secondary">No organizations to display yet.</div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && pageRows.length > 0 &&
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
              entityLabel="organizations"
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

      {/* ───────────────────── New Organization Modal ───────────────────── */}
      {createOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => !createWorking && setCreateOpen(false)} />

          {/* card */}
          <div className="relative w-[560px] max-w-[92vw] rounded-xl border border-hairline bg-surface shadow-xl p-4">
            <div className="text-lg font-semibold mb-1">New organization</div>
            <div className="text-sm text-secondary mb-4">
              Create an organization record. Only the name is required.
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-secondary mb-1">
                  Organization name <span className="text-[hsl(var(--brand-orange))]">*</span>
                </div>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.currentTarget.value)}
                  placeholder="Acme Ranch LLC"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-secondary mb-1">Email</div>
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.currentTarget.value)}
                    placeholder="info@acme-ranch.test"
                  />
                </div>
                <div>
                  <div className="text-xs text-secondary mb-1">Phone</div>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.currentTarget.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-secondary mb-1">Website</div>
                <Input
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.currentTarget.value)}
                  placeholder="https://acme.example"
                />
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
                  <Button onClick={doCreateOrganization} disabled={!canCreate || createWorking}>
                    {createWorking ? "Creating…" : "Create organization"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
