// apps/waitlist/src/components/PendingListView.tsx
// List view for pending waitlist entries

import * as React from "react";
import { ChevronRight, DollarSign, User } from "lucide-react";

type ColumnDef = { key: string; label: string };

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

type PendingListViewProps = {
  rows: PendingTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: PendingTableRow) => void;
  visibleColumns: ColumnDef[];
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  INQUIRY: "hsl(45, 90%, 50%)",
  DEPOSIT_PAID: "hsl(210, 70%, 50%)",
};

// Payment status colors
const PAYMENT_COLORS: Record<string, string> = {
  PAID: "hsl(142, 70%, 45%)",
  PENDING: "hsl(45, 90%, 50%)",
  OVERDUE: "hsl(0, 70%, 50%)",
  VOID: "hsl(0, 0%, 50%)",
};

const DEFAULT_AVATAR_COLOR = "#a8a29e";

// Species emoji helper
function speciesEmoji(species?: string | null): string {
  const s = (species || "").toLowerCase();
  if (s === "dog") return "🐶";
  if (s === "cat") return "🐱";
  if (s === "horse") return "🐴";
  return "🐾";
}

// Column widths
const COLUMN_WIDTHS_PX: Record<string, number> = {
  contactLabel: 160,
  speciesPref: 80,
  breedPrefText: 140,
  invoice: 120,
  notes: 180,
  createdAt: 100,
};

function getGridTemplate(columns: { key: string }[]): string {
  const colWidths = columns.map((c) => {
    const width = COLUMN_WIDTHS_PX[c.key] || 112;
    return `${width}px`;
  }).join(" ");
  return `32px ${colWidths} auto`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function CellValue({ row, colKey }: { row: PendingTableRow; colKey: string }) {
  const value = (row as any)[colKey];

  switch (colKey) {
    case "contactLabel":
      const isDepositPaid = (row.status || "").toUpperCase() === "DEPOSIT_PAID";
      return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-medium text-primary truncate min-w-0">{value || "-"}</span>
          {isDepositPaid && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-400 bg-blue-400/10 shrink-0">
              DEPOSIT PAID
            </span>
          )}
        </div>
      );

    case "speciesPref":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    case "breedPrefText":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

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

    case "notes":
      if (!value) return <span className="text-sm text-secondary/50">-</span>;
      const truncated = value.length > 60 ? value.substring(0, 60) + "..." : value;
      return <span className="text-sm text-secondary/70 truncate">{truncated}</span>;

    case "createdAt":
      return <span className="text-sm text-secondary">{formatDate(value)}</span>;

    default:
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

function PendingListRow({
  row,
  onClick,
  visibleColumns,
}: {
  row: PendingTableRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
}) {
  const statusKey = (row.status || "INQUIRY").toUpperCase();
  const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.INQUIRY;
  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left grid items-center gap-3 px-4 py-3 border-b border-hairline transition-colors hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar */}
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

export function PendingListView({
  rows,
  loading,
  error,
  onRowClick,
  visibleColumns,
}: PendingListViewProps) {
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

  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <div className="overflow-x-auto">
      {/* Header row */}
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
        <PendingListRow
          key={row.id}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
        />
      ))}
    </div>
  );
}
