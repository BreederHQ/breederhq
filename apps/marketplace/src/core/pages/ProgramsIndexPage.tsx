// apps/marketplace/src/core/pages/ProgramsIndexPage.tsx
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { usePrograms } from "../hooks/usePrograms";
import { ProgramCard } from "../components/ProgramCard";
import { SectionSkeleton } from "../../shared/ui/SectionSkeleton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { InlineErrorState } from "../../shared/ui/InlineErrorState";
import { getUserFacingMessage } from "../../shared/errors/userMessages";

const LIMIT = 24;
const DEBOUNCE_MS = 300;

/**
 * Programs Index page - browse breeder programs.
 * Supports search, location filter, and pagination via URL params.
 */
export function ProgramsIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL
  const urlQ = searchParams.get("q") || "";
  const urlLoc = searchParams.get("loc") || "";
  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);

  // Local input state (for immediate UI feedback)
  const [searchInput, setSearchInput] = React.useState(urlQ);
  const [locationInput, setLocationInput] = React.useState(urlLoc);

  // Debounced values for API calls
  const [debouncedSearch, setDebouncedSearch] = React.useState(urlQ);
  const [debouncedLocation, setDebouncedLocation] = React.useState(urlLoc);

  // Page state
  const [page, setPage] = React.useState(urlPage);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== debouncedSearch) {
        setDebouncedSearch(searchInput);
        setPage(1); // Reset page when search changes
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  // Debounce location input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput !== debouncedLocation) {
        setDebouncedLocation(locationInput);
        setPage(1); // Reset page when location changes
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [locationInput, debouncedLocation]);

  // Sync URL with debounced values (replaceState for typing, to avoid back button spam)
  React.useEffect(() => {
    const newParams = new URLSearchParams();
    if (debouncedSearch) newParams.set("q", debouncedSearch);
    if (debouncedLocation) newParams.set("loc", debouncedLocation);
    if (page > 1) newParams.set("page", String(page));

    // Use replace to avoid polluting history during typing
    setSearchParams(newParams, { replace: true });
  }, [debouncedSearch, debouncedLocation, page, setSearchParams]);

  // Compute offset from page
  const offset = (page - 1) * LIMIT;

  // Fetch programs
  const { data, loading, error, refetch } = usePrograms({
    search: debouncedSearch,
    location: debouncedLocation,
    limit: LIMIT,
    offset,
  });

  // Pagination helpers
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const goToPrev = () => {
    if (hasPrev) setPage((p) => p - 1);
  };

  const goToNext = () => {
    if (hasNext) setPage((p) => p + 1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setDebouncedSearch("");
    setDebouncedLocation("");
    setPage(1);
  };

  // Determine if filters are active
  const hasFilters = debouncedSearch.trim() !== "" || debouncedLocation.trim() !== "";

  // Results count text
  const resultsText = React.useMemo(() => {
    if (!data) return "";
    if (hasFilters) {
      return `${data.total} result${data.total === 1 ? "" : "s"}`;
    }
    return `${data.total} program${data.total === 1 ? "" : "s"}`;
  }, [data, hasFilters]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">Programs</h1>
        <p className="text-secondary mt-1">Browse breeder programs</p>
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search programs"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-hairline bg-surface-1 text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
        />

        {/* Location input */}
        <input
          type="text"
          placeholder="Location"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          className="flex-1 sm:max-w-[200px] px-3 py-2 rounded-md border border-hairline bg-surface-1 text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
        />

        {/* Results count (desktop) */}
        {data && !loading && (
          <span className="hidden sm:block text-sm text-secondary whitespace-nowrap">
            {resultsText}
          </span>
        )}
      </div>

      {/* Results count (mobile) */}
      {data && !loading && (
        <div className="sm:hidden text-sm text-secondary">{resultsText}</div>
      )}

      {/* Main content */}
      {loading && <SectionSkeleton rows={6} />}

      {!loading && error != null && (
        <InlineErrorState
          message={getUserFacingMessage(error, "Unable to load programs.")}
          onRetry={refetch}
        />
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          title="No programs found"
          body="Try a different search or clear filters."
          actionLabel={hasFilters ? "Clear filters" : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          {/* Programs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((program) => (
              <ProgramCard
                key={program.slug}
                slug={program.slug}
                name={program.name}
                location={program.location}
                photoUrl={program.photoUrl}
              />
            ))}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={goToPrev}
                disabled={!hasPrev}
                className="px-4 py-2 rounded-md border border-hairline bg-surface-1 text-primary text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={goToNext}
                disabled={!hasNext}
                className="px-4 py-2 rounded-md border border-hairline bg-surface-1 text-primary text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
