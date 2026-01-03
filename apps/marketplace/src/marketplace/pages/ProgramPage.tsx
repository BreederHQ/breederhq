// apps/marketplace/src/marketplace/pages/ProgramPage.tsx
// Breeder profile page with "Available Litters" emphasis and Message button
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProgramQuery } from "../hooks/useProgramQuery";
import { useProgramListingsQuery } from "../hooks/useProgramListingsQuery";
import { getUserMessage } from "../../api/errors";
import { isDemoMode } from "../../demo/demoMode";
import { useStartConversation } from "../../messages/hooks";
import { Breadcrumb } from "../components/Breadcrumb";
import { formatCents } from "../../utils/format";

import type { PublicOffspringGroupListingDTO } from "../../api/types";

/**
 * Breeder profile page.
 * Shows breeder info with bio toggle, Message button, then "Available Litters" section.
 */
export function ProgramPage() {
  const navigate = useNavigate();
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

  // Messaging hook
  const { startConversation, loading: starting } = useStartConversation();

  // Bio disclosure state - collapsed by default for long bios
  const [bioExpanded, setBioExpanded] = React.useState(false);

  // Handle message breeder button
  const handleMessageBreeder = async () => {
    if (!profile || starting) return;

    const result = await startConversation({
      context: {
        type: "general",
        programSlug,
        programName: profile.name,
      },
      participant: {
        name: profile.name,
        type: "breeder",
        slug: programSlug,
      },
    });

    if (result) {
      navigate(`/inquiries?c=${result.conversation.id}`);
    }
  };

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

  // Bio with disclosure toggle for long content
  const bioText = profile.bio || "";
  const shouldClampBio = bioText.length > 200;
  const displayBio = bioExpanded || !shouldClampBio ? bioText : bioText.slice(0, 200) + "...";

  const listingsCount = listingsData?.items.length ?? 0;
  const singleListing = listingsCount === 1;
  const demoMode = isDemoMode();

  // AI-quotable summary
  const aiSummary = `${profile.name} publishes available litters and breeder services in the BreederHQ Marketplace.`;

  return (
    <div className="space-y-6">
      <Seo title={profile.name} />

      {/* Breadcrumb - buyer language */}
      <Breadcrumb
        items={[
          { label: "All breeders", href: "/" },
          { label: profile.name },
        ]}
      />

      {/* Header with Message button */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          {profile.name}
        </h1>

        {/* Message button - shown in demo mode or when messaging backend available */}
        {demoMode && (
          <button
            type="button"
            onClick={handleMessageBreeder}
            disabled={starting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {starting ? "Opening..." : "Message breeder"}
          </button>
        )}
      </div>

      {/* AI-quotable summary paragraph */}
      <p className="text-sm text-text-secondary leading-relaxed">
        {aiSummary}
      </p>

      {/* About this breeder - demoted, collapsible for long bios */}
      {(bioText || profile.website) && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-3">
          {bioText && (
            <div>
              <button
                type="button"
                onClick={() => setBioExpanded(!bioExpanded)}
                className="flex items-center gap-2 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors mb-2"
              >
                <span className="font-medium">About this breeder</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${bioExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {(bioExpanded || !shouldClampBio) && (
                <p className="text-[15px] text-text-secondary leading-relaxed">{displayBio}</p>
              )}
              {!bioExpanded && shouldClampBio && (
                <p className="text-[15px] text-text-secondary leading-relaxed">{displayBio}</p>
              )}
            </div>
          )}

          {profile.website && (
            <div className={bioText ? "pt-2 border-t border-border-subtle" : ""}>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Visit website →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Available Litters section - emphasized */}
      <div className="space-y-3">
        {/* Section header with plain text count */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Available Litters</h2>
          {!listingsLoading && !listingsError && (
            <span className="text-[13px] text-text-tertiary">
              ({listingsCount})
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

        {/* Listings empty - buyer-facing */}
        {!listingsLoading && !listingsError && listingsCount === 0 && (
          <div className="rounded-portal border border-border-subtle bg-portal-card p-6 text-center">
            <p className="text-[15px] font-semibold text-white mb-1">No litters available</p>
            <p className="text-[13px] text-text-tertiary">
              This breeder hasn&apos;t listed any litters yet. Check back later.
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
 * Litter card with buyer-facing language.
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

  // Build metadata cells - buyer language
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
    value: listing.countAvailable > 0 ? String(listing.countAvailable) : "None available",
  });

  return (
    <Link
      to={`/programs/${programSlug}/offspring-groups/${listing.slug}`}
      className={`group flex flex-col min-h-[200px] rounded-portal border border-border-subtle bg-portal-card p-5 shadow-portal transition-all hover:border-border-default hover:bg-portal-card-hover hover:-translate-y-0.5 hover:shadow-portal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${spanTwo ? "lg:col-span-2 lg:max-w-xl" : ""}`}
    >
      {/* Header row: Title left, Price right */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white line-clamp-1 flex-1">
          {listing.title || "Untitled Litter"}
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
          View litter
        </span>
        <span className="text-[13px] text-accent group-hover:text-accent-hover transition-colors">
          →
        </span>
      </div>
    </Link>
  );
}
