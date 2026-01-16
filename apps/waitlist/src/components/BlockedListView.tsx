// apps/waitlist/src/components/BlockedListView.tsx
// List view for blocked users

import * as React from "react";
import { Shield, User } from "lucide-react";

type ColumnDef = { key: string; label: string };

type BlockedUserInfo = {
  id: string;
  userId: string;
  level: string;
  reason?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

type BlockedListViewProps = {
  rows: BlockedUserInfo[];
  loading: boolean;
  error: string | null;
  onUnblock?: (row: BlockedUserInfo) => void;
  unblockingId?: string | null;
  visibleColumns: ColumnDef[];
};

// Block level colors
const LEVEL_COLORS: Record<string, string> = {
  LIGHT: "hsl(45, 90%, 50%)",     // Yellow
  MEDIUM: "hsl(25, 95%, 53%)",    // Orange
  HEAVY: "hsl(0, 70%, 50%)",      // Red
};

function getLevelBadgeClass(level: string) {
  switch (level) {
    case "LIGHT":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "MEDIUM":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "HEAVY":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400";
  }
}

const DEFAULT_AVATAR_COLOR = "#a8a29e";

// Column widths
const COLUMN_WIDTHS_PX: Record<string, number> = {
  name: 160,
  email: 200,
  level: 100,
  reason: 200,
  blockedAt: 100,
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

function CellValue({
  row,
  colKey,
  onUnblock,
  isUnblocking,
}: {
  row: BlockedUserInfo;
  colKey: string;
  onUnblock?: () => void;
  isUnblocking?: boolean;
}) {
  switch (colKey) {
    case "name": {
      const displayName = row.user.name || `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || "Unknown";
      return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="font-medium text-primary truncate min-w-0">{displayName}</span>
        </div>
      );
    }

    case "email":
      return <span className="text-sm text-secondary truncate">{row.user.email || "-"}</span>;

    case "level":
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeClass(row.level)}`}>
          {row.level}
        </span>
      );

    case "reason":
      if (!row.reason) return <span className="text-sm text-secondary/50">-</span>;
      const truncated = row.reason.length > 80 ? row.reason.substring(0, 80) + "..." : row.reason;
      return <span className="text-sm text-secondary/70 truncate">{truncated}</span>;

    case "blockedAt":
      return <span className="text-sm text-secondary">{formatDate(row.createdAt)}</span>;

    case "actions":
      if (!onUnblock) return <span className="text-sm text-secondary/50">-</span>;
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnblock();
          }}
          disabled={isUnblocking}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield className="w-3 h-3" />
          {isUnblocking ? "..." : "Unblock"}
        </button>
      );

    default:
      return <span className="text-sm text-secondary truncate">-</span>;
  }
}

function BlockedListRow({
  row,
  visibleColumns,
  onUnblock,
  isUnblocking,
}: {
  row: BlockedUserInfo;
  visibleColumns: ColumnDef[];
  onUnblock?: () => void;
  isUnblocking?: boolean;
}) {
  const gridTemplate = getGridTemplate(visibleColumns);
  const levelColor = LEVEL_COLORS[row.level] || LEVEL_COLORS.MEDIUM;

  return (
    <div
      className="group w-full text-left grid items-center gap-3 px-4 py-3 border-b border-hairline transition-colors hover:bg-[hsl(var(--brand-orange))]/8"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base ring-2"
        style={{ backgroundColor: DEFAULT_AVATAR_COLOR, ["--tw-ring-color" as any]: levelColor }}
      >
        <User className="w-4 h-4 text-white" />
      </div>

      {/* Dynamic columns */}
      {visibleColumns.map((col) => (
        <div key={col.key} className="overflow-hidden">
          <CellValue
            row={row}
            colKey={col.key}
            onUnblock={onUnblock}
            isUnblocking={isUnblocking}
          />
        </div>
      ))}

      {/* Spacer */}
      <div />
    </div>
  );
}

export function BlockedListView({
  rows,
  loading,
  error,
  onUnblock,
  unblockingId,
  visibleColumns,
}: BlockedListViewProps) {
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
        No blocked users to display.
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
        <BlockedListRow
          key={row.id}
          row={row}
          visibleColumns={visibleColumns}
          onUnblock={() => onUnblock?.(row)}
          isUnblocking={unblockingId === row.userId}
        />
      ))}
    </div>
  );
}
