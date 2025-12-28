// apps/finance/src/FinanceHub.tsx
// Finance hub - tenant-wide ledger for invoices and expenses

import * as React from "react";
import { PageHeader, Card, Button, Badge, InvoiceCreateModal, SectionCard, Input } from "@bhq/ui";
import { ExpenseModal, InvoiceDetailDrawer } from "@bhq/ui/components/Finance";
import { formatCents } from "@bhq/ui/utils/money";
import { Plus, Search, Filter } from "lucide-react";
import { makeApi } from "./api";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";
type ExpenseCategory = "VET" | "SUPPLIES" | "FOOD" | "GROOMING" | "BREEDING" | "FACILITY" | "MARKETING" | "LABOR" | "INSURANCE" | "REGISTRATION" | "TRAVEL" | "OTHER";

interface InvoiceFilters {
  search: string;
  status: InvoiceStatus[];
  outstandingOnly: boolean;
  dateFrom: string;
  dateTo: string;
}

interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | "";
  dateFrom: string;
  dateTo: string;
  unanchoredOnly: boolean;
  anchoredOnly: boolean;
}

export default function FinanceHub() {
  const api = React.useMemo(() => makeApi("/api/v1"), []);
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [showExpenseModal, setShowExpenseModal] = React.useState(false);

  // Invoice state
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = React.useState(true);
  const [invoiceFilters, setInvoiceFilters] = React.useState<InvoiceFilters>({
    search: "",
    status: [],
    outstandingOnly: false,
    dateFrom: "",
    dateTo: "",
  });
  const [invoicePage, setInvoicePage] = React.useState(1);
  const [invoiceTotal, setInvoiceTotal] = React.useState(0);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);

  // Expense state
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = React.useState(true);
  const [expenseFilters, setExpenseFilters] = React.useState<ExpenseFilters>({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    unanchoredOnly: false,
    anchoredOnly: false,
  });
  const [expensePage, setExpensePage] = React.useState(1);
  const [expenseTotal, setExpenseTotal] = React.useState(0);
  const [selectedExpense, setSelectedExpense] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "finance", label: "Finance" },
        })
      );
    }
  }, []);

  // Load invoices
  const loadInvoices = React.useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const params: any = { limit: 50, offset: (invoicePage - 1) * 50 };

      // Server-side filters
      if (invoiceFilters.status.length > 0) {
        params.status = invoiceFilters.status.join(",");
      }
      if (invoiceFilters.outstandingOnly) {
        params.status = "ISSUED,PARTIALLY_PAID";
      }
      if (invoiceFilters.dateFrom) {
        params.issuedAtFrom = invoiceFilters.dateFrom;
      }
      if (invoiceFilters.dateTo) {
        params.issuedAtTo = invoiceFilters.dateTo;
      }

      const res = await api.finance.invoices.list(params);
      let items = res.items || [];

      // Client-side search filter if backend doesn't support text search
      if (invoiceFilters.search) {
        const searchLower = invoiceFilters.search.toLowerCase();
        items = items.filter((inv: any) => {
          const invoiceNum = (inv.invoiceNumber || "").toLowerCase();
          const clientName = (inv.clientPartyName || "").toLowerCase();
          return invoiceNum.includes(searchLower) || clientName.includes(searchLower);
        });
      }

      setInvoices(items);
      setInvoiceTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  }, [api, invoiceFilters, invoicePage]);

  // Load expenses
  const loadExpenses = React.useCallback(async () => {
    setExpensesLoading(true);
    try {
      const params: any = { limit: 50, offset: (expensePage - 1) * 50 };

      // Server-side filters
      if (expenseFilters.category) {
        params.category = expenseFilters.category;
      }
      if (expenseFilters.dateFrom) {
        params.incurredAtFrom = expenseFilters.dateFrom;
      }
      if (expenseFilters.dateTo) {
        params.incurredAtTo = expenseFilters.dateTo;
      }

      const res = await api.finance.expenses.list(params);
      let items = res.items || [];

      // Client-side filters
      if (expenseFilters.search) {
        const searchLower = expenseFilters.search.toLowerCase();
        items = items.filter((exp: any) => {
          const vendorName = (exp.vendorPartyName || "").toLowerCase();
          const description = (exp.description || "").toLowerCase();
          return vendorName.includes(searchLower) || description.includes(searchLower);
        });
      }

      if (expenseFilters.unanchoredOnly) {
        items = items.filter((exp: any) => !exp.animalId && !exp.offspringGroupId && !exp.breedingPlanId);
      }

      if (expenseFilters.anchoredOnly) {
        items = items.filter((exp: any) => exp.animalId || exp.offspringGroupId || exp.breedingPlanId);
      }

      setExpenses(items);
      setExpenseTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setExpensesLoading(false);
    }
  }, [api, expenseFilters, expensePage]);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  React.useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title="Finance"
        subtitle="Tenant-wide ledger for invoices and expenses"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowExpenseModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Expense
            </Button>
            <Button onClick={() => setShowInvoiceModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        }
      />

      {/* All Invoices Section */}
      <SectionCard title="All Invoices">
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/20 rounded-md">
            <div>
              <label className="block text-xs text-secondary mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-secondary" />
                <Input
                  placeholder="Invoice # or client..."
                  value={invoiceFilters.search}
                  onChange={(e) => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Date From</label>
              <Input
                type="date"
                value={invoiceFilters.dateFrom}
                onChange={(e) => setInvoiceFilters({ ...invoiceFilters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Date To</label>
              <Input
                type="date"
                value={invoiceFilters.dateTo}
                onChange={(e) => setInvoiceFilters({ ...invoiceFilters, dateTo: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={invoiceFilters.outstandingOnly}
                  onChange={(e) => setInvoiceFilters({ ...invoiceFilters, outstandingOnly: e.target.checked })}
                  className="h-4 w-4"
                />
                Outstanding only
              </label>
            </div>
          </div>

          {/* Table */}
          {invoicesLoading ? (
            <div className="text-sm text-secondary">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-sm text-secondary">No invoices found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-hairline">
                  <tr>
                    <th className="text-left py-2 pr-3 font-medium">Invoice #</th>
                    <th className="text-left py-2 pr-3 font-medium">Client</th>
                    <th className="text-left py-2 pr-3 font-medium">Status</th>
                    <th className="text-right py-2 pr-3 font-medium">Total</th>
                    <th className="text-right py-2 pr-3 font-medium">Balance</th>
                    <th className="text-left py-2 pr-3 font-medium">Issued</th>
                    <th className="text-right py-2 pr-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-hairline/60">
                      <td className="py-2 pr-3">{inv.invoiceNumber || "—"}</td>
                      <td className="py-2 pr-3">{inv.clientPartyName || "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={inv.status === "PAID" ? "success" : "default"}>
                          {inv.status || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-right">{formatCents(inv.totalCents)}</td>
                      <td className="py-2 pr-3 text-right">{formatCents(inv.balanceCents)}</td>
                      <td className="py-2 pr-3">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <Button size="xs" variant="ghost" onClick={() => setSelectedInvoice(inv)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!invoicesLoading && invoiceTotal > 50 && (
            <div className="flex justify-between items-center pt-2 text-xs text-secondary">
              <div>
                Showing {(invoicePage - 1) * 50 + 1} - {Math.min(invoicePage * 50, invoiceTotal)} of {invoiceTotal}
              </div>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={invoicePage === 1}
                  onClick={() => setInvoicePage(invoicePage - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={invoicePage * 50 >= invoiceTotal}
                  onClick={() => setInvoicePage(invoicePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* All Expenses Section */}
      <SectionCard title="All Expenses">
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/20 rounded-md">
            <div>
              <label className="block text-xs text-secondary mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-secondary" />
                <Input
                  placeholder="Vendor or description..."
                  value={expenseFilters.search}
                  onChange={(e) => setExpenseFilters({ ...expenseFilters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Category</label>
              <select
                className="w-full h-10 px-3 bg-card border border-hairline rounded-md text-sm"
                value={expenseFilters.category}
                onChange={(e) => setExpenseFilters({ ...expenseFilters, category: e.target.value as any })}
              >
                <option value="">All</option>
                <option value="VET">Vet</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="FOOD">Food</option>
                <option value="GROOMING">Grooming</option>
                <option value="BREEDING">Breeding</option>
                <option value="FACILITY">Facility</option>
                <option value="MARKETING">Marketing</option>
                <option value="LABOR">Labor</option>
                <option value="INSURANCE">Insurance</option>
                <option value="REGISTRATION">Registration</option>
                <option value="TRAVEL">Travel</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Date From</label>
              <Input
                type="date"
                value={expenseFilters.dateFrom}
                onChange={(e) => setExpenseFilters({ ...expenseFilters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Date To</label>
              <Input
                type="date"
                value={expenseFilters.dateTo}
                onChange={(e) => setExpenseFilters({ ...expenseFilters, dateTo: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={expenseFilters.unanchoredOnly}
                  onChange={(e) => setExpenseFilters({ ...expenseFilters, unanchoredOnly: e.target.checked, anchoredOnly: false })}
                  className="h-4 w-4"
                />
                Program only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={expenseFilters.anchoredOnly}
                  onChange={(e) => setExpenseFilters({ ...expenseFilters, anchoredOnly: e.target.checked, unanchoredOnly: false })}
                  className="h-4 w-4"
                />
                Anchored only
              </label>
            </div>
          </div>

          {/* Table */}
          {expensesLoading ? (
            <div className="text-sm text-secondary">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-sm text-secondary">No expenses found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-hairline">
                  <tr>
                    <th className="text-left py-2 pr-3 font-medium">Category</th>
                    <th className="text-left py-2 pr-3 font-medium">Vendor</th>
                    <th className="text-left py-2 pr-3 font-medium">Description</th>
                    <th className="text-right py-2 pr-3 font-medium">Amount</th>
                    <th className="text-left py-2 pr-3 font-medium">Date</th>
                    <th className="text-right py-2 pr-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-hairline/60">
                      <td className="py-2 pr-3">{exp.category || "—"}</td>
                      <td className="py-2 pr-3">{exp.vendorPartyName || "—"}</td>
                      <td className="py-2 pr-3">{exp.description || exp.notes || "—"}</td>
                      <td className="py-2 pr-3 text-right">{formatCents(exp.amountCents)}</td>
                      <td className="py-2 pr-3">
                        {exp.incurredAt ? new Date(exp.incurredAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setSelectedExpense(exp);
                            setShowExpenseModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!expensesLoading && expenseTotal > 50 && (
            <div className="flex justify-between items-center pt-2 text-xs text-secondary">
              <div>
                Showing {(expensePage - 1) * 50 + 1} - {Math.min(expensePage * 50, expenseTotal)} of {expenseTotal}
              </div>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={expensePage === 1}
                  onClick={() => setExpensePage(expensePage - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={expensePage * 50 >= expenseTotal}
                  onClick={() => setExpensePage(expensePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

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
