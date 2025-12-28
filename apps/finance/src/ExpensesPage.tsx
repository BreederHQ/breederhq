// apps/finance/src/ExpensesPage.tsx
// Expenses ledger - module table with filters and export

import * as React from "react";
import { PageHeader, Card, Button, Input } from "@bhq/ui";
import { ExpenseModal } from "@bhq/ui/components/Finance";
import { formatCents } from "@bhq/ui/utils/money";
import { exportExpensesCSV } from "@bhq/ui/utils/financeExports";
import { Plus, Search, Download, X } from "lucide-react";
import type { FinanceApi } from "./api";

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

interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | "";
  dateFrom: string;
  dateTo: string;
  unanchoredOnly: boolean;
  anchoredOnly: boolean;
}

type Props = {
  api: FinanceApi;
};

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

export default function ExpensesPage({ api }: Props) {
  const [showExpenseModal, setShowExpenseModal] = React.useState(false);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ExpenseFilters>({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    unanchoredOnly: false,
    anchoredOnly: false,
  });
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [selectedExpense, setSelectedExpense] = React.useState<any | null>(null);
  const pageSize = 50;

  // Load expenses
  const loadExpenses = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: pageSize, offset: (page - 1) * pageSize };

      // Server-side filters
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.dateFrom) {
        params.incurredAtFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.incurredAtTo = filters.dateTo;
      }

      const res = await api.finance.expenses.list(params);
      let items = res.items || [];

      // Client-side filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        items = items.filter((exp: any) => {
          const vendorName = (exp.vendorPartyName || "").toLowerCase();
          const description = (exp.description || "").toLowerCase();
          const notes = (exp.notes || "").toLowerCase();
          return (
            vendorName.includes(searchLower) ||
            description.includes(searchLower) ||
            notes.includes(searchLower)
          );
        });
      }

      if (filters.unanchoredOnly) {
        items = items.filter(
          (exp: any) => !exp.animalId && !exp.offspringGroupId && !exp.breedingPlanId
        );
      }

      if (filters.anchoredOnly) {
        items = items.filter(
          (exp: any) => exp.animalId || exp.offspringGroupId || exp.breedingPlanId
        );
      }

      setExpenses(items);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [api, filters, page, pageSize]);

  React.useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleExport = () => {
    exportExpensesCSV(expenses, `expenses-${new Date().toISOString().slice(0, 10)}`);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      dateFrom: "",
      dateTo: "",
      unanchoredOnly: false,
      anchoredOnly: false,
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.unanchoredOnly ||
    filters.anchoredOnly;

  const pageCount = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Expenses"
        subtitle="Tenant-wide expense ledger"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={expenses.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setShowExpenseModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Expense
            </Button>
          </div>
        }
      />

      <Card className="p-4 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-secondary mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-secondary" />
              <Input
                placeholder="Vendor or description..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Category</label>
            <select
              className="w-full h-10 px-3 bg-card border border-hairline rounded-md text-sm"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Incurred From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Incurred To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        {/* Anchor Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-secondary">Anchor:</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.unanchoredOnly}
              onChange={(e) =>
                setFilters({ ...filters, unanchoredOnly: e.target.checked, anchoredOnly: false })
              }
              className="h-4 w-4"
            />
            Program expenses only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.anchoredOnly}
              onChange={(e) =>
                setFilters({ ...filters, anchoredOnly: e.target.checked, unanchoredOnly: false })
              }
              className="h-4 w-4"
            />
            Anchored only
          </label>
          {hasActiveFilters && (
            <Button size="xs" variant="ghost" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-sm text-secondary py-8 text-center">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="text-sm text-secondary py-8 text-center">No expenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-hairline">
                <tr>
                  <th className="text-left py-2 pr-3 font-medium">Category</th>
                  <th className="text-right py-2 pr-3 font-medium">Amount</th>
                  <th className="text-left py-2 pr-3 font-medium">Incurred</th>
                  <th className="text-left py-2 pr-3 font-medium">Vendor</th>
                  <th className="text-left py-2 pr-3 font-medium">Anchor</th>
                  <th className="text-left py-2 pr-3 font-medium">Notes</th>
                  <th className="text-right py-2 pr-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  let anchor = "Program";
                  if (exp.animalId) anchor = `Animal #${exp.animalId}`;
                  else if (exp.offspringGroupId) anchor = `Group #${exp.offspringGroupId}`;
                  else if (exp.breedingPlanId) anchor = `Plan #${exp.breedingPlanId}`;

                  return (
                    <tr
                      key={exp.id}
                      className="border-b border-hairline/60 hover:bg-muted/20 cursor-pointer"
                      onClick={() => {
                        setSelectedExpense(exp);
                        setShowExpenseModal(true);
                      }}
                    >
                      <td className="py-2 pr-3">
                        {exp.category ? CATEGORY_LABELS[exp.category as ExpenseCategory] || exp.category : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">{formatCents(exp.amountCents)}</td>
                      <td className="py-2 pr-3">
                        {exp.incurredAt ? new Date(exp.incurredAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3">{exp.vendorPartyName || "—"}</td>
                      <td className="py-2 pr-3 text-xs">{anchor}</td>
                      <td className="py-2 pr-3 text-xs truncate max-w-xs">
                        {exp.description || exp.notes || "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpense(exp);
                            setShowExpenseModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div className="flex justify-between items-center pt-2 text-xs text-secondary border-t border-hairline">
            <div>
              Showing {start} - {end} of {total} expenses
            </div>
            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center px-2">
                Page {page} of {pageCount}
              </div>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
