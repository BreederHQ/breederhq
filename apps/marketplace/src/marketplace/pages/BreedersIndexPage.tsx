// apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
// Breeders index page - lists published breeders from the API
import * as React from "react";
import { Link } from "react-router-dom";
import { apiGet, ApiError } from "../../api/client";

// ============================================================================
// Types
// ============================================================================

interface BreederSummary {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  breeds: Array<{ name: string }>;
  logoAssetId: string | null;
}

interface BreedersListResponse {
  items: BreederSummary[];
  total: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_VISIBLE_BREEDS = 3;

// ============================================================================
// Components
// ============================================================================

/**
 * Loading skeleton for the breeders grid.
 */
function BreedersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-3"
        >
          <div className="h-5 bg-border-default rounded animate-pulse w-2/3" />
          <div className="h-4 bg-border-default rounded animate-pulse w-1/3" />
          <div className="flex gap-2">
            <div className="h-6 bg-border-default rounded-full animate-pulse w-20" />
            <div className="h-6 bg-border-default rounded-full animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single breeder card in the grid.
 */
function BreederCard({ breeder }: { breeder: BreederSummary }) {
  const visibleBreeds = breeder.breeds.slice(0, MAX_VISIBLE_BREEDS);
  const extraCount = breeder.breeds.length - MAX_VISIBLE_BREEDS;

  return (
    <Link
      to={`/breeders/${breeder.tenantSlug}`}
      className="block rounded-portal border border-border-subtle bg-portal-card p-5 hover:border-border-default hover:bg-portal-card-hover transition-colors group"
    >
      <h3 className="text-base font-semibold text-white group-hover:text-accent transition-colors truncate">
        {breeder.businessName}
      </h3>
      {breeder.location && (
        <p className="text-sm text-text-tertiary mt-1 truncate">{breeder.location}</p>
      )}
      {visibleBreeds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {visibleBreeds.map((breed) => (
            <span
              key={breed.name}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-border-default text-text-secondary border border-border-subtle"
            >
              {breed.name}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-border-default text-text-tertiary border border-border-subtle">
              +{extraCount}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

/**
 * Empty state when no breeders are published.
 */
function EmptyState() {
  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-white mb-2">No breeders yet</h2>
      <p className="text-text-secondary text-sm">
        There are no published breeder profiles at this time. Check back later!
      </p>
    </div>
  );
}

/**
 * Error state with retry option.
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-md mx-auto">
      <p className="text-text-secondary text-sm mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Stub state shown when the breeders list API endpoint is not yet implemented.
 */
function ApiNotImplementedState() {
  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-white mb-2">Coming soon</h2>
      <p className="text-text-secondary text-sm">
        The breeders directory is under development. Individual breeder profiles can still be
        accessed directly by URL.
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Breeders index page - lists all published breeders.
 */
export function BreedersIndexPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notImplemented, setNotImplemented] = React.useState(false);
  const [breeders, setBreeders] = React.useState<BreederSummary[]>([]);

  const fetchBreeders = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotImplemented(false);

    try {
      // Attempt to fetch from the breeders list endpoint
      const { data } = await apiGet<BreedersListResponse>("/api/v1/marketplace/breeders");
      setBreeders(data?.items ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        // 404 means the endpoint doesn't exist yet
        if (err.status === 404) {
          setNotImplemented(true);
          return;
        }
      }
      // Other errors
      const message =
        err instanceof Error ? err.message : "Failed to load breeders. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBreeders();
  }, [fetchBreeders]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Breeders
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Explore breeders and their programs.
        </p>
      </div>

      {/* Loading state */}
      {loading && <BreedersGridSkeleton />}

      {/* API not implemented stub */}
      {!loading && notImplemented && <ApiNotImplementedState />}

      {/* Error state */}
      {!loading && !notImplemented && error && (
        <ErrorState message={error} onRetry={fetchBreeders} />
      )}

      {/* Empty state */}
      {!loading && !notImplemented && !error && breeders.length === 0 && <EmptyState />}

      {/* Breeders grid */}
      {!loading && !notImplemented && !error && breeders.length > 0 && (
        <>
          <p className="text-[13px] text-text-tertiary">
            {breeders.length} breeder{breeders.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {breeders.map((breeder) => (
              <BreederCard key={breeder.tenantSlug} breeder={breeder} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default BreedersIndexPage;
