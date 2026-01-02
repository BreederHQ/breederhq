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

  // Page changes
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

  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / LIMIT) : 0;
  const hasFilters = search.trim() !== "" || location.trim() !== "";

  // Show pager when there are results (even if only 1 page, to show count)
  const showPager = !loading && !error && data && total > 0;

  return (
    <div className="space-y-4">
      {/* Page header - tighter */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Programs
        </h1>
        <p className="text-sm text-white/50 mt-0.5">Browse breeder programs</p>
      </div>

      {/* Filters */}
      <FiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        location={location}
        onLocationChange={handleLocationChange}
      />

      {/* Results header row: count on left, pager on right */}
      <div className="flex items-center justify-between flex-wrap gap-2 py-1">
        <div className="text-xs text-white/50">
          {loading ? (
            <span className="inline-block h-3 w-16 bg-white/10 rounded animate-pulse" />
          ) : total > 0 ? (
            `${total} ${hasFilters ? "result" : "program"}${total === 1 ? "" : "s"}`
          ) : null}
        </div>
        {showPager && totalPages > 1 && (
          <Pager
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            inline
          />
        )}
      </div>

      {/* Grid */}
      <ProgramsGrid
        programs={data?.items ?? null}
        loading={loading}
        error={error}
        onRetry={refetch}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
      />

      {/* Bottom pagination for convenience on long pages */}
      {showPager && totalPages > 1 && (
        <Pager
          page={page}
          totalPages={totalPages}
          total={total}
          limit={LIMIT}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
        />
      )}
    </div>
  );
}
