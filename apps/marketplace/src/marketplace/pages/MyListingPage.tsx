// apps/marketplace/src/marketplace/pages/MyListingPage.tsx
// Display the current user's published marketplace profile
import * as React from "react";
import { apiGet } from "../../api/client";
import { getUserMessage } from "../../api/errors";

/**
 * Shape of the marketplace profile API response.
 * We only care about published data for this page.
 */
interface MarketplaceProfileResponse {
  draft?: unknown;
  draftUpdatedAt?: string | null;
  published?: PublishedProfile | null;
  publishedAt?: string | null;
}

/**
 * Published profile data shape.
 * Treat as untrusted JSON - guard all field accesses.
 */
interface PublishedProfile {
  businessName?: string;
  bio?: string;
  websiteUrl?: string;
  showWebsite?: boolean;
  instagram?: string;
  showInstagram?: boolean;
  facebook?: string;
  showFacebook?: boolean;
  // Location fields - never render street address
  address?: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    // street fields may exist but MUST NOT be rendered
  };
  publicLocationMode?: "city_state" | "zip_only" | "full" | "hidden";
  // Breeds selected for marketplace
  breeds?: Array<{ name?: string } | string>;
  listedBreeds?: string[];
  // Listed programs
  listedPrograms?: Array<{
    name?: string;
    description?: string;
    availability?: string;
  }>;
  publishedAt?: string;
}

/**
 * Build a safe location display string from address data.
 * Never includes street address.
 */
function buildLocationDisplay(
  address: PublishedProfile["address"],
  mode: PublishedProfile["publicLocationMode"]
): string {
  if (!address || mode === "hidden") return "";

  const city = address.city?.trim() || "";
  const state = address.state?.trim() || "";
  const zip = address.zip?.trim() || "";

  switch (mode) {
    case "city_state":
      return city && state ? `${city}, ${state}` : city || state;
    case "zip_only":
      return zip;
    case "full":
      if (city && state && zip) return `${city}, ${state} ${zip}`;
      if (city && state) return `${city}, ${state}`;
      return zip || city || state;
    default:
      return "";
  }
}

/**
 * Extract breed names from various possible shapes.
 */
function extractBreedNames(profile: PublishedProfile): string[] {
  // Try listedBreeds first (string array)
  if (Array.isArray(profile.listedBreeds)) {
    return profile.listedBreeds.filter((b): b is string => typeof b === "string" && b.trim() !== "");
  }
  // Fall back to breeds array (may be objects or strings)
  if (Array.isArray(profile.breeds)) {
    return profile.breeds
      .map((b) => (typeof b === "string" ? b : b?.name || ""))
      .filter((n) => n.trim() !== "");
  }
  return [];
}

/**
 * My Listing page - shows the user's published marketplace profile.
 */
export function MyListingPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [published, setPublished] = React.useState<PublishedProfile | null>(null);

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiGet<MarketplaceProfileResponse>("/api/v1/marketplace/profile");
      setPublished(data?.published ?? null);
    } catch (err) {
      setError(getUserMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-8 bg-border-default rounded animate-pulse w-1/2" />
        <div className="h-4 bg-border-default rounded animate-pulse w-3/4" />
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-3">
          <div className="h-5 bg-border-default rounded animate-pulse w-2/3" />
          <div className="h-4 bg-border-default rounded animate-pulse w-full" />
          <div className="h-4 bg-border-default rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-md mx-auto">
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state - nothing published yet
  if (!published) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-white mb-2">Nothing published yet</h2>
        <p className="text-text-secondary text-sm">
          Your marketplace profile hasn&apos;t been published yet. Visit your Settings in the Platform to set up and publish your listing.
        </p>
      </div>
    );
  }

  // Extract data with guards
  const businessName = published.businessName?.trim() || "Untitled Business";
  const bio = published.bio?.trim() || "";
  const locationDisplay = buildLocationDisplay(published.address, published.publicLocationMode);
  const websiteUrl = published.showWebsite && published.websiteUrl?.trim() ? published.websiteUrl.trim() : null;
  const instagram = published.showInstagram && published.instagram?.trim() ? published.instagram.trim() : null;
  const facebook = published.showFacebook && published.facebook?.trim() ? published.facebook.trim() : null;
  const breeds = extractBreedNames(published);
  const programs = Array.isArray(published.listedPrograms) ? published.listedPrograms : [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          {businessName}
        </h1>
        {locationDisplay && (
          <p className="text-text-secondary text-sm mt-1">{locationDisplay}</p>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5">
          <p className="text-[15px] text-text-secondary leading-relaxed">{bio}</p>
        </div>
      )}

      {/* Links - Website and Socials */}
      {(websiteUrl || instagram || facebook) && (
        <div className="flex flex-wrap gap-4">
          {websiteUrl && (
            <a
              href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Website
            </a>
          )}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Instagram
            </a>
          )}
          {facebook && (
            <a
              href={`https://facebook.com/${facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Facebook
            </a>
          )}
        </div>
      )}

      {/* Breeds */}
      {breeds.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-text-tertiary">Breeds</h2>
          <div className="flex flex-wrap gap-2">
            {breeds.map((breed) => (
              <span
                key={breed}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-border-default text-text-secondary border border-border-subtle"
              >
                {breed}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Listed Programs */}
      {programs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Breeding Programs</h2>
          <div className="grid grid-cols-1 gap-4">
            {programs.map((program, idx) => {
              const name = program?.name?.trim() || "Untitled Program";
              const description = program?.description?.trim() || "";
              const availability = program?.availability?.trim() || "";

              return (
                <div
                  key={`${name}-${idx}`}
                  className="rounded-portal border border-border-subtle bg-portal-card p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">{name}</h3>
                    {availability && (
                      <span className="text-[12px] text-text-tertiary bg-border-default px-2 py-0.5 rounded-full whitespace-nowrap">
                        {availability}
                      </span>
                    )}
                  </div>
                  {description && (
                    <p className="text-sm text-text-tertiary mt-2 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty programs state */}
      {programs.length === 0 && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 text-center">
          <p className="text-text-tertiary text-sm">No programs listed yet.</p>
        </div>
      )}
    </div>
  );
}

export default MyListingPage;
