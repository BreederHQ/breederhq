// apps/waitlist/src/components/BlockedCardView.tsx
// Card-based view for blocked users

import * as React from "react";
import { Ban, Calendar, Shield, User } from "lucide-react";

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

// Format date for display
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

type BlockedCardViewProps = {
  rows: BlockedUserInfo[];
  loading: boolean;
  error: string | null;
  onUnblock?: (row: BlockedUserInfo) => void;
  unblockingId?: string | null;
};

function BlockedCard({
  row,
  onUnblock,
  isUnblocking,
}: {
  row: BlockedUserInfo;
  onUnblock?: () => void;
  isUnblocking?: boolean;
}) {
  const displayName = row.user.name || `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || "Unknown";
  const blockedDate = formatDate(row.createdAt);
  const levelColor = LEVEL_COLORS[row.level] || LEVEL_COLORS.MEDIUM;

  return (
    <div className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)]">
      {/* Left accent stripe - colored by block level */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: levelColor }}
      />

      {/* Top row: User info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
          <User className="w-6 h-6 text-secondary" />
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {displayName}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeClass(row.level)}`}>
              {row.level}
            </span>
          </div>
          <div className="text-xs text-secondary mt-0.5 truncate">
            {row.user.email}
          </div>
        </div>
      </div>

      {/* Blocked date */}
      {blockedDate && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
          <Calendar className="w-3 h-3" />
          <span>Blocked {blockedDate}</span>
        </div>
      )}

      {/* Reason */}
      {row.reason && (
        <div className="mt-2 text-xs text-secondary/70">
          <span className="font-medium">Reason:</span> {row.reason.length > 100 ? row.reason.substring(0, 100) + "..." : row.reason}
        </div>
      )}

      {/* Unblock button */}
      {onUnblock && (
        <div className="mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnblock();
            }}
            disabled={isUnblocking}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-3 h-3" />
            {isUnblocking ? "Unblocking..." : "Unblock"}
          </button>
        </div>
      )}
    </div>
  );
}

export function BlockedCardView({ rows, loading, error, onUnblock, unblockingId }: BlockedCardViewProps) {
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

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <BlockedCard
            key={row.id}
            row={row}
            onUnblock={() => onUnblock?.(row)}
            isUnblocking={unblockingId === row.userId}
          />
        ))}
      </div>
    </div>
  );
}
