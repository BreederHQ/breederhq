// apps/finance/src/ExpensesPage.tsx
// Expenses ledger - platform standard module table

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
  exportToCsv,
} from "@bhq/ui";
import { ExpenseModal } from "@bhq/ui/components/Finance";
import { formatCents } from "@bhq/ui/utils/money";
import { MoreHorizontal, Download, Plus } from "lucide-react";
import type { FinanceApi } from "./api";

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

type ID = number | string;

type ExpenseCategory =
  | "VET"
  | "SUPPLIES"
  | "FOOD"
  | "GROOMING"
  | "BREEDING"
  | "FACILITY"
  | "MARKETING"
  | "LABOR"
  | "INSURANCE"
  | "REGISTRATION"
  | "TRAVEL"
  | "OTHER";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  VET: "Vet",
  SUPPLIES: "Supplies",
  FOOD: "Food",
  GROOMING: "Grooming",
  BREEDING: "Breeding",
  FACILITY: "Facility",
  MARKETING: "Marketing",
  LABOR: "Labor",
  INSURANCE: "Insurance",
  REGISTRATION: "Registration",
  TRAVEL: "Travel",
  OTHER: "Other",
};

type ExpenseRow = {
  id: ID;
  category?: string | null;
  amountCents?: number | null;
  incurredAt?: string | null;
  vendorPartyName?: string | null;
  description?: string | null;
  notes?: string | null;
  animalId?: ID | null;
  offspringGroupId?: ID | null;
  breedingPlanId?: ID | null;
};

const COLUMNS: Array<{ key: keyof ExpenseRow & string; label: string; default?: boolean }> = [
  { key: "category", label: "Category", default: true },
  { key: "amountCents", label: "Amount", default: true },
  { key: "incurredAt", label: "Incurred", default: true },
  { key: "vendorPartyName", label: "Vendor", default: true },
  { key: "description", label: "Description", default: true },
  { key: "notes", label: "Notes", default: false },
];

const STORAGE_KEY = "bhq_finance_expenses_cols_v1";
const Q_KEY = "bhq_finance_expenses_q_v1";
const FILTERS_KEY = "bhq_finance_expenses_filters_v1";
const DATE_KEYS = new Set(["incurredAt"] as const);

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (!Number.isFinite(dt.getTime())) return String(d).slice(0, 10) || "";
  return dt.toLocaleDateString();
}

function expenseToRow(exp: any): ExpenseRow {
  return {
    id: exp.id,
    category: exp.category ?? null,
    amountCents: exp.amountCents ?? null,
    incurredAt: exp.incurredAt ?? null,
    vendorPartyName: exp.vendorPartyName ?? null,
    description: exp.description ?? null,
    notes: exp.notes ?? null,
    animalId: exp.animalId ?? null,
    offspringGroupId: exp.offspringGroupId ?? null,
    breedingPlanId: exp.breedingPlanId ?? null,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ────────────────────────────────────────────────────────────────────────── */

type Props = {
  api: FinanceApi;
};

export default function ExpensesPage({ api }: Props) {
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
  const [rows, setRows] = React.useState<ExpenseRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [page, setPage] = React.useState<number>(1);

  // Modals
  const [showExpenseModal, setShowExpenseModal] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<any | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Load data
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.finance.expenses.list({
          q: qDebounced || undefined,
          limit: 1000,
          offset: 0,
        });
        const items = (res?.items || res?.data || []).map(expenseToRow);
        if (!cancelled) setRows(items);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.payload?.error || e?.message || "Failed to load expenses");
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
      ["incurredAt"]
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
          r.category,
          r.vendorPartyName,
          r.description,
          r.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(ql);
      });
    }

    if (active.length) {
      const incurredFrom = filters["incurredAt_from"];
      const incurredTo = filters["incurredAt_to"];

      data = data.filter((r) => {
        const textOk = active.every(([key, val]) => {
          if (key.endsWith("_from") || key.endsWith("_to")) return true;
          const raw = (r as any)[key];
          const isDate = DATE_KEYS.has(key as any);
          const hay = isDate && raw ? String(raw).slice(0, 10) : String(raw ?? "");
          return lc(hay).includes(lc(val));
        });
        if (!textOk) return false;

        const incurredOk = incurredFrom || incurredTo ? inDateRange(r.incurredAt, incurredFrom, incurredTo) : true;
        return incurredOk;
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
      filename: "expenses",
      formatValue: (value, key) => {
        if (DATE_KEYS.has(key as any)) {
          return fmt(value);
        }
        if (key === "amountCents") {
          return formatCents(value);
        }
        if (key === "category") {
          return CATEGORY_LABELS[value as ExpenseCategory] || value;
        }
        return value;
      },
    });
    setMenuOpen(false);
  }, [sortedRows]);

  const loadExpenses = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.finance.expenses.list({ limit: 1000, offset: 0 });
      const items = (res?.items || res?.data || []).map(expenseToRow);
      setRows(items);
    } catch (e: any) {
      setError(e?.payload?.error || e?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [api]);

  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <div className="relative">
        <PageHeader title="Expenses" subtitle="Track all program and anchored expenses" />
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
          <Button size="sm" onClick={() => setShowExpenseModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={COLUMNS}
          columnState={map}
          onColumnStateChange={setAll}
          getRowId={(r: ExpenseRow) => r.id}
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
              placeholder="Search expenses…"
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
              if (k === "incurredAt_from") return "Incurred ≥";
              if (k === "incurredAt_to") return "Incurred ≤";
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
                      Loading expenses…
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
                      No expenses to display yet.
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
                    onClick={() => {
                      setSelectedExpense(r);
                      setShowExpenseModal(true);
                    }}
                    className="cursor-pointer hover:bg-muted/20"
                  >
                    {visibleSafe.map((c) => {
                      let v = (r as any)[c.key] as any;
                      if (DATE_KEYS.has(c.key as any)) v = fmt(v);
                      if (c.key === "amountCents") {
                        v = formatCents(v);
                      }
                      if (c.key === "category") {
                        v = CATEGORY_LABELS[v as ExpenseCategory] || v;
                      }
                      return <TableCell key={c.key}>{v ?? "—"}</TableCell>;
                    })}
                  </TableRow>
                ))}
            </tbody>
          </table>

          <TableFooter
            entityLabel="expenses"
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
      <ExpenseModal
        open={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setSelectedExpense(null);
        }}
        onSuccess={() => {
          setShowExpenseModal(false);
          setSelectedExpense(null);
          loadExpenses();
        }}
        api={api}
        expense={selectedExpense}
      />
    </div>
  );
}
