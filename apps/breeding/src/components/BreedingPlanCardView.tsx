// apps/breeding/src/components/BreedingPlanCardView.tsx
// Card-based view for breeding plans (similar to AnimalCardView)

import * as React from "react";
import { Calendar, Heart, Baby, Home } from "lucide-react";

type PlanRow = {
  id: number | string;
  name: string;
  status: string;
  species: string;
  damName: string;
  sireName?: string | null;
  breedText?: string | null;
  expectedBreedDate?: string | null;
  expectedBirthDate?: string | null;
  expectedPlacementStartDate?: string | null;
  depositsCommitted?: number | null;
  depositsPaid?: number | null;
  archived?: boolean;
};

// Status colors for left accent stripe
const STATUS_COLORS: Record<string, string> = {
  "Planned": "hsl(210, 70%, 50%)",      // Blue
  "Cycling": "hsl(280, 60%, 55%)",      // Purple
  "Bred": "hsl(330, 70%, 50%)",         // Pink
  "Confirmed": "hsl(25, 95%, 53%)",     // Orange
  "Whelping": "hsl(0, 70%, 50%)",       // Red
  "Nursing": "hsl(45, 90%, 50%)",       // Gold
  "Weaning": "hsl(80, 60%, 45%)",       // Yellow-green
  "Placement": "hsl(142, 70%, 45%)",    // Green
  "Completed": "hsl(160, 50%, 40%)",    // Teal
  "Cancelled": "hsl(0, 0%, 50%)",       // Gray
};

// Species emoji helper
function speciesEmoji(species?: string | null): string {
  const s = (species || "").toLowerCase();
  if (s === "dog") return "🐶";
  if (s === "cat") return "🐱";
  if (s === "horse") return "🐴";
  if (s === "goat") return "🐐";
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

type BreedingPlanCardViewProps = {
  rows: PlanRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: PlanRow) => void;
};

function PlanCard({ row, onClick }: { row: PlanRow; onClick?: () => void }) {
  const accentColor = STATUS_COLORS[row.status] || STATUS_COLORS.Planned;
  const breedDate = formatDate(row.expectedBreedDate);
  const birthDate = formatDate(row.expectedBirthDate);
  const placementDate = formatDate(row.expectedPlacementStartDate);

  // Calculate deposit progress
  const depositsCommitted = row.depositsCommitted ?? 0;
  const depositsPaid = row.depositsPaid ?? 0;
  const hasDeposits = depositsCommitted > 0;

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

      {/* Top row: Species Emoji + Plan Name */}
      <div className="flex items-start gap-3">
        {/* Species Emoji */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl">
          {speciesEmoji(row.species)}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {row.name}
            </span>
            {row.archived && (
              <span className="text-xs text-amber-400">(Archived)</span>
            )}
          </div>
          <div className="text-xs text-secondary mt-0.5">
            {[row.species, row.breedText].filter(Boolean).join(" - ")}
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
        {breedDate && (
          <div className="flex items-center gap-1 text-secondary">
            <Heart className="w-3 h-3 text-pink-400" />
            <span>{breedDate}</span>
          </div>
        )}
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

      {/* Status badge + deposits */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
          }}
        >
          <span
            className={`w-2 h-2 rounded-full ${["Cycling", "Bred", "Whelping", "Nursing"].includes(row.status) ? "animate-pulse" : ""}`}
            style={{ backgroundColor: accentColor }}
          />
          {row.status}
        </span>

        {hasDeposits && (
          <span className="text-xs text-secondary">
            {depositsPaid}/{depositsCommitted} deposits
          </span>
        )}
      </div>
    </button>
  );
}

export function BreedingPlanCardView({ rows, loading, error, onRowClick }: BreedingPlanCardViewProps) {
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
        No breeding plans to display yet.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <PlanCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
