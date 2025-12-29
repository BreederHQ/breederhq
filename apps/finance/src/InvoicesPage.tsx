// apps/finance/src/InvoicesPage.tsx
// Invoices ledger - platform standard module table

import * as React from "react";
import {
  Card,
  Button,
  PageHeader,
  Popover,
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
  buildRangeAwareSchema,
  inDateRange,
  Badge,
  exportToCsv,
} from "@bhq/ui";
import { InvoiceCreateModal, InvoiceDetailDrawer } from "@bhq/ui/components/Finance";
import { formatCents } from "@bhq/ui/utils/money";
import { MoreHorizontal, Download, Plus } from "lucide-react";
import type { FinanceApi } from "./api";

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

type ID = number | string;

type InvoiceRow = {
  id: ID;
  invoiceNumber?: string | null;
  clientPartyName?: string | null;
  totalCents?: number | null;
  balanceCents?: number | null;
  status?: string | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  animalId?: ID | null;
  offspringGroupId?: ID | null;
  breedingPlanId?: ID | null;
  serviceCode?: string | null;
};

const COLUMNS: Array<{ key: keyof InvoiceRow & string; label: string; default?: boolean }> = [
  { key: "invoiceNumber", label: "Invoice #", default: true },
  { key: "clientPartyName", label: "Client", default: true },
  { key: "totalCents", label: "Total", default: true },
  { key: "balanceCents", label: "Outstanding", default: true },
  { key: "status", label: "Status", default: true },
  { key: "issuedAt", label: "Issued", default: true },
  { key: "dueAt", label: "Due", default: false },
];

const STORAGE_KEY = "bhq_finance_invoices_cols_v1";
const Q_KEY = "bhq_finance_invoices_q_v1";
const FILTERS_KEY = "bhq_finance_invoices_filters_v1";
const DATE_KEYS = new Set(["issuedAt", "dueAt"] as const);

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return String(d).slice(0, 10) || "";
  return dt.toLocaleDateString();
}

