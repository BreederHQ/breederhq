// apps/offspring/src/components/GroupCardView.tsx
// Card-based view for offspring groups (litters)

import * as React from "react";
import { Baby, Calendar, Home, Users } from "lucide-react";

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
  seasonLabel?: string | null;
  status?: string | null;
  countLive?: number | null;
  countReserved?: number | null;
  countSold?: number | null;
  countPlaced?: number | null;
};

// Status colors for left accent stripe
const STATUS_COLORS: Record<string, string> = {
  PLANNING: "hsl(210, 70%, 50%)",           // Blue
  COMMITTED: "hsl(25, 95%, 53%)",           // Orange
  BRED: "hsl(330, 70%, 50%)",               // Pink
  BIRTHED: "hsl(45, 90%, 50%)",             // Gold
  WEANED: "hsl(80, 60%, 45%)",              // Yellow-green
  PLACEMENT: "hsl(142, 70%, 45%)",          // Green
  COMPLETE: "hsl(160, 50%, 40%)",           // Teal
  CANCELED: "hsl(0, 0%, 50%)",              // Gray
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

type GroupCardViewProps = {
  rows: GroupTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: GroupTableRow) => void;
};

function GroupCard({ row, onClick }: { row: GroupTableRow; onClick?: () => void }) {
  const statusKey = (row.status || "PLANNING").toUpperCase();
  const accentColor = STATUS_COLORS[statusKey] || STATUS_COLORS.PLANNING;
  const statusLabel = STATUS_LABELS[statusKey] || row.status || "Planning";

  const birthDate = formatDate(row.expectedBirth);
  const placementDate = formatDate(row.expectedPlacementStart);
  const displayName = row.groupName || row.planCode || `Group #${row.id}`;

  // Count stats
  const live = row.countLive ?? 0;
  const reserved = row.countReserved ?? 0;
  const sold = row.countSold ?? 0;
  const placed = row.countPlaced ?? 0;

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

      {/* Top row: Species Emoji + Group Name */}
      <div className="flex items-start gap-3">
        {/* Species Emoji */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl">
          {speciesEmoji(row.species)}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {displayName}
            </span>
            {row.seasonLabel && (
              <span className="text-xs text-secondary">({row.seasonLabel})</span>
            )}
          </div>
          <div className="text-xs text-secondary mt-0.5">
            {[row.species, row.breed].filter(Boolean).join(" • ")}
          </div>
        </div>
      </div>

      {/* Parents row */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-pink-400">♀</span>
          <span className="text-secondary truncate max-w-[100px]">{row.damName || "—"}</span>
        </div>
        <span className="text-secondary">×</span>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-400">♂</span>
          <span className="text-secondary truncate max-w-[100px]">{row.sireName || "TBD"}</span>
        </div>
      </div>

      {/* Timeline milestones */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        {birthDate && (
          <div className="flex items-center gap-1 text-secondary">
            <Baby className="w-3 h-3 text-amber-400" />
            <span>{birthDate}</span>
          </div>
        )}
        {placementDate && (
          <div className="flex items-center gap-1 text-secondary">
            <Home className="w-3 h-3 text-green-400" />
            <span>{placementDate}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      {(live > 0 || reserved > 0 || sold > 0 || placed > 0) && (
        <div className="mt-3 flex items-center gap-3 text-xs text-secondary">
          {live > 0 && (
            <span>{live} live</span>
          )}
          {reserved > 0 && (
            <span className="text-amber-400">{reserved} reserved</span>
          )}
          {sold > 0 && (
            <span className="text-green-400">{sold} sold</span>
          )}
          {placed > 0 && (
            <span className="text-blue-400">{placed} placed</span>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
          }}
        >
          <span
            className={`w-2 h-2 rounded-full ${["COMMITTED", "BRED", "BIRTHED"].includes(statusKey) ? "animate-pulse" : ""}`}
            style={{ backgroundColor: accentColor }}
          />
          {statusLabel}
        </span>
      </div>
    </button>
  );
}

export function GroupCardView({ rows, loading, error, onRowClick }: GroupCardViewProps) {
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

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <GroupCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
