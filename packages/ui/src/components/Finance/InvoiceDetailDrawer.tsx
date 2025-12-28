// packages/ui/src/components/Finance/InvoiceDetailDrawer.tsx
// Drawer component to view invoice details and payment history

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button, Badge, SectionCard } from "@bhq/ui";
import { formatCents } from "../../utils/money";
import { getOverlayRoot } from "../../overlay";
import { PaymentCreateModal } from "./PaymentCreateModal";
import { ReceiptsSection } from "./ReceiptsSection";
import { useToast } from "../../atoms/Toast";
import type { InvoiceLineItemDTO } from "@bhq/api/types/finance";

export interface InvoiceDetailDrawerProps {
  invoice: any;
  api: any;
  open: boolean;
  onClose: () => void;
  onVoid?: () => void;
  onAddPayment?: () => void;
}

export function InvoiceDetailDrawer({
  invoice,
  api,
  open,
  onClose,
  onVoid,
  onAddPayment,
}: InvoiceDetailDrawerProps) {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [voiding, setVoiding] = React.useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);

  const loadPayments = React.useCallback(async () => {
    if (!invoice?.id) return;
    setLoading(true);
    try {
      const res = await api.finance.payments.list({ invoiceId: invoice.id, limit: 100 });

      // Sort payments by receivedAt desc (newest first), fallback to createdAt
      const sortedPayments = (res?.items || []).sort((a: any, b: any) => {
        const aDate = a.receivedAt || a.createdAt;
        const bDate = b.receivedAt || b.createdAt;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setPayments(sortedPayments);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }, [api, invoice?.id]);

  React.useEffect(() => {
    if (open && invoice?.id) {
      loadPayments();
    }
  }, [open, invoice?.id, loadPayments]);

  const handleVoid = async () => {
    if (!invoice?.id) return;
    if (!confirm("Are you sure you want to void this invoice? This action cannot be undone.")) return;

    setVoiding(true);
    try {
      await api.finance.invoices.void(invoice.id);
      if (onVoid) onVoid();
      onClose();
    } catch (err: any) {
      console.error("Failed to void invoice:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to void invoice",
        variant: "destructive",
      });
    } finally {
      setVoiding(false);
    }
  };

  const overlayRoot = getOverlayRoot();
  if (!open || !overlayRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-2xl bg-surface shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline p-4">
          <div>
            <h2 className="text-lg font-semibold">Invoice Details</h2>
            <p className="text-sm text-secondary">{invoice.invoiceNumber}</p>
          </div>
          <button
            type="button"
            className="rounded p-2 hover:bg-white/5"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Invoice Info */}
          <SectionCard title="Invoice Information">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-secondary mb-1">Status</div>
                <Badge variant={invoice.status === "PAID" ? "success" : "default"}>
                  {invoice.status}
                </Badge>
              </div>
              {invoice.category && (
                <div>
                  <div className="text-xs text-secondary mb-1">Category</div>
                  <div>{invoice.category}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-secondary mb-1">Client</div>
                <div>{invoice.clientPartyName || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Issued Date</div>
                <div>
                  {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Due Date</div>
                <div>
                  {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Total</div>
                <div className="font-semibold">{formatCents(invoice.totalCents)}</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Balance</div>
                <div className="font-semibold">{formatCents(invoice.balanceCents)}</div>
              </div>
              {invoice.notes && (
                <div className="col-span-2">
                  <div className="text-xs text-secondary mb-1">Notes</div>
                  <div>{invoice.notes}</div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Line Items Section */}
          <SectionCard title="Line Items">
            {(() => {
              // Backward compatibility: if no lineItems, show synthetic row
              const lineItems = invoice.lineItems && invoice.lineItems.length > 0
                ? invoice.lineItems
                : [{
                    kind: "OTHER",
                    description: "Invoice total",
                    qty: 1,
                    unitCents: invoice.totalCents,
                    totalCents: invoice.totalCents,
                  }];

              const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.totalCents || 0), 0);

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-hairline">
                        <tr>
                          <th className="text-left py-2 pr-3 font-medium">Kind</th>
                          <th className="text-left py-2 pr-3 font-medium">Description</th>
                          <th className="text-right py-2 pr-3 font-medium">Qty</th>
                          <th className="text-right py-2 pr-3 font-medium">Unit Price</th>
                          <th className="text-right py-2 pr-3 font-medium">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item: any, idx: number) => (
                          <tr key={item.id || idx} className="border-b border-hairline/60">
                            <td className="py-2 pr-3">{item.kind || "—"}</td>
                            <td className="py-2 pr-3">{item.description || "—"}</td>
                            <td className="py-2 pr-3 text-right">{item.qty || 1}</td>
                            <td className="py-2 pr-3 text-right">{formatCents(item.unitCents)}</td>
                            <td className="py-2 pr-3 text-right">{formatCents(item.totalCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mt-3">
                    <div className="w-64 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary">Subtotal:</span>
                        <span className="font-semibold">{formatCents(subtotal)}</span>
                      </div>
                      <div className="flex justify-between border-t border-hairline pt-1">
                        <span className="font-medium">Total:</span>
                        <span className="font-semibold">{formatCents(subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </SectionCard>

          {/* Payment History */}
          <SectionCard
            title="Payment History"
            actions={
              invoice.status !== "VOID" && invoice.status !== "VOIDED" && invoice.status !== "PAID" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (onAddPayment) {
                      onAddPayment();
                    } else {
                      setPaymentModalOpen(true);
                    }
                  }}
                >
                  Add Payment
                </Button>
              ) : undefined
            }
          >
            {loading ? (
              <div className="text-sm text-secondary">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="text-sm text-secondary">No payments recorded</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-hairline">
                    <tr>
                      <th className="text-left py-2 pr-3 font-medium">Date</th>
                      <th className="text-left py-2 pr-3 font-medium">Method</th>
                      <th className="text-right py-2 pr-3 font-medium">Amount</th>
                      <th className="text-left py-2 pr-3 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pmt) => (
                      <tr key={pmt.id} className="border-b border-hairline/60">
                        <td className="py-2 pr-3">
                          {pmt.receivedAt
                            ? new Date(pmt.receivedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-2 pr-3">{pmt.methodType || "—"}</td>
                        <td className="py-2 pr-3 text-right">{formatCents(pmt.amountCents)}</td>
                        <td className="py-2 pr-3">{pmt.referenceNumber || pmt.checkNumber || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Invoice Attachments */}
          <SectionCard title="Invoice Attachments">
            <ReceiptsSection
              label="Attachments"
              entityId={invoice.id}
              attachments={api.finance.invoices.attachments}
            />
          </SectionCard>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-hairline p-4 flex items-center justify-between">
          <div>
            {invoice.status !== "VOID" && invoice.status !== "VOIDED" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleVoid}
                disabled={voiding || invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID"}
              >
                {voiding ? "Voiding..." : "Void Invoice"}
              </Button>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Payment Create Modal */}
        <PaymentCreateModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            loadPayments();
            // Notify parent to refresh invoice data
            if (onVoid) onVoid();
          }}
          api={api}
          invoiceId={invoice.id}
          invoiceBalance={invoice.balanceCents}
        />
      </div>
    </div>,
    overlayRoot
  );
}
