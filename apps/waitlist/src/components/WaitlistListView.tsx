// apps/waitlist/src/components/WaitlistListView.tsx
// List view for waitlist entries - cleaner row-based UI

import * as React from "react";
import { ChevronRight, DollarSign, User } from "lucide-react";

type ColumnDef = { key: string; label: string };

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

type WaitlistListViewProps = {
  rows: WaitlistTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: WaitlistTableRow) => void;
  visibleColumns: ColumnDef[];
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  APPROVED: "hsl(142, 70%, 45%)",
  ACTIVE: "hsl(142, 70%, 45%)",
  INQUIRY: "hsl(45, 90%, 50%)",
  DEPOSIT_PAID: "hsl(210, 70%, 50%)",
  PLACED: "hsl(160, 50%, 40%)",
  FULFILLED: "hsl(160, 50%, 40%)",
  EXPIRED: "hsl(0, 0%, 50%)",
  CANCELED: "hsl(0, 0%, 50%)",
};

// Payment status colors
const PAYMENT_COLORS: Record<string, string> = {
  PAID: "hsl(142, 70%, 45%)",
  PENDING: "hsl(45, 90%, 50%)",
  OVERDUE: "hsl(0, 70%, 50%)",
  VOID: "hsl(0, 0%, 50%)",
};

// Default avatar color
const DEFAULT_AVATAR_COLOR = "#a8a29e";

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

// Column width configuration - pixel widths for grid
const COLUMN_WIDTHS_PX: Record<string, number> = {
  contactLabel: 160,
  orgLabel: 140,
  speciesPref: 80,
  breedPrefText: 140,
  damPrefName: 120,
  sirePrefName: 120,
  depositPaidAt: 96,
  invoice: 120,
  status: 100,
  priority: 64,
  skipCount: 64,
  lastActivityAt: 96,
  notes: 180,
};

// Get grid template for visible columns
function getGridTemplate(columns: { key: string }[]): string {
  const colWidths = columns.map((c) => {
    const width = COLUMN_WIDTHS_PX[c.key] || 112;
    return `${width}px`;
  }).join(" ");
  return `32px ${colWidths} auto`;
}

// Format date helper
function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

// Format money helper
function formatMoney(cents?: number | null): string {
  if (cents == null) return "-";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(dollars);
}

function CellValue({ row, colKey }: { row: WaitlistTableRow; colKey: string }) {
  const value = (row as any)[colKey];

  switch (colKey) {
    case "contactLabel":
      return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-medium text-primary truncate min-w-0">{value || "-"}</span>
          {row.priority != null && row.priority > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 bg-amber-400/10 shrink-0">
              #{row.priority}
            </span>
          )}
        </div>
      );

    case "orgLabel":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

    case "speciesPref":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    case "breedPrefText":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

    case "damPrefName":
      return value ? (
        <div className="flex items-center gap-1 text-sm text-secondary truncate">
          <span className="text-pink-400">♀</span>
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "sirePrefName":
      return value ? (
        <div className="flex items-center gap-1 text-sm text-secondary truncate">
          <span className="text-blue-400">♂</span>
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "invoice":
      const invoice = row.invoice;
      if (!invoice) return <span className="text-sm text-secondary/50">-</span>;
      const invoiceStatus = (invoice.status || "").toUpperCase();
      const paymentColor = PAYMENT_COLORS[invoiceStatus] || PAYMENT_COLORS.PENDING;
      const isPaid = invoiceStatus === "PAID";
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${paymentColor}20`,
            color: paymentColor,
          }}
        >
          <DollarSign className="w-3 h-3" />
          {isPaid ? "Paid" : invoiceStatus.toLowerCase().replace("_", " ")}
        </span>
      );

    case "status":
      const statusKey = (value || "APPROVED").toUpperCase();
      const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.APPROVED;
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {statusKey.charAt(0) + statusKey.slice(1).toLowerCase().replace("_", " ")}
        </span>
      );

    case "priority":
      return value != null && value > 0 ? (
        <span className="text-sm text-amber-400 font-medium">#{value}</span>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "skipCount":
      return value != null && value > 0 ? (
        <span className="text-sm text-amber-400">{value}</span>
      ) : (
        <span className="text-sm text-secondary/50">0</span>
      );

    case "depositPaidAt":
    case "lastActivityAt":
      return <span className="text-sm text-secondary">{formatDate(value)}</span>;

    case "notes":
      if (!value) return <span className="text-sm text-secondary/50">-</span>;
      const truncated = value.length > 60 ? value.substring(0, 60) + "..." : value;
      return <span className="text-sm text-secondary/70 truncate">{truncated}</span>;

    default:
      if (Array.isArray(value)) {
        return <span className="text-sm text-secondary truncate">{value.join(", ") || "-"}</span>;
      }
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

function WaitlistListRow({
  row,
  onClick,
  visibleColumns,
}: {
  row: WaitlistTableRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
}) {
  const statusKey = (row.status || "APPROVED").toUpperCase();
  const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.APPROVED;
  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left grid items-center gap-3 px-4 py-3 border-b border-hairline transition-colors hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar - species emoji with status ring */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base ring-2"
        style={{ backgroundColor: DEFAULT_AVATAR_COLOR, ["--tw-ring-color" as any]: statusColor }}
      >
        {row.speciesPref ? speciesEmoji(row.speciesPref) : <User className="w-4 h-4 text-white" />}
      </div>

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div key={col.key} className="overflow-hidden">
          <CellValue row={row} colKey={col.key} />
        </div>
      ))}

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function WaitlistListView({
  rows,
  loading,
  error,
  onRowClick,
  visibleColumns,
}: WaitlistListViewProps) {
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

  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <div className="overflow-x-auto">
      {/* Header row - uses same grid as data rows */}
      <div
        className="grid items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-secondary bg-surface-2"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div /> {/* Avatar spacer */}
        {visibleColumns.map((col) => (
          <div key={col.key}>
            {col.label}
          </div>
        ))}
        <div /> {/* Chevron spacer */}
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <WaitlistListRow
          key={row.id}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
        />
      ))}
    </div>
  );
}
