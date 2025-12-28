// apps/finance/src/InvoicesPage.tsx
// Invoices ledger - module table with filters and export

import * as React from "react";
import { Card, Button, Badge, Input, SectionCard } from "@bhq/ui";
import { InvoiceCreateModal, InvoiceDetailDrawer } from "@bhq/ui/components/Finance";
import { formatCents } from "@bhq/ui/utils/money";
import { exportInvoicesCSV } from "@bhq/ui/utils/financeExports";
import { Plus, Search, Download, X } from "lucide-react";
import type { FinanceApi } from "./api";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";

interface InvoiceFilters {
  search: string;
  status: InvoiceStatus[];
  outstandingOnly: boolean;
  dateFrom: string;
  dateTo: string;
}

type Props = {
  api: FinanceApi;
};

export default function InvoicesPage({ api }: Props) {
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<InvoiceFilters>({
    search: "",
    status: [],
    outstandingOnly: false,
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);
  const pageSize = 50;

  // Load invoices
  const loadInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: pageSize, offset: (page - 1) * pageSize };

      // Server-side filters
      if (filters.status.length > 0) {
        params.status = filters.status.join(",");
      }
      if (filters.outstandingOnly) {
        params.status = "ISSUED,PARTIALLY_PAID";
      }
      if (filters.dateFrom) {
        params.issuedAtFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.issuedAtTo = filters.dateTo;
      }

      const res = await api.finance.invoices.list(params);
      let items = res.items || [];

      // Client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        items = items.filter((inv: any) => {
          const invoiceNum = (inv.invoiceNumber || "").toLowerCase();
          const clientName = (inv.clientPartyName || "").toLowerCase();
          return invoiceNum.includes(searchLower) || clientName.includes(searchLower);
        });
      }

      setInvoices(items);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [api, filters, page, pageSize]);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleExport = () => {
    exportInvoicesCSV(invoices, `invoices-${new Date().toISOString().slice(0, 10)}`);
  };

  const toggleStatus = (status: InvoiceStatus) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: [],
      outstandingOnly: false,
      dateFrom: "",
      dateTo: "",
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.search ||
    filters.status.length > 0 ||
    filters.outstandingOnly ||
    filters.dateFrom ||
    filters.dateTo;

  const pageCount = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleExport} disabled={invoices.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={() => setShowInvoiceModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-secondary mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-secondary" />
              <Input
                placeholder="Invoice # or client..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Issued From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Issued To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-secondary">Status:</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.outstandingOnly}
              onChange={(e) =>
                setFilters({ ...filters, outstandingOnly: e.target.checked, status: [] })
              }
              className="h-4 w-4"
            />
            Outstanding only
          </label>
          {(["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"] as InvoiceStatus[]).map(
            (status) => (
              <Button
                key={status}
                size="xs"
                variant={filters.status.includes(status) ? "default" : "outline"}
                onClick={() => {
                  toggleStatus(status);
                  setFilters((prev) => ({ ...prev, outstandingOnly: false }));
                }}
                disabled={filters.outstandingOnly}
              >
                {status}
              </Button>
            )
          )}
          {hasActiveFilters && (
            <Button size="xs" variant="ghost" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-sm text-secondary py-8 text-center">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="text-sm text-secondary py-8 text-center">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-hairline">
                <tr>
                  <th className="text-left py-2 pr-3 font-medium">Invoice #</th>
                  <th className="text-left py-2 pr-3 font-medium">Client</th>
                  <th className="text-left py-2 pr-3 font-medium">Anchor</th>
                  <th className="text-right py-2 pr-3 font-medium">Total</th>
                  <th className="text-right py-2 pr-3 font-medium">Collected</th>
                  <th className="text-right py-2 pr-3 font-medium">Outstanding</th>
                  <th className="text-left py-2 pr-3 font-medium">Status</th>
                  <th className="text-left py-2 pr-3 font-medium">Issued</th>
                  <th className="text-left py-2 pr-3 font-medium">Due</th>
                  <th className="text-right py-2 pr-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const collected = (inv.totalCents || 0) - (inv.balanceCents || 0);
                  let anchor = "—";
                  if (inv.animalId) anchor = `Animal #${inv.animalId}`;
                  else if (inv.offspringGroupId) anchor = `Group #${inv.offspringGroupId}`;
                  else if (inv.breedingPlanId) anchor = `Plan #${inv.breedingPlanId}`;
                  else if (inv.serviceCode) anchor = inv.serviceCode;

                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-hairline/60 hover:bg-muted/20 cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-2 pr-3">{inv.invoiceNumber || "—"}</td>
                      <td className="py-2 pr-3">{inv.clientPartyName || "—"}</td>
                      <td className="py-2 pr-3 text-xs">{anchor}</td>
                      <td className="py-2 pr-3 text-right">{formatCents(inv.totalCents)}</td>
                      <td className="py-2 pr-3 text-right">{formatCents(collected)}</td>
                      <td className="py-2 pr-3 text-right">{formatCents(inv.balanceCents)}</td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant={
                            inv.status === "PAID"
                              ? "success"
                              : inv.status === "VOID"
                              ? "default"
                              : "default"
                          }
                        >
                          {inv.status || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3">
                        {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                        >
                          View
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
              Showing {start} - {end} of {total} invoices
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
