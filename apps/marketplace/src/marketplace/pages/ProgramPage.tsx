// apps/marketplace/src/marketplace/pages/ProgramPage.tsx
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
 * Program profile page with listings.
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
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/70 text-sm mb-3">{getUserMessage(profileError)}</p>
        <button
          type="button"
          onClick={refetchProfile}
          className="px-4 py-1.5 rounded-md bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
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
        <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
        {/* Header skeleton */}
        <div className="h-7 bg-white/10 rounded animate-pulse w-1/3" />
        {/* Bio skeleton */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
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
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "All programs", href: "/" },
          { label: profile.name },
        ]}
      />

      {/* Header */}
      <h1 className="text-2xl font-bold text-white tracking-tight">
        {profile.name}
      </h1>

      {/* Profile info card */}
      {(bioText || profile.website) && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
          {bioText && (
            <div>
              <p className="text-sm text-white/80 leading-relaxed">{displayBio}</p>
              {shouldClampBio && (
                <button
                  type="button"
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-xs text-orange-400 hover:text-orange-300 mt-1 transition-colors"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {profile.website && (
            <div className={bioText ? "pt-2 border-t border-white/10" : ""}>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                Visit website &rarr;
              </a>
            </div>
          )}
        </div>
      )}

      {/* Listings section */}
      <div className="space-y-3">
        {/* Section header with count badge */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Available Listings</h2>
          {!listingsLoading && !listingsError && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-white/10 text-white/60">
              {listingsCount}
            </span>
          )}
        </div>

        {/* Listings error - inline, does not break profile */}
        {listingsError && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-white/70 text-sm mb-2">{getUserMessage(listingsError)}</p>
            <button
              type="button"
              onClick={refetchListings}
              className="px-4 py-1.5 rounded-md bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
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
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-sm font-medium text-white mb-1">No listings published</p>
            <p className="text-xs text-white/50">
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
 * Skeleton for listing card loading state.
 */
function ListingCardSkeleton() {
  return (
    <div className="flex flex-col min-h-[200px] rounded-lg border border-white/10 bg-white/5 p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="h-5 bg-white/10 rounded animate-pulse w-2/3" />
        <div className="h-5 bg-white/10 rounded animate-pulse w-16" />
      </div>
      {/* Description */}
      <div className="h-4 bg-white/10 rounded animate-pulse w-full mb-1.5" />
      <div className="h-4 bg-white/10 rounded animate-pulse w-3/4 mb-3" />
      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="space-y-1">
          <div className="h-3 bg-white/10 rounded animate-pulse w-10" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-14" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-white/10 rounded animate-pulse w-12" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-16" />
        </div>
      </div>
      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="h-4 bg-white/10 rounded animate-pulse w-20" />
      </div>
    </div>
  );
}

/**
 * Catalog-style listing card for program page.
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
      className={`group flex flex-col min-h-[200px] rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 ${spanTwo ? "lg:col-span-2 lg:max-w-xl" : ""}`}
    >
      {/* Header row: Title left, Price right */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white line-clamp-1 flex-1">
          {listing.title || "Untitled Listing"}
        </h3>
        {priceText ? (
          <span className="text-sm font-semibold text-orange-400 whitespace-nowrap">
            {priceText}
          </span>
        ) : (
          <span className="text-xs text-white/40 whitespace-nowrap">Contact for price</span>
        )}
      </div>

      {/* Description snippet */}
      {listing.description && (
        <p className="text-sm text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>
      )}

      {/* Metadata grid - 2x2 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto pt-3">
        {metadataCells.map((cell) => (
          <div key={cell.label}>
            <span className="text-xs text-white/40 block">{cell.label}</span>
            <span className="text-sm text-white/80 capitalize">{cell.value}</span>
          </div>
        ))}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
        <span className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
          View listing
        </span>
        <span className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
