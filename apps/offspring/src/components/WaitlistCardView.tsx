// apps/offspring/src/components/WaitlistCardView.tsx
// Card-based view for waitlist entries

import * as React from "react";
import { Calendar, User, Building2, Heart } from "lucide-react";

type WaitlistTableRow = {
  id: number;
  contactLabel?: string | null;
  orgLabel?: string | null;
  speciesPref?: string | null;
  breedPrefText?: string | null;
  damPrefName?: string | null;
  sirePrefName?: string | null;
  depositPaidAt?: string | null;
  status?: string | null;
  priority?: number | null;
  skipCount?: number | null;
  lastActivityAt?: string | null;
  notes?: string | null;
};

// Status colors for left accent stripe
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "hsl(142, 70%, 45%)",         // Green
  PENDING: "hsl(45, 90%, 50%)",         // Gold
  WAITING: "hsl(210, 70%, 50%)",        // Blue
  MATCHED: "hsl(270, 60%, 55%)",        // Purple
  PLACED: "hsl(160, 50%, 40%)",         // Teal
  CANCELED: "hsl(0, 0%, 50%)",          // Gray
  EXPIRED: "hsl(0, 60%, 50%)",          // Red
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

type WaitlistCardViewProps = {
  rows: WaitlistTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: WaitlistTableRow) => void;
};

function WaitlistCard({ row, onClick }: { row: WaitlistTableRow; onClick?: () => void }) {
  const statusKey = (row.status || "ACTIVE").toUpperCase();
  const accentColor = STATUS_COLORS[statusKey] || STATUS_COLORS.ACTIVE;
  const statusLabel = row.status || "Active";

  const depositDate = formatDate(row.depositPaidAt);
  const displayName = row.contactLabel || row.orgLabel || `Entry #${row.id}`;
  const isOrg = !row.contactLabel && row.orgLabel;

  // Priority indicator
  const priority = row.priority ?? 999;
  const isHighPriority = priority <= 3;

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

      {/* Top row: Icon + Name */}
      <div className="flex items-start gap-3">
        {/* Contact/Org Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
          {isOrg ? (
            <Building2 className="w-6 h-6 text-secondary" />
          ) : (
            <User className="w-6 h-6 text-secondary" />
          )}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {displayName}
            </span>
            {isHighPriority && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 bg-amber-400/10">
                #{priority}
              </span>
            )}
          </div>
          {row.contactLabel && row.orgLabel && (
            <div className="text-xs text-secondary truncate">
              {row.orgLabel}
            </div>
          )}
        </div>
      </div>

      {/* Preferences row */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="text-2xl">{speciesEmoji(row.speciesPref)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-secondary truncate">
            {row.speciesPref || "Any species"}
            {row.breedPrefText && ` • ${row.breedPrefText}`}
          </div>
        </div>
      </div>

      {/* Parent preferences */}
      {(row.damPrefName || row.sirePrefName) && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          {row.damPrefName && (
            <div className="flex items-center gap-1 text-secondary">
              <Heart className="w-3 h-3 text-pink-400" />
              <span className="truncate max-w-[80px]">{row.damPrefName}</span>
            </div>
          )}
          {row.sirePrefName && (
            <div className="flex items-center gap-1 text-secondary">
              <Heart className="w-3 h-3 text-blue-400" />
              <span className="truncate max-w-[80px]">{row.sirePrefName}</span>
            </div>
          )}
        </div>
      )}

      {/* Deposit + Activity */}
      <div className="mt-3 flex items-center gap-3 text-xs text-secondary">
        {depositDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-green-400" />
            <span>Deposit {depositDate}</span>
          </div>
        )}
        {(row.skipCount ?? 0) > 0 && (
          <span className="text-amber-400">{row.skipCount} skip{row.skipCount !== 1 ? "s" : ""}</span>
        )}
      </div>

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
            className={`w-2 h-2 rounded-full ${statusKey === "ACTIVE" || statusKey === "PENDING" ? "animate-pulse" : ""}`}
            style={{ backgroundColor: accentColor }}
          />
          {statusLabel}
        </span>

        {priority && priority < 999 && !isHighPriority && (
          <span className="text-xs text-secondary">
            Priority #{priority}
          </span>
        )}
      </div>
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
        No waitlist entries to display yet.
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
