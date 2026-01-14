// apps/waitlist/src/components/WaitlistCardView.tsx
// Card-based view for waitlist entries

import * as React from "react";
import { DollarSign, Mail, Phone, User } from "lucide-react";

type WaitlistInvoiceSummary = {
  id: number;
  status: string;
  totalCents?: number | null;
  dueAt?: string | null;
};

type WaitlistTableRow = {
  id: number;
  contactLabel?: string | null;
  orgLabel?: string | null;
  speciesPref?: string | null;
  breedPrefText?: string | null;
  damPrefName?: string | null;
  sirePrefName?: string | null;
  depositPaidAt?: string | null;
  invoice?: WaitlistInvoiceSummary | null;
  status?: string | null;
  priority?: number | null;
  skipCount?: number | null;
  lastActivityAt?: string | null;
  notes?: string | null;
};

// Status colors for left accent stripe
const STATUS_COLORS: Record<string, string> = {
  APPROVED: "hsl(142, 70%, 45%)",       // Green
  ACTIVE: "hsl(142, 70%, 45%)",         // Green
  INQUIRY: "hsl(45, 90%, 50%)",         // Gold
  DEPOSIT_PAID: "hsl(210, 70%, 50%)",   // Blue
  PLACED: "hsl(160, 50%, 40%)",         // Teal
  FULFILLED: "hsl(160, 50%, 40%)",      // Teal
  EXPIRED: "hsl(0, 0%, 50%)",           // Gray
  CANCELED: "hsl(0, 0%, 50%)",          // Gray
};

// Payment status colors
const PAYMENT_COLORS: Record<string, string> = {
  PAID: "hsl(142, 70%, 45%)",           // Green
  PENDING: "hsl(45, 90%, 50%)",         // Gold
  OVERDUE: "hsl(0, 70%, 50%)",          // Red
  VOID: "hsl(0, 0%, 50%)",              // Gray
};

// Species emoji helper
function speciesEmoji(species?: string | null): string {
  const s = (species || "").toLowerCase();
  if (s === "dog") return "🐶";
  if (s === "cat") return "🐱";
  if (s === "horse") return "🐴";
  if (s === "goat") return "🐐";
  if (s === "sheep") return "🐑";
  if (s === "rabbit") return "🐰";
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

// Format money
function formatMoney(cents?: number | null): string {
  if (cents == null) return "";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(dollars);
}

type WaitlistCardViewProps = {
  rows: WaitlistTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: WaitlistTableRow) => void;
};

function WaitlistCard({ row, onClick }: { row: WaitlistTableRow; onClick?: () => void }) {
  const statusKey = (row.status || "APPROVED").toUpperCase();
  const accentColor = STATUS_COLORS[statusKey] || STATUS_COLORS.APPROVED;

  const displayName = row.contactLabel || row.orgLabel || `Entry #${row.id}`;
  const hasOrg = row.orgLabel && row.contactLabel;

  // Payment status
  const invoiceStatus = row.invoice?.status?.toUpperCase() || "";
  const paymentColor = PAYMENT_COLORS[invoiceStatus] || PAYMENT_COLORS.PENDING;
  const isPaid = invoiceStatus === "PAID";
  const depositDate = formatDate(row.depositPaidAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 cursor-pointer hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15"
    >
      {/* Left accent stripe - colored by status */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top row: Contact/Org info */}
      <div className="flex items-start gap-3">
        {/* Avatar - species emoji or user icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl">
          {row.speciesPref ? speciesEmoji(row.speciesPref) : <User className="w-6 h-6 text-secondary" />}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {displayName}
            </span>
            {row.priority != null && row.priority > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 font-medium">
                #{row.priority}
              </span>
            )}
          </div>
          {hasOrg && (
            <div className="text-xs text-secondary mt-0.5 truncate">
              {row.orgLabel}
            </div>
          )}
          <div className="text-xs text-secondary mt-0.5">
            {[row.speciesPref, row.breedPrefText].filter(Boolean).join(" • ") || "No preferences"}
          </div>
        </div>
      </div>

      {/* Parents preferences */}
      {(row.damPrefName || row.sirePrefName) && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          {row.damPrefName && (
            <div className="flex items-center gap-1.5">
              <span className="text-pink-400">♀</span>
              <span className="text-secondary truncate max-w-[100px]">{row.damPrefName}</span>
            </div>
          )}
          {row.damPrefName && row.sirePrefName && (
            <span className="text-secondary">×</span>
          )}
          {row.sirePrefName && (
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400">♂</span>
              <span className="text-secondary truncate max-w-[100px]">{row.sirePrefName}</span>
            </div>
          )}
        </div>
      )}

      {/* Skip count if any */}
      {row.skipCount != null && row.skipCount > 0 && (
        <div className="mt-2 text-xs text-amber-400">
          Skipped {row.skipCount} time{row.skipCount !== 1 ? "s" : ""}
        </div>
      )}

      {/* Payment status + date */}
      <div className="mt-3 flex items-center justify-between">
        {/* Payment badge */}
        <div className="flex items-center gap-2">
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
              {row.invoice.totalCents && ` • ${formatMoney(row.invoice.totalCents)}`}
            </span>
          ) : (
            <span className="text-xs text-secondary">No deposit</span>
          )}
        </div>

        {/* Deposit date */}
        {depositDate && (
          <span className="text-xs text-secondary">{depositDate}</span>
        )}
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

export function WaitlistCardView({ rows, loading, error, onRowClick }: WaitlistCardViewProps) {
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
        No waitlist entries to display.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <WaitlistCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
