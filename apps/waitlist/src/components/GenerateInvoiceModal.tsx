import * as React from "react";
import { Button } from "@bhq/ui/components/Button/Button";
import type { WaitlistApi, GenerateDepositInvoiceInput } from "../api";

export type GenerateInvoiceModalProps = {
  /** Name of the applicant for display */
  applicantName: string;
  /** Email of the applicant (for confirmation display) */
  applicantEmail?: string | null;
  /** Default deposit amount in cents from program settings */
  defaultAmountCents?: number | null;
  /** API client */
  api: WaitlistApi;
  /** Waitlist entry ID */
  entryId: number;
  /** Called on successful invoice generation */
  onSuccess: () => void;
  /** Called when modal is closed/cancelled */
  onCancel: () => void;
  /** Loading state from parent */
  loading?: boolean;
};

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

function formatCentsForInput(cents: number | null | undefined): string {
  if (cents == null || cents === 0) return "";
  return (cents / 100).toFixed(2);
}

function parseDollarsToCents(value: string): number | null {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function GenerateInvoiceModal({
  applicantName,
  applicantEmail,
  defaultAmountCents,
  api,
  entryId,
  onSuccess,
  onCancel,
  loading: externalLoading,
}: GenerateInvoiceModalProps) {
  const [amount, setAmount] = React.useState(formatCentsForInput(defaultAmountCents));
  const [dueDate, setDueDate] = React.useState(formatDate(addDays(new Date(), 14)));
  const [sendEmail, setSendEmail] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isLoading = loading || externalLoading;

  const handleSubmit = async () => {
    setError(null);

    const amountCents = parseDollarsToCents(amount);
    if (!amountCents) {
      setError("Please enter a valid deposit amount greater than $0");
      return;
    }

    const input: GenerateDepositInvoiceInput = {
      amountCents,
      dueAt: dueDate || null,
      sendEmail,
    };

    setLoading(true);
    try {
      await api.waitlist.generateDepositInvoice(entryId, input);
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-surface border border-hairline rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline">
          <h3 className="text-lg font-semibold">Generate Deposit Invoice</h3>
          <p className="text-sm text-secondary mt-1">
            Create a deposit invoice for <strong>{applicantName}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Deposit Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} pl-8`}
                disabled={isLoading}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            {defaultAmountCents != null && defaultAmountCents > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Default from program settings: ${(defaultAmountCents / 100).toFixed(2)}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
              min={formatDate(new Date())}
              disabled={isLoading}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          {/* Send Email Toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-hairline text-[hsl(var(--brand-orange))] focus:ring-[hsl(var(--brand-orange))]"
              disabled={isLoading || !applicantEmail}
            />
            <div className="flex-1">
              <label htmlFor="sendEmail" className="text-sm font-medium cursor-pointer">
                Send invoice via email
              </label>
              {applicantEmail ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Will be sent to: {applicantEmail}
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-0.5">
                  No email address available for this applicant
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info banner */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              The invoice will be created and linked to this waitlist entry.
              Payment status will be visible on the waitlist.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-hairline flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || !amount}
          >
            {isLoading ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
