// apps/marketplace/src/marketplace/components/ProgramsGrid.tsx
// Buyer-facing grid with breeder language
import { ProgramTile } from "./ProgramTile";
import { getUserMessage } from "../../api/errors";
import type { PublicProgramSummaryDTO } from "../../api/types";

interface ProgramsGridProps {
  programs: PublicProgramSummaryDTO[] | null;
  boostedItem?: PublicProgramSummaryDTO | null;
  loading: boolean;
  error: Error | null;
  onRetry?: () => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

/**
 * Skeleton tile matching breeder tile geometry.
 */
function SkeletonTile() {
  return (
    <div className="flex flex-col min-h-[200px] rounded-portal border border-border-subtle bg-portal-card overflow-hidden">
      <div className="h-[100px] bg-gradient-to-br from-portal-card-hover to-border-default animate-pulse flex-shrink-0" />
      <div className="p-4 flex flex-col flex-grow space-y-2">
        <div className="h-4 bg-border-default rounded animate-pulse w-3/4" />
        <div className="h-3.5 bg-border-default rounded animate-pulse w-1/2" />
        <div className="mt-auto pt-3">
          <div className="h-3.5 bg-border-default rounded animate-pulse w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Guidance card for sparse grids - buyer-facing tip.
 */
function GuidanceCard() {
  return (
    <div className="flex flex-col min-h-[200px] rounded-portal border border-dashed border-border-subtle bg-portal-card p-6">
      <div className="flex-grow flex flex-col justify-center text-center">
        <p className="text-[13px] text-text-tertiary leading-relaxed">
          Tip: search by breed name or your city to find nearby breeders.
        </p>
      </div>
    </div>
  );
}

/**
 * Grid display with buyer-facing empty states.
 * 2-col minimum at desktop to prevent floating single cards.
 */
export function ProgramsGrid({
  programs,
  boostedItem,
  loading,
  error,
  onRetry,
  onClearFilters,
  hasFilters,
}: ProgramsGridProps) {
  // Loading skeleton - 6 tiles, 2-col min at desktop
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <p className="text-text-secondary text-sm mb-4">{getUserMessage(error)}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Empty state - buyer-facing language
  if (!programs || programs.length === 0) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <p className="text-[15px] font-semibold text-white mb-1">
          No breeders match your search
        </p>
        <p className="text-[13px] text-text-tertiary mb-4">
          Try adjusting your filters or search terms.
        </p>
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  // Show guidance card when result count is 1 to fill the grid
  const showGuidance = programs.length === 1 && !hasFilters && !boostedItem;

  // Grid - 1 col mobile, 2 col sm (minimum at desktop), 3 col lg
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Boosted item first */}
      {boostedItem && (
        <ProgramTile
          key={boostedItem.slug}
          slug={boostedItem.slug}
          name={boostedItem.name}
          location={boostedItem.location}
          photoUrl={boostedItem.photoUrl}
          isBoosted
          sponsorDisclosureText={boostedItem.sponsorDisclosureText}
        />
      )}
      {programs.map((program) => (
        <ProgramTile
          key={program.slug}
          slug={program.slug}
          name={program.name}
          location={program.location}
          photoUrl={program.photoUrl}
        />
      ))}
      {showGuidance && <GuidanceCard />}
    </div>
  );
}
