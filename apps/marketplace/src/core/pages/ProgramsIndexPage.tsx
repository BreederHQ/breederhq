// apps/marketplace/src/core/pages/ProgramsIndexPage.tsx
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { usePrograms } from "../hooks/usePrograms";
import { ProgramCard } from "../components/ProgramCard";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
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
      <PageHeader
        title="Programs"
        subtitle="Browse breeder programs"
      />

      {/* Filters card */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search programs"
              label="Search programs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <Input
              type="text"
              placeholder="Location"
              label="Location"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Results meta row */}
      {data && !loading && (
        <div className="text-sm text-secondary">
          {resultsText}
        </div>
      )}

      {/* Loading state - skeleton cards matching grid */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bhq-card overflow-hidden">
              <div className="aspect-[4/3] bg-surface-2 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-surface-2 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-surface-2 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

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

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="!p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToPrev}
                  disabled={!hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm text-secondary">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToNext}
                  disabled={!hasNext}
                >
                  Next
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
