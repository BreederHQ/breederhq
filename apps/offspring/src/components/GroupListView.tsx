// apps/offspring/src/components/GroupListView.tsx
// List view for offspring groups - cleaner row-based UI

import * as React from "react";
import { ChevronRight, Baby, Home } from "lucide-react";
import { TagChip } from "@bhq/ui";

type ColumnDef = { key: string; label: string };

type GroupTableRow = {
  id: number;
  planCode?: string | null;
  planName?: string | null;
  groupName?: string | null;
  species?: string | null;
  breed?: string | null;
  damName?: string | null;
  sireName?: string | null;
  expectedBirth?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;
  seasonLabel?: string | null;
  status?: string | null;
  countLive?: number | null;
  countReserved?: number | null;
  countSold?: number | null;
  countPlaced?: number | null;
  countWeaned?: number | null;
  updatedAt?: string | null;
  tags?: string[] | null;
  tagObjects?: Array<{ id: number; name: string; color?: string | null }>;
};

type GroupListViewProps = {
  rows: GroupTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: GroupTableRow) => void;
  visibleColumns: ColumnDef[];
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  PLANNING: "hsl(210, 70%, 50%)",
  COMMITTED: "hsl(25, 95%, 53%)",
  BRED: "hsl(330, 70%, 50%)",
  BIRTHED: "hsl(45, 90%, 50%)",
  WEANED: "hsl(80, 60%, 45%)",
  PLACEMENT: "hsl(142, 70%, 45%)",
  COMPLETE: "hsl(160, 50%, 40%)",
  CANCELED: "hsl(0, 0%, 50%)",
};

// Status labels
const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  COMMITTED: "Committed",
  BRED: "Bred",
  BIRTHED: "Birthed",
  WEANED: "Weaned",
  PLACEMENT: "Placement",
  COMPLETE: "Complete",
  CANCELED: "Canceled",
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
  groupName: 180,
  species: 80,
  breed: 140,
  damName: 128,
  sireName: 128,
  seasonLabel: 96,
  expectedBirth: 96,
  expectedPlacementStart: 96,
  expectedPlacementCompleted: 96,
  status: 100,
  planCode: 96,
  tags: 140,
  countLive: 64,
  countReserved: 64,
  countSold: 64,
  countPlaced: 64,
  countWeaned: 64,
  updatedAt: 96,
};

// Get grid template for visible columns
function getGridTemplate(columns: { key: string }[]): string {
  // Avatar (32px) + columns + chevron (auto to absorb extra space)
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
  return date.toLocaleDateString();
}

function CellValue({ row, colKey }: { row: GroupTableRow; colKey: string }) {
  const value = (row as any)[colKey];

  switch (colKey) {
    case "groupName":
      const displayName = row.groupName || row.planCode || `Group #${row.id}`;
      return (
        <span className="font-medium text-primary truncate">{displayName}</span>
      );

    case "species":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    case "breed":
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;

    case "damName":
      return value ? (
        <div className="flex items-center gap-1 text-sm text-secondary truncate">
          <span className="text-pink-400">♀</span>
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    case "sireName":
      return value ? (
        <div className="flex items-center gap-1 text-sm text-secondary truncate">
          <span className="text-blue-400">♂</span>
          <span className="truncate">{value}</span>
        </div>
      ) : (
        <span className="text-sm text-secondary/50">TBD</span>
      );

    case "status":
      const statusKey = (value || "PLANNING").toUpperCase();
      const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.PLANNING;
      const statusLabel = STATUS_LABELS[statusKey] || value || "Planning";
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${["COMMITTED", "BRED", "BIRTHED"].includes(statusKey) ? "animate-pulse" : ""}`}
            style={{ backgroundColor: statusColor }}
          />
          {statusLabel}
        </span>
      );

    case "expectedBirth":
    case "expectedPlacementStart":
    case "expectedPlacementCompleted":
    case "updatedAt":
      return <span className="text-sm text-secondary">{formatDate(value)}</span>;

    case "countLive":
    case "countReserved":
    case "countSold":
    case "countPlaced":
    case "countWeaned":
      const count = value ?? 0;
      if (count === 0) return <span className="text-sm text-secondary/50">-</span>;
      // Add color coding for certain counts
      let countClass = "text-secondary";
      if (colKey === "countReserved" && count > 0) countClass = "text-amber-400";
      if (colKey === "countSold" && count > 0) countClass = "text-green-400";
      if (colKey === "countPlaced" && count > 0) countClass = "text-blue-400";
      return <span className={`text-sm ${countClass}`}>{count}</span>;

    case "seasonLabel":
      return <span className="text-sm text-secondary">{value || "-"}</span>;

    case "planCode":
      return <span className="text-sm text-secondary font-mono">{value || "-"}</span>;

    case "tags":
      const tags = row.tagObjects || row.tags?.map((t) => ({ id: t, name: t, color: undefined })) || [];
      return tags.length > 0 ? (
        <div className="flex items-center gap-1.5 overflow-hidden">
          {tags.slice(0, 3).map((tag) => (
            <TagChip
              key={typeof tag === "string" ? tag : tag.id}
              name={typeof tag === "string" ? tag : tag.name}
              color={typeof tag === "string" ? undefined : tag.color}
            />
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-secondary flex-shrink-0">+{tags.length - 3}</span>
          )}
        </div>
      ) : (
        <span className="text-sm text-secondary/50">-</span>
      );

    default:
      if (Array.isArray(value)) {
        return <span className="text-sm text-secondary truncate">{value.join(", ") || "-"}</span>;
      }
      return <span className="text-sm text-secondary truncate">{value || "-"}</span>;
  }
}

function GroupListRow({
  row,
  onClick,
  visibleColumns,
}: {
  row: GroupTableRow;
  onClick?: () => void;
  visibleColumns: ColumnDef[];
}) {
  const statusKey = (row.status || "PLANNING").toUpperCase();
  const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.PLANNING;
  const gridTemplate = getGridTemplate(visibleColumns);

  // Use first tag color for background if available, otherwise use default
  const firstTagColor = row.tagObjects?.[0]?.color;
  const bgColor = firstTagColor || DEFAULT_AVATAR_COLOR;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left grid items-center gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--brand-orange))]/8 cursor-pointer"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar - species emoji with status ring, tag color for background */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base ring-2"
        style={{ backgroundColor: bgColor, ["--tw-ring-color" as any]: statusColor }}
      >
        {speciesEmoji(row.species)}
      </div>

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div
          key={col.key}
          className="overflow-hidden"
        >
          <CellValue row={row} colKey={col.key} />
        </div>
      ))}

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function GroupListView({
  rows,
  loading,
  error,
  onRowClick,
  visibleColumns,
}: GroupListViewProps) {
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
        No groups to display yet.
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
        <GroupListRow
          key={row.id}
          row={row}
          onClick={() => onRowClick?.(row)}
          visibleColumns={visibleColumns}
        />
      ))}
    </div>
  );
}
