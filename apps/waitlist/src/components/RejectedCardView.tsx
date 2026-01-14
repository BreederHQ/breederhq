// apps/waitlist/src/components/RejectedCardView.tsx
// Card-based view for rejected waitlist entries

import * as React from "react";
import { Ban, Calendar, User } from "lucide-react";

type RejectedTableRow = {
  id: number;
  contactLabel: string | null;
  speciesPref: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  marketplaceUserId: string | null;
  userName: string | null;
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

type RejectedCardViewProps = {
  rows: RejectedTableRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: RejectedTableRow) => void;
  onBlockUser?: (row: RejectedTableRow) => void;
};

function RejectedCard({ row, onClick, onBlockUser }: { row: RejectedTableRow; onClick?: () => void; onBlockUser?: () => void }) {
  const displayName = row.contactLabel || row.userName || `Entry #${row.id}`;
  const rejectedDate = formatDate(row.rejectedAt);

  return (
    <div
      className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)]"
    >
      {/* Left accent stripe - gray for rejected */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gray-500"
      />

      {/* Top row: Contact info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl opacity-50">
          {row.speciesPref ? speciesEmoji(row.speciesPref) : <User className="w-6 h-6 text-secondary" />}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate opacity-70">
              {displayName}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 font-medium">
              Rejected
            </span>
          </div>
          {row.speciesPref && (
            <div className="text-xs text-secondary mt-0.5">
              {row.speciesPref}
            </div>
          )}
        </div>
      </div>

      {/* Rejected date */}
      {rejectedDate && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
          <Calendar className="w-3 h-3" />
          <span>Rejected {rejectedDate}</span>
        </div>
      )}

      {/* Reason */}
      {row.rejectedReason && (
        <div className="mt-2 text-xs text-secondary/70">
          <span className="font-medium">Reason:</span> {row.rejectedReason.length > 100 ? row.rejectedReason.substring(0, 100) + "..." : row.rejectedReason}
        </div>
      )}

      {/* Block user button */}
      {row.marketplaceUserId && onBlockUser && (
        <div className="mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBlockUser();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Ban className="w-3 h-3" />
            Block User
          </button>
        </div>
      )}
    </div>
  );
}

export function RejectedCardView({ rows, loading, error, onRowClick, onBlockUser }: RejectedCardViewProps) {
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

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <RejectedCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
            onBlockUser={() => onBlockUser?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
