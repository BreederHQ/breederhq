// apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
// Breeders index page - lists published breeders from the API
import * as React from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client";

// ============================================================================
// Types
// ============================================================================

interface BreederSummary {
  tenantSlug: string;
  businessName: string;
  // Formatted location string
  location: string | null;
  // Raw location fields for filtering/custom formatting
  publicLocationMode: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
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
// Helpers
// ============================================================================

/**
 * Extract initials from business name (first letter of first two words).
 */
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
 * Avatar component - shows logo if available, otherwise initials.
 */
function BreederAvatar({ breeder }: { breeder: BreederSummary }) {
  // TODO: When asset URLs are available, render actual logo image
  // For now, always show initials
  const initials = getInitials(breeder.businessName);

  return (
    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-accent">{initials}</span>
    </div>
  );
}

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
  const visibleBreeds = (breeder.breeds ?? []).slice(0, MAX_VISIBLE_BREEDS);
  const extraCount = (breeder.breeds?.length ?? 0) - MAX_VISIBLE_BREEDS;

  // Only show location if mode is not hidden and location string exists
  const showLocation =
    breeder.publicLocationMode !== "hidden" && breeder.location;

  return (
    <Link
      to={`/breeders/${breeder.tenantSlug}`}
      className="block rounded-portal border border-border-subtle bg-portal-card p-4 hover:border-border-default hover:bg-portal-card-hover transition-colors group"
    >
      <div className="flex items-start gap-3">
        <BreederAvatar breeder={breeder} />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white group-hover:text-accent transition-colors truncate">
            {breeder.businessName}
          </h3>
          {showLocation && (
            <p className="text-sm text-text-tertiary mt-0.5 truncate">{breeder.location}</p>
          )}
        </div>
      </div>
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
    <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-border-default mx-auto mb-4 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-text-tertiary"
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
      <h2 className="text-lg font-semibold text-white mb-2">No published breeders yet</h2>
      <p className="text-text-secondary text-sm mb-1">
        There are no published breeder profiles at this time.
      </p>
      <p className="text-text-tertiary text-xs">
        Publish your breeder profile in Platform Settings → Marketplace.
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

// ============================================================================
// Main Component
// ============================================================================

/**
 * Breeders index page - lists all published breeders.
 */
export function BreedersIndexPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [breeders, setBreeders] = React.useState<BreederSummary[]>([]);

  const fetchBreeders = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiGet<BreedersListResponse>("/api/v1/marketplace/breeders");
      setBreeders(data?.items ?? []);
    } catch (err) {
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

      {/* Error state */}
      {!loading && error && (
        <ErrorState message={error} onRetry={fetchBreeders} />
      )}

      {/* Empty state */}
      {!loading && !error && breeders.length === 0 && <EmptyState />}

      {/* Breeders grid */}
      {!loading && !error && breeders.length > 0 && (
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
