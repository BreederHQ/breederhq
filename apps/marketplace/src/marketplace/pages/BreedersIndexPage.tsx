// apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
// Breeders index page - lists published breeders with search, filters, and grid display
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../../api/client";
import { VerificationBadge } from "../components/VerificationBadge";

// ============================================================================
// Types
// ============================================================================

interface BreederSummary {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  publicLocationMode: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
  isVerified?: boolean;
  verificationLevel?: "basic" | "verified" | "premium";
}

interface BreedersListResponse {
  items: BreederSummary[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_VISIBLE_BREEDS = 3;
const PAGE_SIZE = 12;

// Supported species per database schema: DOG, CAT, HORSE, GOAT, RABBIT, SHEEP
const SPECIES_OPTIONS = [
  { value: "", label: "All Species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "horse", label: "Horses" },
  { value: "rabbit", label: "Rabbits" },
  { value: "goat", label: "Goats" },
  { value: "sheep", label: "Sheep" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "A-Z" },
  { value: "name-desc", label: "Z-A" },
  { value: "newest", label: "Newest" },
  { value: "breeds", label: "Most Breeds" },
];

// ============================================================================
// Icons
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ============================================================================
// Components
// ============================================================================

/**
 * Search input with icon
 */
function SearchInput({
  value,
  onChange,
  placeholder = "Search breeders...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-subtle bg-portal-card text-white placeholder:text-text-tertiary focus:outline-none focus:border-border-default focus:ring-1 focus:ring-border-default transition-colors"
      />
    </div>
  );
}

/**
 * Filter dropdown select
 */
function FilterSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none ${icon ? "pl-9" : "pl-3"} pr-8 py-2 rounded-lg border border-border-subtle bg-portal-card text-white text-sm focus:outline-none focus:border-border-default transition-colors cursor-pointer`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
    </div>
  );
}

/**
 * ProgramCard - displays a breeder/program in the grid
 */
function ProgramCard({ breeder }: { breeder: BreederSummary }) {
  const visibleBreeds = (breeder.breeds ?? []).slice(0, MAX_VISIBLE_BREEDS);
  const extraCount = (breeder.breeds?.length ?? 0) - MAX_VISIBLE_BREEDS;
  const showLocation = breeder.publicLocationMode !== "hidden" && breeder.location;
  const hasValidSlug = breeder.tenantSlug && breeder.tenantSlug.trim() !== "";

  if (!hasValidSlug) {
    return (
      <div className="rounded-xl border border-border-subtle bg-portal-card p-5 opacity-50 cursor-not-allowed">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-[hsl(var(--brand-orange))]">
              {getInitials(breeder.businessName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{breeder.businessName}</h3>
            <p className="text-sm text-red-400 mt-0.5">Profile unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/breeders/${breeder.tenantSlug}`} className="block group">
      <div className="rounded-xl border border-border-subtle bg-portal-card p-5 h-full transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center flex-shrink-0">
            {breeder.logoAssetId ? (
              <img
                src={`/api/assets/${breeder.logoAssetId}`}
                alt={breeder.businessName}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-[hsl(var(--brand-orange))]">
                {getInitials(breeder.businessName)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate group-hover:text-[hsl(var(--brand-orange))] transition-colors">
                {breeder.businessName}
              </h3>
              {(breeder.isVerified || breeder.verificationLevel) && (
                <VerificationBadge
                  level={breeder.verificationLevel || "verified"}
                  size="sm"
                  showLabel={false}
                />
              )}
            </div>
            {showLocation && (
              <p className="text-sm text-text-tertiary mt-0.5 truncate">{breeder.location}</p>
            )}
            {visibleBreeds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {visibleBreeds.map((breed, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-secondary"
                  >
                    {breed.name}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-tertiary">
                    +{extraCount} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Skeleton loader for ProgramCard
 */
function ProgramCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-border-default" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-border-default rounded w-3/4" />
          <div className="h-3 bg-border-default rounded w-1/2" />
          <div className="flex gap-1.5 mt-2">
            <div className="h-5 w-16 bg-border-default rounded-full" />
            <div className="h-5 w-20 bg-border-default rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton grid
 */
function BreedersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProgramCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Pagination component
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-border-subtle bg-portal-card text-text-secondary hover:bg-portal-card-hover hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {getPageNumbers().map((page, i) =>
        typeof page === "string" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-text-tertiary">
            {page}
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
              page === currentPage
                ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                : "border-border-subtle bg-portal-card text-text-secondary hover:bg-portal-card-hover hover:text-white"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-border-subtle bg-portal-card text-text-secondary hover:bg-portal-card-hover hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {hasFilters ? "No breeders match your filters" : "No published breeders yet"}
      </h3>
      <p className="text-text-tertiary max-w-sm mb-6">
        {hasFilters
          ? "Try adjusting your search or filter criteria to find more results."
          : "There are no published breeder profiles at this time. Check back soon!"}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

/**
 * Error state
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
      <p className="text-text-tertiary max-w-sm mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BreedersIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [breeders, setBreeders] = React.useState<BreederSummary[]>([]);
  const [total, setTotal] = React.useState(0);

  // URL-synced filters
  const search = searchParams.get("q") || "";
  const species = searchParams.get("species") || "";
  const location = searchParams.get("location") || "";
  const sort = searchParams.get("sort") || "name-asc";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Derived state
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(search || species || location);

  // Update URL params
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== "page") {
      params.delete("page");
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  // Fetch breeders
  const fetchBreeders = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (species) params.set("species", species);
      if (location) params.set("location", location);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const queryString = params.toString();
      const url = `/api/v1/marketplace/breeders${queryString ? `?${queryString}` : ""}`;

      const { data } = await apiGet<BreedersListResponse>(url);
      setBreeders(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load breeders. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search, species, location, sort, page]);

  React.useEffect(() => {
    fetchBreeders();
  }, [fetchBreeders]);

  // Debounced search
  const [searchInput, setSearchInput] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParam("q", searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync search input with URL
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight">Breeders</h1>
        <p className="text-text-secondary mt-1">
          Find verified breeders and their programs
        </p>
      </div>

      {/* Search bar */}
      <SearchInput
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Search breeders..."
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          value={species}
          onChange={(v) => updateParam("species", v)}
          options={SPECIES_OPTIONS}
        />
        <FilterSelect
          value={location}
          onChange={(v) => updateParam("location", v)}
          options={[
            { value: "", label: "All Locations" },
            { value: "us", label: "United States" },
            { value: "ca", label: "Canada" },
            { value: "uk", label: "United Kingdom" },
            { value: "au", label: "Australia" },
          ]}
          icon={<MapPinIcon className="h-4 w-4" />}
        />
        <div className="flex-1" />
        <FilterSelect
          value={sort}
          onChange={(v) => updateParam("sort", v)}
          options={SORT_OPTIONS.map((o) => ({ value: o.value, label: `Sort: ${o.label}` }))}
        />
      </div>

      {/* Results count */}
      {!loading && !error && breeders.length > 0 && (
        <p className="text-sm text-text-tertiary">
          {total} breeder{total === 1 ? "" : "s"}
          {hasFilters && " found"}
        </p>
      )}

      {/* Loading state */}
      {loading && <BreedersGridSkeleton />}

      {/* Error state */}
      {!loading && error && <ErrorState message={error} onRetry={fetchBreeders} />}

      {/* Empty state */}
      {!loading && !error && breeders.length === 0 && (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      )}

      {/* Breeders grid */}
      {!loading && !error && breeders.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {breeders.map((breeder) => (
              <ProgramCard key={breeder.tenantSlug} breeder={breeder} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => updateParam("page", String(p))}
          />
        </>
      )}
    </div>
  );
}

export default BreedersIndexPage;
