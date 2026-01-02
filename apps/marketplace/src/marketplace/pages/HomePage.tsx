// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page - browse-first entry with search and Available now section
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { getAllMockListings, simulateDelay } from "../../demo/mockData";
import { formatCents } from "../../utils/format";
import type { PublicOffspringGroupListingDTO } from "../../api/types";

/**
 * Marketplace home page - browse-first entry point.
 * Shows search, and "Available now" section with real or demo data.
 */
export function HomePage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState("");
  const demoMode = isDemoMode();

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      navigate(`/animals?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/animals");
    }
  };

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <div className="space-y-5">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Marketplace
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Browse animals, explore breeders, and request information.
          </p>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search breed, breeder, or location..."
              className="w-full h-12 pl-12 pr-4 rounded-portal-sm bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>
      </div>

      {/* Available now section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Available now</h2>

        {demoMode ? (
          <AvailableNowGrid />
        ) : (
          <ComingSoonBlock onEnableDemo={handleEnableDemo} />
        )}
      </section>
    </div>
  );
}

/**
 * Grid of available animals (demo mode ON).
 */
function AvailableNowGrid() {
  const [listings, setListings] = React.useState<PublicOffspringGroupListingDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(300);
      // Get all listings and take first 6 with available animals
      const all = getAllMockListings().filter((l) => l.countAvailable > 0);
      setListings(all.slice(0, 6));
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-portal border border-border-subtle bg-portal-card p-5 animate-pulse"
          >
            <div className="h-5 bg-border-default rounded w-3/4 mb-3" />
            <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
            <div className="h-4 bg-border-default rounded w-2/3 mb-3" />
            <div className="h-4 bg-border-default rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
        <p className="text-sm text-text-tertiary">No animals available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <AnimalCard key={`${listing.programSlug}-${listing.slug}`} listing={listing} />
      ))}
    </div>
  );
}

/**
 * Animal card for the Available now grid.
 */
function AnimalCard({ listing }: { listing: PublicOffspringGroupListingDTO }) {
  const priceText = listing.priceRange
    ? listing.priceRange.min === listing.priceRange.max
      ? formatCents(listing.priceRange.min)
      : `${formatCents(listing.priceRange.min)} - ${formatCents(listing.priceRange.max)}`
    : null;

  // Extract location from program name pattern or use placeholder
  const location = getLocationFromProgram(listing.programSlug);

  return (
    <Link
      to={`/programs/${listing.programSlug}/offspring-groups/${listing.slug}`}
      className="block"
    >
      <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {/* Title */}
        <h3 className="text-[15px] font-semibold text-white mb-2 line-clamp-1">
          {listing.title || "Untitled Listing"}
        </h3>

        {/* Breed */}
        <div className="text-sm text-text-secondary mb-1">
          {listing.breed || listing.species}
        </div>

        {/* Breeder and location */}
        <div className="text-[13px] text-text-tertiary mb-3">
          {listing.programName}
          {location && <span className="ml-1">· {location}</span>}
        </div>

        {/* Availability */}
        <div className="text-[13px] text-text-secondary mb-3">
          {listing.countAvailable} available
        </div>

        {/* Price */}
        {priceText && (
          <div className="pt-3 border-t border-border-subtle">
            <span className="text-[15px] text-accent font-semibold">{priceText}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Coming soon block (demo mode OFF).
 */
function ComingSoonBlock({ onEnableDemo }: { onEnableDemo: () => void }) {
  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
        <svg
          className="w-6 h-6 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Animals browse is coming soon
      </h3>
      <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
        We're building a unified marketplace experience. In the meantime, browse animals through individual breeders.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/breeders"
          className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Browse breeders
        </Link>
        <button
          type="button"
          onClick={onEnableDemo}
          className="text-sm text-text-tertiary hover:text-white transition-colors"
        >
          Preview with demo data
        </button>
      </div>
    </div>
  );
}

/**
 * Helper to extract location from mock program data.
 */
function getLocationFromProgram(programSlug: string): string | null {
  const locationMap: Record<string, string> = {
    "sunny-meadows-goldens": "Austin, TX",
    "riverside-shepherds": "Denver, CO",
    "maple-leaf-doodles": "Seattle, WA",
    "blue-ribbon-labs": "Nashville, TN",
    "heartland-cavaliers": "Kansas City, MO",
    "pacific-poodles": "San Diego, CA",
    "mountain-view-aussies": "Boulder, CO",
    "southern-charm-frenchies": "Charleston, SC",
  };
  return locationMap[programSlug] || null;
}
