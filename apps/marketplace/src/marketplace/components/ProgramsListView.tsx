// apps/marketplace/src/marketplace/components/ProgramsListView.tsx
// Reusable list view for programs/breeders with configurable header
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useProgramsQuery } from "../hooks/useProgramsQuery";
import { FiltersBar } from "./FiltersBar";
import { ProgramsGrid } from "./ProgramsGrid";
import { Pager } from "./Pager";

const LIMIT = 24;

interface ProgramsListViewProps {
  title: string;
  subtitle: string;
}

/**
 * Reusable list view for browsing programs/breeders.
 * Accepts title and subtitle for different page contexts.
 */
export function ProgramsListView({ title, subtitle }: ProgramsListViewProps) {
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
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>
      </div>

      {/* Filters */}
      <FiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        location={location}
        onLocationChange={handleLocationChange}
      />

      {/* Results header row: count on left, pager on right */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[13px] text-text-tertiary">
          {loading ? (
            <span className="inline-block h-3.5 w-20 bg-border-default rounded animate-pulse" />
          ) : total > 0 ? (
            `${total} ${hasFilters ? "result" : "breeder"}${total === 1 ? "" : "s"}`
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
