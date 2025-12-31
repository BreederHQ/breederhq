// packages/ui/src/components/Finance/PaymentCreateModal.tsx
// Modal for adding a payment to an invoice with idempotency

import * as React from "react";
import { Dialog } from "../Dialog";
import { Button } from "../Button";
import { Input } from "../Input";
import { useToast } from "../../atoms/Toast";
import { parseToCents, centsToInput } from "../../utils/money";

// Idempotency key generation
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

type PaymentMethodType =
  | "CASH"
  | "CHECK"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "ACH"
  | "WIRE"
  | "PAYPAL"
  | "VENMO"
  | "ZELLE"
  | "OTHER";

type CreatePaymentInput = {
  invoiceId: number;
  amountCents: number;
  receivedAt: string;
  methodType: PaymentMethodType;
  referenceNumber?: string | null;
  checkNumber?: string | null;
  last4?: string | null;
  notes?: string | null;
};

export interface PaymentCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  api: any;
  invoiceId: number;
  invoiceBalance?: number; // in cents, for suggestion
}

interface FormState {
  amountInput: string;
  receivedAt: string;
  methodType: PaymentMethodType;
  referenceNumber: string;
  checkNumber: string;
  last4: string;
  notes: string;
}

interface Errors {
  amount?: string;
  receivedAt?: string;
  methodType?: string;
}

export function PaymentCreateModal({
  open,
  onClose,
  onSuccess,
  api,
  invoiceId,
  invoiceBalance = 0,
}: PaymentCreateModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const idempotencyKeyRef = React.useRef<string>("");

  const [form, setForm] = React.useState<FormState>({
    amountInput: "",
    receivedAt: new Date().toISOString().slice(0, 10),
    methodType: "CASH",
    referenceNumber: "",
    checkNumber: "",
    last4: "",
    notes: "",
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      idempotencyKeyRef.current = generateIdempotencyKey();
      setForm({
        amountInput: invoiceBalance > 0 ? centsToInput(invoiceBalance) : "",
        receivedAt: new Date().toISOString().slice(0, 10),
        methodType: "CASH",
        referenceNumber: "",
        checkNumber: "",
        last4: "",
        notes: "",
      });
      setErrors({});
      setSubmitting(false);
    }
  }, [open, invoiceBalance]);

  const validate = (): boolean => {
    const errs: Errors = {};

    const amountCents = parseToCents(form.amountInput);
    if (!form.amountInput || amountCents <= 0) {
      errs.amount = "Amount must be greater than zero";
    }

    if (!form.receivedAt) {
      errs.receivedAt = "Received date is required";
    }

    if (!form.methodType) {
      errs.methodType = "Payment method is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const amountCents = parseToCents(form.amountInput);

      const input: CreatePaymentInput = {
        invoiceId,
        amountCents,
        receivedAt: form.receivedAt,
        methodType: form.methodType,
        referenceNumber: form.referenceNumber || null,
        checkNumber: form.checkNumber || null,
        last4: form.last4 || null,
        notes: form.notes || null,
      };

      await api.finance.payments.create(input, idempotencyKeyRef.current);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create payment:", err);

      // Handle idempotency conflict (409)
      if (err?.status === 409 || err?.message?.includes("409")) {
        toast.info("Payment already recorded - duplicate submission detected");
        onSuccess(); // Refresh data
        onClose();
      } else {
        toast.error(err?.message || "Failed to create payment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Payment" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-secondary mb-1">Amount *</label>
          <Input
            type="text"
            value={form.amountInput}
            onChange={(e) => setForm((f) => ({ ...f, amountInput: e.target.value }))}
            placeholder="0.00"
          />
          {errors.amount && <div className="text-xs text-red-400 mt-1">{errors.amount}</div>}
          <div className="text-xs text-secondary mt-1">Enter amount in dollars (e.g., 123.45)</div>
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Received Date *</label>
          <Input
            type="date"
            value={form.receivedAt}
            onChange={(e) => setForm((f) => ({ ...f, receivedAt: e.target.value }))}
          />
          {errors.receivedAt && <div className="text-xs text-red-400 mt-1">{errors.receivedAt}</div>}
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Payment Method *</label>
          <select
            className="w-full h-10 px-3 bg-card border border-hairline rounded-md text-sm"
            value={form.methodType}
            onChange={(e) =>
              setForm((f) => ({ ...f, methodType: e.target.value as PaymentMethodType }))
            }
          >
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="ACH">ACH</option>
            <option value="WIRE">Wire Transfer</option>
            <option value="PAYPAL">PayPal</option>
            <option value="VENMO">Venmo</option>
            <option value="ZELLE">Zelle</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.methodType && <div className="text-xs text-red-400 mt-1">{errors.methodType}</div>}
        </div>

        {form.methodType === "CHECK" && (
          <div>
            <label className="block text-xs text-secondary mb-1">Check Number</label>
            <Input
              value={form.checkNumber}
              onChange={(e) => setForm((f) => ({ ...f, checkNumber: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        )}

        {(form.methodType === "CREDIT_CARD" || form.methodType === "DEBIT_CARD") && (
          <div>
            <label className="block text-xs text-secondary mb-1">Last 4 Digits</label>
            <Input
              value={form.last4}
              onChange={(e) => setForm((f) => ({ ...f, last4: e.target.value }))}
              placeholder="Optional"
              maxLength={4}
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-secondary mb-1">Reference Number</label>
          <Input
            value={form.referenceNumber}
            onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
            placeholder="Transaction ID, confirmation number, etc."
          />
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Notes</label>
          <textarea
            className="w-full min-h-[60px] px-3 py-2 bg-card border border-hairline rounded-md text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add Payment"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