function invoiceToRow(inv: any): InvoiceRow {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber ?? null,
    clientPartyName: inv.clientPartyName ?? null,
    totalCents: inv.totalCents ?? null,
    balanceCents: inv.balanceCents ?? null,
    status: inv.status ?? null,
    issuedAt: inv.issuedAt ?? null,
    dueAt: inv.dueAt ?? null,
    animalId: inv.animalId ?? null,
    offspringGroupId: inv.offspringGroupId ?? null,
    breedingPlanId: inv.breedingPlanId ?? null,
    serviceCode: inv.serviceCode ?? null,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ────────────────────────────────────────────────────────────────────────── */

type Props = {
  api: FinanceApi;
};

export default function InvoicesPage({ api }: Props) {
  // Search/filters
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
    } catch {}
  }, [q]);
  React.useEffect(() => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(filters || {}));
    } catch {}
  }, [filters]);

  const [qDebounced, setQDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Data
  const [rows, setRows] = React.useState<InvoiceRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Load data
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.finance.invoices.list({
          q: qDebounced || undefined,
          limit: 1000,
          offset: 0,
        });
        const items = (res?.items || res?.data || []).map(invoiceToRow);
        if (!cancelled) setRows(items);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.payload?.error || e?.message || "Failed to load invoices");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, qDebounced]);

  // Columns
  const { map, toggle, setAll, visible } = hooks.useColumns(COLUMNS, STORAGE_KEY);
  const visibleSafe = Array.isArray(visible) && visible.length ? visible : COLUMNS;

  // Filters schema (range-aware)
  const filterSchemaForFiltersRow = React.useMemo(() => {
    return buildRangeAwareSchema(
      visibleSafe.map((c) => ({ key: c.key, label: c.label })),
      ["issuedAt", "dueAt"]
    );
  }, [visibleSafe]);

  // Client search + filters
  const displayRows = React.useMemo(() => {
    const active = Object.entries(filters || {}).filter(([, v]) => (v ?? "") !== "");
    if (!active.length && !qDebounced) return rows;

    const lc = (v: any) => String(v ?? "").toLowerCase();
    let data = [...rows];

    if (qDebounced) {
      const ql = qDebounced.toLowerCase();
      data = data.filter((r) => {
        const hay = [
          r.invoiceNumber,
          r.clientPartyName,
          r.status,
          r.serviceCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      const issuedFrom = filters["issuedAt_from"];
      const issuedTo = filters["issuedAt_to"];
      const dueFrom = filters["dueAt_from"];
      const dueTo = filters["dueAt_to"];

      data = data.filter((r) => {
        const textOk = active.every(([key, val]) => {
          if (key.endsWith("_from") || key.endsWith("_to")) return true;
          const raw = (r as any)[key];
          const isDate = DATE_KEYS.has(key as any);
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        });
        if (!textOk) return false;

        const issuedOk = issuedFrom || issuedTo ? inDateRange(r.issuedAt, issuedFrom, issuedTo) : true;
        const dueOk = dueFrom || dueTo ? inDateRange(r.dueAt, dueFrom, dueTo) : true;
        return issuedOk && dueOk;
      });
    }

    return data;
  }, [rows, filters, qDebounced]);

  // Sorting
  const [sorts, setSorts] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>([]);
  const onToggleSort = (key: string) => {
    setSorts((prev) => {
      const found = prev.find((s) => s.key === key);
      if (!found) return [{ key, dir: "asc" }];
      if (found.dir === "asc")
        return prev.map((s) => (s.key === key ? { ...s, dir: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };
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
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (cmp !== 0) return s.dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return out;
  }, [displayRows, sorts]);

  // Paging
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = sortedRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end =
    sortedRows.length === 0
      ? 0
      : Math.min(sortedRows.length, (clampedPage - 1) * pageSize + pageSize);
  const pageRows = React.useMemo(() => {
    const from = (clampedPage - 1) * pageSize;
    const to = from + pageSize;
    return sortedRows.slice(from, to);
  }, [sortedRows, clampedPage, pageSize]);

  // CSV export
  const handleExportCsv = React.useCallback(() => {
    exportToCsv({
      columns: COLUMNS,
      rows: sortedRows,
      filename: "invoices",
      formatValue: (value, key) => {
        if (DATE_KEYS.has(key as any)) {
          return fmt(value);
        }
        if (key === "totalCents" || key === "balanceCents") {
          return formatCents(value);
        }
        return value;
      },
    });
    setMenuOpen(false);
  }, [sortedRows]);

  const loadInvoices = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.finance.invoices.list({ limit: 1000, offset: 0 });
      const items = (res?.items || res?.data || []).map(invoiceToRow);
      setRows(items);
    } catch (e: any) {
      setError(e?.payload?.error || e?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [api]);

  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <div className="relative">
        <PageHeader title="Invoices" subtitle="Manage all invoices across your program" />
        <div
          className="absolute right-0 top-0 h-full flex items-center gap-2 pr-1"
          style={{ zIndex: 5, pointerEvents: "auto" }}
        >
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
          <Button size="sm" onClick={() => setShowInvoiceModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={COLUMNS}
          columnState={map}
          onColumnStateChange={setAll}
          getRowId={(r: InvoiceRow) => r.id}
          pageSize={pageSize}
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
              placeholder="Search invoices…"
              widthPx={520}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                  title="Filters"
                  className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/5 focus:outline-none"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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

          <FilterChips
            filters={filters}
            onChange={setFilters}
            prettyLabel={(k) => {
              if (k === "issuedAt_from") return "Issued ≥";
              if (k === "issuedAt_to") return "Issued ≤";
              if (k === "dueAt_from") return "Due ≥";
              if (k === "dueAt_to") return "Due ≤";
              return k;
            }}
          />

          {/* Table */}
          <table className="min-w-max w-full text-sm">
            <TableHeader columns={visibleSafe} sorts={sorts} onToggleSort={onToggleSort} />
            <tbody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">
                      Loading invoices…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-red-600">
                      Error: {error}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleSafe.length}>
                    <div className="py-8 text-center text-sm text-secondary">
                      No invoices to display yet.
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                pageRows.length > 0 &&
                pageRows.map((r) => (
                  <TableRow
                    key={String(r.id)}
                    onClick={() => setSelectedInvoice(r)}
                    className="cursor-pointer hover:bg-muted/20"
                  >
                    {visibleSafe.map((c) => {
                      let v = (r as any)[c.key] as any;
                      if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                      if (c.key === "totalCents" || c.key === "balanceCents") {
                        v = formatCents(v);
                      }
                      if (c.key === "status") {
                        return (
                          <TableCell key={c.key}>
                            <Badge
                              variant={
                                v === "PAID"
                                  ? "success"
                                  : v === "VOID"
                                  ? "default"
                                  : "default"
                              }
                            >
                              {v || "—"}
                            </Badge>
                          </TableCell>
                        );
                      }
                      return <TableCell key={c.key}>{v ?? "—"}</TableCell>;
                    })}
                  </TableRow>
                ))}
            </tbody>
          </table>

          <TableFooter
            entityLabel="invoices"
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
            filteredTotal={sortedRows.length}
            total={rows.length}
          />
        </Table>
      </Card>

      {/* Modals */}
      <InvoiceCreateModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={() => {
          setShowInvoiceModal(false);
          loadInvoices();
        }}
        api={api}
      />

      <InvoiceDetailDrawer
        invoice={selectedInvoice}
        api={api}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onVoid={() => {
          setSelectedInvoice(null);
          loadInvoices();
        }}
        onAddPayment={() => {
          console.log("Add payment for invoice:", selectedInvoice);
        }}
      />
    </div>
  );
}
