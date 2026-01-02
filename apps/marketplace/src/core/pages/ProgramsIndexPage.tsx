// apps/marketplace/src/core/pages/ProgramsIndexPage.tsx
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { usePrograms } from "../hooks/usePrograms";
import { ProgramCard } from "../components/ProgramCard";
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
        setPage(1);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  // Debounce location input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput !== debouncedLocation) {
        setDebouncedLocation(locationInput);
        setPage(1);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [locationInput, debouncedLocation]);

  // Sync URL with debounced values
  React.useEffect(() => {
    const newParams = new URLSearchParams();
    if (debouncedSearch) newParams.set("q", debouncedSearch);
    if (debouncedLocation) newParams.set("loc", debouncedLocation);
    if (page > 1) newParams.set("page", String(page));
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
  const hasFilters =
    debouncedSearch.trim() !== "" || debouncedLocation.trim() !== "";

  // Results count text
  const resultsText = React.useMemo(() => {
    if (!data) return "";
    if (hasFilters) {
      return `${data.total} result${data.total === 1 ? "" : "s"}`;
    }
    return `${data.total} program${data.total === 1 ? "" : "s"}`;
  }, [data, hasFilters]);

  return (
    <div>
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Programs</h1>
        <p className="text-sm opacity-70 mt-2">Browse breeder programs</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-4 py-4 mt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="search-input" className="sr-only">
              Search programs
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Search programs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="location-input" className="sr-only">
              Location
            </label>
            <input
              id="location-input"
              type="text"
              placeholder="Location"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/10 placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </div>
      </div>

      {/* Results meta row */}
      {data && !loading && (
        <div className="text-sm opacity-70 mt-4">{resultsText}</div>
      )}

      {/* Loading state - skeleton cards */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <div className="h-36 bg-black/30 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error != null && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 mt-4 text-center">
          <p className="text-sm opacity-70 mb-4">
            {getUserFacingMessage(error, "Unable to load programs.")}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.items.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 mt-4 text-center">
          <h2 className="text-lg font-semibold mb-2">No programs found</h2>
          <p className="text-sm opacity-70 mb-4">
            Try a different search or clear filters.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results grid */}
      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mt-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={!hasPrev}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm opacity-70">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={!hasNext}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
