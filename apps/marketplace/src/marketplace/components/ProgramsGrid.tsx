// apps/marketplace/src/marketplace/components/ProgramsGrid.tsx
import * as React from "react";
import { ProgramTile } from "./ProgramTile";
import { getUserMessage } from "../../api/errors";
import type { PublicProgramSummaryDTO } from "../../api/types";

interface ProgramsGridProps {
  programs: PublicProgramSummaryDTO[] | null;
  loading: boolean;
  error: Error | null;
  onRetry?: () => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

/**
 * Skeleton tile matching ProgramTile geometry.
 */
function SkeletonTile() {
  return (
    <div className="flex flex-col min-h-[220px] rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse flex-shrink-0" />
      <div className="p-4 flex flex-col flex-grow space-y-2">
        <div className="h-5 bg-white/10 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
        <div className="mt-auto pt-3">
          <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Tip card shown when result count is very low to prevent empty canvas feel.
 */
function SearchTipCard() {
  return (
    <div className="flex flex-col min-h-[220px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5">
      <div className="flex-grow flex flex-col justify-center text-center">
        <p className="text-sm text-white/40 leading-relaxed">
          Use the Search and Location filters above to find specific programs.
        </p>
      </div>
    </div>
  );
}

/**
 * Grid display for programs with loading, error, and empty states.
 */
export function ProgramsGrid({
  programs,
  loading,
  error,
  onRetry,
  onClearFilters,
  hasFilters,
}: ProgramsGridProps) {
  // Loading skeleton - 6 tiles matching final geometry
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
    );
  }

  // Error state with friendly message
  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70 mb-4">{getUserMessage(error)}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (!programs || programs.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          No programs match your search
        </h2>
        <p className="text-white/60 mb-4">
          Clear filters to see all programs.
        </p>
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  // Show tip card when result count is very low (1-2) to fill the grid
  const showTip = programs.length <= 2 && !hasFilters;

  // Programs grid - 1 col mobile, 2 col md, 3 col xl
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {programs.map((program) => (
        <ProgramTile
          key={program.slug}
          slug={program.slug}
          name={program.name}
          location={program.location}
          photoUrl={program.photoUrl}
        />
      ))}
      {showTip && <SearchTipCard />}
    </div>
  );
}
