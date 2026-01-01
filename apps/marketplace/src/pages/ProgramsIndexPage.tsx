// apps/marketplace/src/pages/ProgramsIndexPage.tsx
import * as React from "react";
import { PageHeader, EmptyState } from "@bhq/ui";
import { publicMarketplaceApi } from "../api";
import type { PublicProgramSummary, ApiError } from "../types";
import { ProgramCard } from "../components/ProgramCard";

type ProgramsIndexPageProps = {
  onNavigate: (path: string) => void;
};

type LoadState = "loading" | "success" | "error";

type Filters = {
  search: string;
  species: string;
  location: string;
};

const DEBOUNCE_MS = 300;

export function ProgramsIndexPage({ onNavigate }: ProgramsIndexPageProps) {
  const [loadState, setLoadState] = React.useState<LoadState>("loading");
  const [programs, setPrograms] = React.useState<PublicProgramSummary[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    species: "",
    location: "",
  });

  // Debounced filter values for API calls
  const [debouncedFilters, setDebouncedFilters] = React.useState<Filters>(filters);

  // Debounce filter changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  // Fetch programs when debounced filters change
  const fetchKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const fetchKey = JSON.stringify(debouncedFilters);

    // Skip if already fetched this key
    if (fetchKeyRef.current === fetchKey && loadState !== "loading") {
      return;
    }

    let cancelled = false;
    fetchKeyRef.current = fetchKey;

    async function load() {
      setLoadState("loading");
      try {
        const data = await publicMarketplaceApi.programs.list({
          search: debouncedFilters.search || undefined,
          species: debouncedFilters.species || undefined,
          location: debouncedFilters.location || undefined,
        });
        if (cancelled) return;
        setPrograms(data.items || []);
        setLoadState("success");
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        setErrorMessage(apiErr.message || "Failed to load programs");
        setLoadState("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [debouncedFilters, loadState]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", species: "", location: "" });
  };

  const hasActiveFilters = filters.search || filters.species || filters.location;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-teal))]/20 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-2xl">
          🔍
        </div>
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Browse Programs"
            subtitle="Find breeding programs by species, breed, or location"
          />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-hairline bg-surface p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search programs..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-hairline bg-surface-strong/30 text-sm text-primary placeholder-secondary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          {/* Species filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-secondary mb-1">Species</label>
            <input
              type="text"
              placeholder="e.g. Dogs, Cats"
              value={filters.species}
              onChange={(e) => handleFilterChange("species", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-hairline bg-surface-strong/30 text-sm text-primary placeholder-secondary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
            />
          </div>

          {/* Location filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-secondary mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. California, USA"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-hairline bg-surface-strong/30 text-sm text-primary placeholder-secondary focus:outline-none focus:border-[hsl(var(--brand-orange))]/50"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs text-secondary hover:text-primary transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loadState === "loading" && <ProgramsLoadingSkeleton />}

      {loadState === "error" && (
        <div className="rounded-xl border border-hairline bg-surface p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary mb-1">
                Unable to load programs
              </h3>
              <p className="text-sm text-secondary max-w-md">
                {errorMessage || "An unexpected error occurred. Please try again."}
              </p>
            </div>
          </div>
        </div>
      )}

      {loadState === "success" && programs.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? "No programs found" : "No programs yet"}
          hint={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Check back later for breeding programs."
          }
        />
      )}

      {loadState === "success" && programs.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-secondary">
            {programs.length} program{programs.length === 1 ? "" : "s"} found
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => onNavigate(`/marketplace/programs/${program.slug}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramsLoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-24 bg-surface-strong/50 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-hairline bg-surface p-4 flex gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-surface-strong/50" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-surface-strong/50 rounded" />
              <div className="h-4 w-24 bg-surface-strong/30 rounded" />
              <div className="h-3 w-20 bg-surface-strong/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
