// apps/marketplace/src/marketplace/pages/BreederPage.tsx
// Public breeder profile page - displays published marketplace profile
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import { Breadcrumb } from "../components/Breadcrumb";

/**
 * Shape of the public breeder profile API response.
 */
interface BreederProfileResponse {
  tenantSlug: string;
  businessName: string;
  bio: string | null;
  logoAssetId: string | null;
  publicLocationMode: string | null;
  location: {
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  website: string | null;
  socialLinks: {
    instagram: string | null;
    facebook: string | null;
  };
  breeds: Array<{ name: string }>;
  programs: Array<{
    name: string;
    description: string | null;
    availability: string | null;
  }>;
  publishedAt: string | null;
}

/**
 * Not found state with "How to publish" collapsible panel.
 */
function NotFoundState() {
  const [showHowTo, setShowHowTo] = React.useState(false);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <Breadcrumb
        items={[
          { label: "All breeders", href: "/breeders" },
          { label: "Not found" },
        ]}
      />
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Breeder not found</h2>
        <p className="text-text-secondary text-sm mb-4">
          This breeder profile does not exist, or it has not been published yet.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/breeders"
            className="inline-block px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse breeders
          </Link>
          <button
            type="button"
            onClick={() => setShowHowTo(!showHowTo)}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            How to publish
            <svg
              className={`w-4 h-4 transition-transform ${showHowTo ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* How to publish panel */}
        {showHowTo && (
          <div className="mt-4 pt-4 border-t border-border-subtle text-left">
            <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>Go to Platform Settings → Marketplace</li>
              <li>Fill out your breeder profile</li>
              <li>Ensure at least one breed and one listed program</li>
              <li>Click Publish to Marketplace</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Build a display string for location based on mode.
 */
function buildLocationDisplay(
  location: BreederProfileResponse["location"],
  mode: string | null
): string {
  if (!location || mode === "hidden") return "";

  const { city, state, zip } = location;

  switch (mode) {
    case "city_state":
      return city && state ? `${city}, ${state}` : city || state || "";
    case "zip_only":
      return zip || "";
    case "full":
      if (city && state && zip) return `${city}, ${state} ${zip}`;
      if (city && state) return `${city}, ${state}`;
      return zip || city || state || "";
    default:
      return "";
  }
}

/**
 * Public breeder profile page.
 */
export function BreederPage() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notPublished, setNotPublished] = React.useState(false);
  const [profile, setProfile] = React.useState<BreederProfileResponse | null>(null);

  const fetchProfile = React.useCallback(async () => {
    if (!tenantSlug) {
      setError("Invalid breeder URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotPublished(false);

    try {
      const { data } = await apiGet<BreederProfileResponse>(
        `/api/v1/marketplace/breeders/${encodeURIComponent(tenantSlug)}`
      );
      setProfile(data);
    } catch (err: any) {
      if (err?.status === 404) {
        setNotPublished(true);
      } else {
        setError(getUserMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-4 bg-border-default rounded animate-pulse w-32" />
        <div className="h-8 bg-border-default rounded animate-pulse w-1/2" />
        <div className="h-4 bg-border-default rounded animate-pulse w-1/4" />
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-3">
          <div className="h-5 bg-border-default rounded animate-pulse w-2/3" />
          <div className="h-4 bg-border-default rounded animate-pulse w-full" />
          <div className="h-4 bg-border-default rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // Not published state
  if (notPublished) {
    return <NotFoundState />;
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

  // No profile (shouldn't happen if no error/notPublished)
  if (!profile) {
    return null;
  }

  // Extract display data
  const locationDisplay = buildLocationDisplay(profile.location, profile.publicLocationMode);
  const hasLinks = profile.website || profile.socialLinks.instagram || profile.socialLinks.facebook;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "All breeders", href: "/breeders" },
          { label: profile.businessName },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          {profile.businessName}
        </h1>
        {locationDisplay && (
          <p className="text-text-secondary text-sm mt-1">{locationDisplay}</p>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5">
          <p className="text-[15px] text-text-secondary leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Links - Website and Socials */}
      {hasLinks && (
        <div className="flex flex-wrap gap-4">
          {profile.website && (
            <a
              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Website
            </a>
          )}
          {profile.socialLinks.instagram && (
            <a
              href={`https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Instagram
            </a>
          )}
          {profile.socialLinks.facebook && (
            <a
              href={`https://facebook.com/${profile.socialLinks.facebook}`}
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
      {profile.breeds.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-text-tertiary">Breeds</h2>
          <div className="flex flex-wrap gap-2">
            {profile.breeds.map((breed) => (
              <span
                key={breed.name}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-border-default text-text-secondary border border-border-subtle"
              >
                {breed.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Programs */}
      {profile.programs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Programs</h2>
          <div className="grid grid-cols-1 gap-4">
            {profile.programs.map((program, idx) => (
              <div
                key={`${program.name}-${idx}`}
                className="rounded-portal border border-border-subtle bg-portal-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{program.name}</h3>
                  {program.availability && (
                    <span className="text-[12px] text-text-tertiary bg-border-default px-2 py-0.5 rounded-full whitespace-nowrap">
                      {program.availability}
                    </span>
                  )}
                </div>
                {program.description && (
                  <p className="text-sm text-text-tertiary mt-2 leading-relaxed">
                    {program.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty programs state */}
      {profile.programs.length === 0 && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 text-center">
          <p className="text-text-tertiary text-sm">No programs listed yet.</p>
        </div>
      )}
    </div>
  );
}

export default BreederPage;
