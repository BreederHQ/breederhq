// apps/waitlist/src/components/RejectedListView.tsx
// List view for rejected waitlist entries

import * as React from "react";
import { ChevronRight, Ban, User } from "lucide-react";

type ColumnDef = { key: string; label: string };

type RejectedTableRow = {
  id: number;
  contactLabel: string | null;
  speciesPref: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  marketplaceUserId: string | null;
  userName: string | null;
};

type RejectedListViewProps = {
  rows: RejectedTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: RejectedTableRow) => void;
  onBlockUser?: (row: RejectedTableRow) => void;
  visibleColumns: ColumnDef[];
};

const DEFAULT_AVATAR_COLOR = "#a8a29e";
const REJECTED_COLOR = "hsl(0, 0%, 50%)"; // Gray

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
  rejectedReason: 200,
  rejectedAt: 100,
  actions: 100,
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

function CellValue({ row, colKey, onBlockUser }: { row: RejectedTableRow; colKey: string; onBlockUser?: () => void }) {
  const value = (row as any)[colKey];

  switch (colKey) {
    case "contactLabel":
      return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-medium text-primary truncate min-w-0 opacity-70">{value || "-"}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-red-400 bg-red-400/10 shrink-0">
            REJECTED
          </span>
        </div>
      );

    case "speciesPref":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    case "rejectedReason":
      if (!value) return <span className="text-sm text-secondary/50">-</span>;
      const truncated = value.length > 80 ? value.substring(0, 80) + "..." : value;
      return <span className="text-sm text-secondary/70 truncate">{truncated}</span>;

    case "rejectedAt":
      return <span className="text-sm text-secondary">{formatDate(value)}</span>;

    case "actions":
      if (!row.marketplaceUserId || !onBlockUser) return <span className="text-sm text-secondary/50">-</span>;
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBlockUser();
          }}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Ban className="w-3 h-3" />
          Block
        </button>
      );

    default:
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

function RejectedListRow({
  row,
  onClick,
  visibleColumns,
  onBlockUser,
}: {
  row: RejectedTableRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
  onBlockUser?: () => void;
}) {
  const gridTemplate = getGridTemplate(visibleColumns);

  return (
    <div
      className="group w-full text-left grid items-center gap-3 px-4 py-3 border-b border-hairline transition-colors hover:bg-[hsl(var(--brand-orange))]/8"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base ring-2 opacity-50"
        style={{ backgroundColor: DEFAULT_AVATAR_COLOR, ["--tw-ring-color" as any]: REJECTED_COLOR }}
      >
        {row.speciesPref ? speciesEmoji(row.speciesPref) : <User className="w-4 h-4 text-white" />}
      </div>

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div key={col.key} className="overflow-hidden">
          <CellValue row={row} colKey={col.key} onBlockUser={onBlockUser} />
        </div>
      ))}

      {/* Chevron spacer */}
      <div />
    </div>
  );
}

export function RejectedListView({
  rows,
  loading,
  error,
  onRowClick,
  onBlockUser,
  visibleColumns,
}: RejectedListViewProps) {
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
        No rejected entries to display.
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
        <div /> {/* Spacer */}
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <RejectedListRow
          key={row.id}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
          onBlockUser={() => onBlockUser?.(row)}
        />
      ))}
    </div>
  );
}
