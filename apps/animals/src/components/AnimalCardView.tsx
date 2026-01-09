// apps/animals/src/components/AnimalCardView.tsx
// Card-based view for animals (similar to ContactCardView)

import * as React from "react";
import { Trophy } from "lucide-react";

type AnimalRow = {
  id: number;
  name: string;
  nickname?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  status?: string | null;
  ownerName?: string | null;
  photoUrl?: string | null;
  tags: string[];
  titlePrefix?: string | null;
  titleSuffix?: string | null;
};

// Status colors for left accent stripe
const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(142, 70%, 45%)",      // Green
  Breeding: "hsl(270, 60%, 55%)",    // Purple
  Unavailable: "hsl(25, 95%, 53%)",  // Orange
  Retired: "hsl(210, 70%, 50%)",     // Blue
  Deceased: "hsl(0, 0%, 50%)",       // Gray
  Prospect: "hsl(195, 70%, 50%)",    // Sky blue
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

// Sex indicator component
function SexIndicator({ sex }: { sex?: string | null }) {
  const sexLower = (sex || "").toLowerCase();
  const isFemale = sexLower.startsWith("f");
  const isMale = sexLower.startsWith("m");

  if (isFemale) {
    return <span className="text-pink-400 text-lg">♀</span>;
  }
  if (isMale) {
    return <span className="text-blue-400 text-lg">♂</span>;
  }
  return null;
}

type AnimalCardViewProps = {
  rows: AnimalRow[];
  loading: boolean;
  error: string | null;
  onRowClick?: (row: AnimalRow) => void;
};

function AnimalCard({ row, onClick }: { row: AnimalRow; onClick?: () => void }) {
  const accentColor = STATUS_COLORS[row.status || "Active"] || STATUS_COLORS.Active;
  const hasTitles = row.titlePrefix || row.titleSuffix;

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

      {/* Top row: Photo/Emoji + Name + Sex */}
      <div className="flex items-start gap-3">
        {/* Photo or Species Emoji */}
        {row.photoUrl ? (
          <img
            src={row.photoUrl}
            alt={row.name}
            className="flex-shrink-0 w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-2xl">
            {speciesEmoji(row.species)}
          </div>
        )}

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary truncate">
              {row.name}
            </span>
            <SexIndicator sex={row.sex} />
            {hasTitles && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10">
                <Trophy className="w-3 h-3" />
              </span>
            )}
          </div>
          {row.nickname && (
            <div className="text-xs text-secondary truncate">
              "{row.nickname}"
            </div>
          )}
          <div className="text-xs text-secondary mt-0.5">
            {[row.species, row.breed].filter(Boolean).join(" • ")}
          </div>
        </div>
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
            className={`w-2 h-2 rounded-full ${row.status === "Breeding" ? "animate-pulse" : ""}`}
            style={{ backgroundColor: accentColor }}
          />
          {row.status || "Active"}
        </span>

        {row.ownerName && (
          <span className="text-xs text-secondary truncate max-w-[120px]">
            {row.ownerName}
          </span>
        )}
      </div>

      {/* Tags */}
      {row.tags && row.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {row.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[hsl(var(--muted))] text-secondary"
            >
              {tag}
            </span>
          ))}
          {row.tags.length > 3 && (
            <span className="text-xs text-secondary">+{row.tags.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

export function AnimalCardView({ rows, loading, error, onRowClick }: AnimalCardViewProps) {
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
        No animals to display yet.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <AnimalCard
            key={row.id}
            row={row}
            onClick={() => onRowClick?.(row)}
          />
        ))}
      </div>
    </div>
  );
}
