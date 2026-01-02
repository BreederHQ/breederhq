// apps/marketplace/src/core/pages/ProgramProfilePage.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useProgramProfile } from "../hooks/useProgramProfile";
import { useProgramListings } from "../hooks/useProgramListings";
import { ListingCard } from "../components/ListingCard";
import { SectionSkeleton } from "../../shared/ui/SectionSkeleton";
import { FullPageError } from "../../shared/ui/FullPageError";
import { InlineErrorState } from "../../shared/ui/InlineErrorState";
import { EmptyState } from "../../shared/ui/EmptyState";
import { getUserFacingMessage } from "../../shared/errors/userMessages";

const BIO_CLAMP_LINES = 5;

/**
 * Program Profile page - shows program info and listings.
 * Profile and listings load independently.
 */
export function ProgramProfilePage() {
  const { programSlug } = useParams<{ programSlug: string }>();
  const [bioExpanded, setBioExpanded] = React.useState(false);

  // Profile data (independent load)
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProgramProfile(programSlug || "");

  // Listings data (independent load)
  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useProgramListings(programSlug || "");

  // Profile loading state
  if (profileLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={4} />
      </div>
    );
  }

  // Profile error state
  if (profileError != null) {
    return (
      <FullPageError
        message={getUserFacingMessage(profileError, "Unable to load program.")}
        onRetry={refetchProfile}
      />
    );
  }

  // Profile loaded - render shell (listings may still be loading/failed)
  if (!profile) {
    return (
      <FullPageError
        message="Program not found."
        onRetry={refetchProfile}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <BackLink />

      {/* Header block */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{profile.name}</h1>
        </div>

        {/* Contact row */}
        {(profile.website || profile.publicContactEmail) && (
          <div className="flex flex-wrap items-center gap-3">
            {profile.website && (
              <a
                href={normalizeUrl(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hairline bg-surface-1 text-primary text-sm font-medium hover:bg-surface-2 transition-colors"
              >
                <WebsiteIcon />
                Website
              </a>
            )}
            {profile.publicContactEmail && (
              <a
                href={`mailto:${profile.publicContactEmail}`}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                {profile.publicContactEmail}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Bio card */}
      <div className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h2 className="text-lg font-semibold text-primary mb-3">About</h2>
        {profile.bio ? (
          <BioContent
            bio={profile.bio}
            expanded={bioExpanded}
            onToggle={() => setBioExpanded((prev) => !prev)}
          />
        ) : (
          <p className="text-secondary text-sm">
            This program has not added a bio yet.
          </p>
        )}
      </div>

      {/* Listings card */}
      <div className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h2 className="text-lg font-semibold text-primary mb-4">Listings</h2>

        {listingsLoading && <SectionSkeleton rows={3} />}

        {!listingsLoading && listingsError != null && (
          <InlineErrorState
            message={getUserFacingMessage(listingsError, "Unable to load listings.")}
            onRetry={refetchListings}
          />
        )}

        {!listingsLoading && listingsError == null && listings && listings.items.length === 0 && (
          <EmptyState
            title="No listings yet"
            body="Check back soon for new litters and availability."
          />
        )}

        {!listingsLoading && listingsError == null && listings && listings.items.length > 0 && (
          <div className="space-y-3">
            {listings.items.map((listing) => (
              <ListingCard
                key={listing.slug}
                programSlug={programSlug || ""}
                listingSlug={listing.slug}
                title={listing.title}
                species={listing.species}
                breed={listing.breed}
                actualBirthOn={listing.actualBirthOn}
                expectedBirthOn={listing.expectedBirthOn}
                countAvailable={listing.countAvailable}
                priceRange={listing.priceRange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Back link to Programs Index.
 */
function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Programs
    </Link>
  );
}

/**
 * Website icon.
 */
function WebsiteIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

/**
 * Bio content with optional line clamping and expand toggle.
 */
function BioContent({
  bio,
  expanded,
  onToggle,
}: {
  bio: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const el = textRef.current;
    if (el) {
      // Check if text overflows the clamped height
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      const maxHeight = lineHeight * BIO_CLAMP_LINES;
      setIsOverflowing(el.scrollHeight > maxHeight + 4); // Small buffer
    }
  }, [bio]);

  return (
    <div>
      <p
        ref={textRef}
        className="text-secondary text-sm whitespace-pre-wrap"
        style={
          !expanded && isOverflowing
            ? {
                display: "-webkit-box",
                WebkitLineClamp: BIO_CLAMP_LINES,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {bio}
      </p>
      {isOverflowing && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-2 text-sm text-brand-orange hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/**
 * Normalize URL to ensure it has a protocol.
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}
