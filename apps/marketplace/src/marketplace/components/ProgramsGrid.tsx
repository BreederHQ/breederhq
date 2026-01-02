// apps/marketplace/src/marketplace/components/ProgramsGrid.tsx
import * as React from "react";
import { ProgramTile } from "./ProgramTile";
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
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-white/10 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70 mb-4">Unable to load programs.</p>
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
        <h2 className="text-lg font-semibold text-white mb-2">No programs found</h2>
        <p className="text-white/70 mb-4">Try a different search or clear filters.</p>
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

  // Programs grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {programs.map((program) => (
        <ProgramTile
          key={program.slug}
          slug={program.slug}
          name={program.name}
          location={program.location}
          photoUrl={program.photoUrl}
        />
      ))}
    </div>
  );
}
