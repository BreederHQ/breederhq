// apps/waitlist/src/components/PendingCardView.tsx
// Card-based view for pending waitlist entries

import * as React from "react";
import { DollarSign, Clock, User } from "lucide-react";

type WaitlistInvoiceSummary = {
  id: number;
  status: string;
  totalCents?: number | null;
  dueAt?: string | null;
};

type PendingTableRow = {
  id: number;
  contactLabel: string | null;
  speciesPref: string | null;
  breedPrefText: string | null;
  invoice: WaitlistInvoiceSummary | null;
  notes: string | null;
  createdAt: string | null;
  status: string | null;
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  INQUIRY: "hsl(45, 90%, 50%)",         // Gold
  DEPOSIT_PAID: "hsl(210, 70%, 50%)",   // Blue
};

// Payment status colors
const PAYMENT_COLORS: Record<string, string> = {
  PAID: "hsl(142, 70%, 45%)",
  PENDING: "hsl(45, 90%, 50%)",
  OVERDUE: "hsl(0, 70%, 50%)",
  VOID: "hsl(0, 0%, 50%)",
};

// Species emoji helper
function speciesEmoji(species?: string | null): string {
  const s = (species || "").toLowerCase();
  if (s === "dog") return "🐶";
  if (s === "cat") return "🐱";
  if (s === "horse") return "🐴";
  return "🐾";
}

// Format date for display
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

type PendingCardViewProps = {
  rows: PendingTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: PendingTableRow) => void;
};

function PendingCard({ row, onClick }: { row: PendingTableRow; onClick?: () => void }) {
  const statusKey = (row.status || "INQUIRY").toUpperCase();
  const accentColor = STATUS_COLORS[statusKey] || STATUS_COLORS.INQUIRY;
  const isDepositPaid = statusKey === "DEPOSIT_PAID";

  const displayName = row.contactLabel || `Entry #${row.id}`;
  const submitDate = formatDate(row.createdAt);

  // Payment status
  const invoiceStatus = row.invoice?.status?.toUpperCase() || "";
  const paymentColor = PAYMENT_COLORS[invoiceStatus] || PAYMENT_COLORS.PENDING;
  const isPaid = invoiceStatus === "PAID";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 cursor-pointer hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15"
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top row: Contact info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl">
          {row.speciesPref ? speciesEmoji(row.speciesPref) : <User className="w-6 h-6 text-secondary" />}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {displayName}
            </span>
            {isDepositPaid && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 font-medium">
                Deposit Paid
              </span>
            )}
          </div>
          <div className="text-xs text-secondary mt-0.5">
            {[row.speciesPref, row.breedPrefText].filter(Boolean).join(" • ") || "No preferences"}
          </div>
        </div>
      </div>

      {/* Submitted date */}
      {submitDate && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
          <Clock className="w-3 h-3" />
          <span>Submitted {submitDate}</span>
        </div>
      )}

      {/* Payment status */}
      <div className="mt-3 flex items-center justify-between">
        {row.invoice ? (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${paymentColor}20`,
              color: paymentColor,
            }}
          >
            <DollarSign className="w-3 h-3" />
            {isPaid ? "Paid" : invoiceStatus.toLowerCase().replace("_", " ")}
          </span>
        ) : (
          <span className="text-xs text-secondary">No payment</span>
        )}

        {/* Status badge */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
          {isDepositPaid ? "Awaiting Approval" : "New Inquiry"}
        </span>
      </div>

      {/* Notes preview */}
      {row.notes && (
        <div className="mt-2 text-xs text-secondary/70 truncate">
          {row.notes.length > 80 ? row.notes.substring(0, 80) + "..." : row.notes}
        </div>
      )}
    </button>
  );
}

export function PendingCardView({ rows, loading, error, onRowClick }: PendingCardViewProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-secondary">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-secondary">
        No pending entries to display.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <PendingCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
