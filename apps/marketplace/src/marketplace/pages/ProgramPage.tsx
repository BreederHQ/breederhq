// apps/marketplace/src/marketplace/pages/ProgramPage.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useProgramQuery } from "../hooks/useProgramQuery";
import { useProgramListingsQuery } from "../hooks/useProgramListingsQuery";
import { getUserMessage } from "../../api/errors";
import type { PublicOffspringGroupListingDTO } from "../../api/types";

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
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-white/70 mb-4">{getUserMessage(profileError)}</p>
        <button
          type="button"
          onClick={refetchProfile}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Profile loading
  if (profileLoading || !profile) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-white/10 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-white/10 rounded animate-pulse w-1/4" />
        </div>
        {/* Bio skeleton */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
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

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors"
      >
        <span className="mr-1">&larr;</span> All programs
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {profile.name}
        </h1>
        {profile.location && (
          <p className="text-white/60 mt-2">{profile.location}</p>
        )}
      </div>

      {/* Profile info card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        {bioText && (
          <div>
            <p className="text-white/80 leading-relaxed">{displayBio}</p>
            {shouldClampBio && (
              <button
                type="button"
                onClick={() => setBioExpanded(!bioExpanded)}
                className="text-sm text-orange-400 hover:text-orange-300 mt-2 transition-colors"
              >
                {bioExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {profile.website && (
          <div className="pt-2 border-t border-white/10">
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

      {/* Listings section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Available Listings</h2>

        {/* Listings error - inline, does not break profile */}
        {listingsError && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-white/70 mb-4">{getUserMessage(listingsError)}</p>
            <button
              type="button"
              onClick={refetchListings}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Listings loading - 3 skeleton tiles matching final geometry */}
        {listingsLoading && !listingsError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
              >
                <div className="h-5 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
                <div className="flex gap-2">
                  <div className="h-5 bg-white/10 rounded animate-pulse w-16" />
                  <div className="h-5 bg-white/10 rounded animate-pulse w-20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-4 bg-white/10 rounded animate-pulse w-24 mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Listings empty */}
        {!listingsLoading && !listingsError && listingsData?.items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-white/70">No listings available at this time.</p>
          </div>
        )}

        {/* Listings grid */}
        {!listingsLoading && !listingsError && listingsData && listingsData.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listingsData.items.map((listing) => (
              <ListingRowCard
                key={listing.slug}
                listing={listing}
                programSlug={programSlug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Listing card for program page showing all required fields.
 */
function ListingRowCard({
  listing,
  programSlug,
}: {
  listing: PublicOffspringGroupListingDTO;
  programSlug: string;
}) {
  // Format price display
  const priceText =
    listing.priceMin != null && listing.priceMax != null
      ? listing.priceMin === listing.priceMax
        ? `${listing.currency || "$"}${listing.priceMin}`
        : `${listing.currency || "$"}${listing.priceMin} – ${listing.currency || "$"}${listing.priceMax}`
      : listing.priceMin != null
        ? `From ${listing.currency || "$"}${listing.priceMin}`
        : "Not specified";

  return (
    <Link
      to={`/programs/${programSlug}/offspring-groups/${listing.slug}`}
      className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-white line-clamp-1">
        {listing.title}
      </h3>

      {/* Description */}
      {listing.description && (
        <p className="text-sm text-white/50 mt-1 line-clamp-2">
          {listing.description}
        </p>
      )}

      {/* Pills row: Species, Breed */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">
          {listing.species || "Species not specified"}
        </span>
        <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">
          Breed not specified
        </span>
      </div>

      {/* Info grid: Date, Availability, Price */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
        <div>
          <span className="text-white/40 text-xs block">Expected</span>
          <span className="text-white/70">
            {listing.expectedDate || "Not specified"}
          </span>
        </div>
        <div>
          <span className="text-white/40 text-xs block">Available</span>
          <span className="text-white/70">–</span>
        </div>
        <div className="col-span-2">
          <span className="text-white/40 text-xs block">Price</span>
          <span className="text-orange-400 font-medium">{priceText}</span>
        </div>
      </div>

      {/* View affordance */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <span className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
          View listing &rarr;
        </span>
      </div>
    </Link>
  );
}
