// apps/marketplace/src/marketplace/pages/ProgramPage.tsx
// Portal-aligned page hierarchy, card styling
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useProgramQuery } from "../hooks/useProgramQuery";
import { useProgramListingsQuery } from "../hooks/useProgramListingsQuery";
import { getUserMessage } from "../../api/errors";
import { Breadcrumb } from "../components/Breadcrumb";
import type { PublicOffspringGroupListingDTO } from "../../api/types";

/**
 * Format cents to dollars display string
 */
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Program profile page with Portal-aligned styling.
 * Profile and listings load independently.
 */
export function ProgramPage() {
  const { programSlug = "" } = useParams<{ programSlug: string }>();

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProgramQuery(programSlug);

  const {
    data: listingsData,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useProgramListingsQuery(programSlug);

  // Bio expanded state
  const [bioExpanded, setBioExpanded] = React.useState(false);

  // Profile error - full page error
  if (profileError) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <p className="text-text-secondary text-sm mb-4">{getUserMessage(profileError)}</p>
        <button
          type="button"
          onClick={refetchProfile}
          className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Profile loading
  if (profileLoading || !profile) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-border-default rounded animate-pulse w-32" />
        {/* Header skeleton */}
        <div className="h-8 bg-border-default rounded animate-pulse w-1/3" />
        {/* Bio skeleton */}
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-2">
          <div className="h-4 bg-border-default rounded animate-pulse w-full" />
          <div className="h-4 bg-border-default rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // Bio with read more
  const bioText = profile.bio || "";
  const shouldClampBio = bioText.length > 300;
  const displayBio = bioExpanded || !shouldClampBio ? bioText : bioText.slice(0, 300) + "...";

  const listingsCount = listingsData?.items.length ?? 0;
  const singleListing = listingsCount === 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "All programs", href: "/" },
          { label: profile.name },
        ]}
      />

      {/* Header - Portal typography */}
      <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
        {profile.name}
      </h1>

      {/* Profile info card - Portal styling */}
      {(bioText || profile.website) && (
        <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-5 space-y-4">
          {bioText && (
            <div>
              <p className="text-[15px] text-text-secondary leading-relaxed">{displayBio}</p>
              {shouldClampBio && (
                <button
                  type="button"
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-[13px] text-accent hover:text-accent-hover mt-2 transition-colors"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {profile.website && (
            <div className={bioText ? "pt-3 border-t border-border-subtle" : ""}>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Visit website →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Listings section */}
      <div className="space-y-3">
        {/* Section header with count badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Available Listings</h2>
          {!listingsLoading && !listingsError && (
            <span className="px-2.5 py-1 rounded-portal-xs text-[13px] font-medium bg-border-default text-text-secondary">
              {listingsCount}
            </span>
          )}
        </div>

        {/* Listings error - inline, does not break profile */}
        {listingsError && (
          <div className="rounded-portal border border-border-subtle bg-portal-card p-5 text-center">
            <p className="text-text-secondary text-sm mb-3">{getUserMessage(listingsError)}</p>
            <button
              type="button"
              onClick={refetchListings}
              className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Listings loading - skeleton tiles */}
        {listingsLoading && !listingsError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Listings empty */}
        {!listingsLoading && !listingsError && listingsCount === 0 && (
          <div className="rounded-portal border border-border-subtle bg-portal-card p-6 text-center">
            <p className="text-[15px] font-semibold text-white mb-1">No listings published</p>
            <p className="text-[13px] text-text-tertiary">
              This program hasn&apos;t published any listings yet. Check back later.
            </p>
          </div>
        )}

        {/* Listings grid */}
        {!listingsLoading && !listingsError && listingsData && listingsCount > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listingsData.items.map((listing) => (
              <ListingCard
                key={listing.slug}
                listing={listing}
                programSlug={programSlug}
                spanTwo={singleListing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton for listing card loading state - Portal styling.
 */
function ListingCardSkeleton() {
  return (
    <div className="flex flex-col min-h-[200px] rounded-portal border border-border-subtle bg-portal-card p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="h-5 bg-border-default rounded animate-pulse w-2/3" />
        <div className="h-5 bg-border-default rounded animate-pulse w-16" />
      </div>
      {/* Description */}
      <div className="h-4 bg-border-default rounded animate-pulse w-full mb-2" />
      <div className="h-4 bg-border-default rounded animate-pulse w-3/4 mb-4" />
      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="space-y-1">
          <div className="h-3 bg-border-default rounded animate-pulse w-10" />
          <div className="h-4 bg-border-default rounded animate-pulse w-14" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-border-default rounded animate-pulse w-12" />
          <div className="h-4 bg-border-default rounded animate-pulse w-16" />
        </div>
      </div>
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border-subtle">
        <div className="h-4 bg-border-default rounded animate-pulse w-20" />
      </div>
    </div>
  );
}

/**
 * Catalog-style listing card with Portal styling.
 */
function ListingCard({
  listing,
  programSlug,
  spanTwo = false,
}: {
  listing: PublicOffspringGroupListingDTO;
  programSlug: string;
  spanTwo?: boolean;
}) {
  // Format price display from priceRange (cents)
  const priceText = listing.priceRange
    ? listing.priceRange.min === listing.priceRange.max
      ? formatCents(listing.priceRange.min)
      : `${formatCents(listing.priceRange.min)} – ${formatCents(listing.priceRange.max)}`
    : null;

  // Use actual birth date if available, otherwise expected
  const birthDateLabel = listing.actualBirthOn ? "Born" : "Expected";
  const birthDateValue = listing.actualBirthOn || listing.expectedBirthOn;

  // Build metadata cells - only include cells with values
  const metadataCells: Array<{ label: string; value: string }> = [
    { label: "Species", value: listing.species.toLowerCase() },
  ];

  if (listing.breed) {
    metadataCells.push({ label: "Breed", value: listing.breed });
  }

  if (birthDateValue) {
    metadataCells.push({ label: birthDateLabel, value: birthDateValue });
  }

  metadataCells.push({
    label: "Available",
    value: listing.countAvailable > 0 ? String(listing.countAvailable) : "Contact breeder",
  });

  return (
    <Link
      to={`/programs/${programSlug}/offspring-groups/${listing.slug}`}
      className={`group flex flex-col min-h-[200px] rounded-portal border border-border-subtle bg-portal-card p-5 shadow-portal transition-all hover:border-border-default hover:bg-portal-card-hover hover:-translate-y-0.5 hover:shadow-portal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${spanTwo ? "lg:col-span-2 lg:max-w-xl" : ""}`}
    >
      {/* Header row: Title left, Price right */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white line-clamp-1 flex-1">
          {listing.title || "Untitled Listing"}
        </h3>
        {priceText ? (
          <span className="text-sm font-semibold text-accent whitespace-nowrap">
            {priceText}
          </span>
        ) : (
          <span className="text-[13px] text-text-muted whitespace-nowrap">Contact for price</span>
        )}
      </div>

      {/* Description snippet */}
      {listing.description && (
        <p className="text-sm text-text-tertiary mt-2 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>
      )}

      {/* Metadata grid - 2x2 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto pt-4">
        {metadataCells.map((cell) => (
          <div key={cell.label}>
            <span className="text-[12px] text-text-muted block">{cell.label}</span>
            <span className="text-sm text-text-secondary capitalize">{cell.value}</span>
          </div>
        ))}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
        <span className="text-[13px] text-accent group-hover:text-accent-hover transition-colors">
          View listing
        </span>
        <span className="text-[13px] text-accent group-hover:text-accent-hover transition-colors">
          →
        </span>
      </div>
    </Link>
  );
}
