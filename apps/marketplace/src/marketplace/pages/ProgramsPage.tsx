// apps/marketplace/src/marketplace/pages/ProgramsPage.tsx
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { FiltersBar } from "../components/FiltersBar";
import { ProgramsGrid } from "../components/ProgramsGrid";
import { Pager } from "../components/Pager";

const LIMIT = 24;

/**
 * Programs Index page - browse breeder programs.
 * URL params: q (search), loc (location), page (pagination)
 */
export function ProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read from URL
  const urlSearch = searchParams.get("q") || "";
  const urlLocation = searchParams.get("loc") || "";
  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);

  // Local state for immediate input feedback
  const [search, setSearch] = React.useState(urlSearch);
  const [location, setLocation] = React.useState(urlLocation);
  const [page, setPage] = React.useState(urlPage);

  // Sync URL on filter changes (replaceState)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (location) params.set("loc", location);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, location, page, setSearchParams]);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setPage(1);
  };

  // Page changes use pushState (via setPage then sync effect)
  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    setPage((p) => p + 1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setPage(1);
  };

  // Query
  const { data, loading, error, refetch } = useProgramsQuery({
    search,
    location,
    page,
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const hasFilters = search.trim() !== "" || location.trim() !== "";

  // Results text
  const resultsText = React.useMemo(() => {
    if (!data) return "";
    if (hasFilters) {
      return `${data.total} result${data.total === 1 ? "" : "s"}`;
    }
    return `${data.total} program${data.total === 1 ? "" : "s"}`;
  }, [data, hasFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Programs
        </h1>
        <p className="text-white/60 mt-2">Browse breeder programs</p>
      </div>

      {/* Filters */}
      <FiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        location={location}
        onLocationChange={handleLocationChange}
      />

      {/* Results meta */}
      {data && !loading && (
        <div className="text-sm text-white/60">{resultsText}</div>
      )}

      {/* Grid */}
      <ProgramsGrid
        programs={data?.items ?? null}
        loading={loading}
        error={error}
        onRetry={refetch}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
      />

      {/* Pagination */}
      {!loading && !error && data && data.items.length > 0 && (
        <Pager
          page={page}
          totalPages={totalPages}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
        />
      )}
    </div>
  );
}
