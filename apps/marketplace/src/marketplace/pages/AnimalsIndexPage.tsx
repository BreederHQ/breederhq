// apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx
// Animals browse page - listing-centric view with demo mode support
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { getAllMockListings, simulateDelay, getBoostedItem, removeBoostedItem } from "../../demo/mockData";
import { SponsorDisclosure } from "../components/SponsorDisclosure";
import { formatCents } from "../../utils/format";
import { Seo } from "../../seo";
import type { PublicOffspringGroupListingDTO } from "../../api/types";

/**
 * Animals index page - browse available animals.
 * In demo mode: shows aggregated listings from all mock breeders.
 * In real mode: shows coming soon state with CTA to breeders.
 */
export function AnimalsIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = React.useState<PublicOffspringGroupListingDTO[]>([]);
  const [boostedListing, setBoostedListing] = React.useState<PublicOffspringGroupListingDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const demoMode = isDemoMode();

  // Read filter from URL
  const urlSearch = searchParams.get("q") || "";
  const [search, setSearch] = React.useState(urlSearch);

  // Sync URL on filter change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    setSearchParams(params, { replace: true });
  }, [search, setSearchParams]);

  // Fetch listings in demo mode
  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(200);
      let all = getAllMockListings();

      // Get boosted item (before filtering)
      const boosted = getBoostedItem(all, "animals");
      setBoostedListing(boosted);

      // Remove boosted from regular list
      all = removeBoostedItem(all, boosted);

      // Filter by search
      if (search) {
        const q = search.toLowerCase();
        all = all.filter(
          (l) =>
            (l.title && l.title.toLowerCase().includes(q)) ||
            (l.breed && l.breed.toLowerCase().includes(q)) ||
            l.programName.toLowerCase().includes(q)
        );
      }

      setListings(all);
      setLoading(false);
    };

    fetchData();
  }, [demoMode, search]);

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  // SEO component (rendered regardless of demo mode)
  const seoComponent = (
    <Seo
      title="Animals"
      description="Browse available animals by species and breed on the BreederHQ Marketplace. Find puppies, kittens, and other pets from verified breeders."
      path="/animals"
      ogType="website"
    />
  );

  // Real mode: show coming soon state
  if (!demoMode) {
    return (
      <div className="space-y-6">
        {seoComponent}
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Animals
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Browse available animals and view details.
          </p>
        </div>

        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Animals browse is coming soon</h2>
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
              onClick={handleEnableDemo}
              className="text-sm text-text-tertiary hover:text-white transition-colors"
            >
              Preview with demo data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Demo mode: show listings grid
  return (
    <div className="space-y-5">
      {seoComponent}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Animals
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Browse available animals and view details.
        </p>
      </div>

      {/* Search filter */}
      <div className="max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by breed, name, or breeder..."
          className="w-full h-10 px-4 rounded-portal-sm bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {/* Results count */}
      <div className="text-[13px] text-text-tertiary">
        {loading ? (
          <span className="inline-block h-3.5 w-20 bg-border-default rounded animate-pulse" />
        ) : (
          `${listings.length} listing${listings.length === 1 ? "" : "s"}`
        )}
      </div>

      {/* Boosted listing - pinned at top when not searching */}
      {!loading && boostedListing && !search && (
        <div className="mb-4">
          <ListingCard listing={boostedListing} isBoosted />
        </div>
      )}

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-portal border border-border-subtle bg-portal-card p-5 animate-pulse">
              <div className="h-5 bg-border-default rounded w-3/4 mb-3" />
              <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
              <div className="h-4 bg-border-default rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <p className="text-sm text-text-tertiary">No listings match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={`${listing.programSlug}-${listing.slug}`} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Listing card for the animals browse grid.
 */
function ListingCard({ listing, isBoosted = false }: { listing: PublicOffspringGroupListingDTO; isBoosted?: boolean }) {
  const priceText = listing.priceRange
    ? listing.priceRange.min === listing.priceRange.max
      ? formatCents(listing.priceRange.min)
      : `${formatCents(listing.priceRange.min)} - ${formatCents(listing.priceRange.max)}`
    : null;

  const birthDateLabel = listing.actualBirthOn ? "Born" : "Expected";
  const birthDateValue = listing.actualBirthOn || listing.expectedBirthOn;

  return (
    <Link
      to={`/programs/${listing.programSlug}/offspring-groups/${listing.slug}`}
      className="block"
    >
      <div className={`rounded-portal border bg-portal-card p-5 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default ${
        isBoosted ? "border-accent/30" : "border-border-subtle"
      }`}>
        {/* Boosted badge and disclosure */}
        {isBoosted && (
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/15 text-accent">
              Boosted
            </span>
            {listing.sponsorDisclosureText && (
              <div onClick={(e) => e.preventDefault()}>
                <SponsorDisclosure disclosureText={listing.sponsorDisclosureText} />
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-white mb-2 line-clamp-1">
          {listing.title}
        </h3>

        {/* Breed and species */}
        <div className="text-sm text-text-secondary mb-1">
          {listing.breed || listing.species}
        </div>

        {/* Breeder attribution */}
        <div className="text-[13px] text-text-tertiary mb-3">
          {listing.programName}
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-secondary">
          {birthDateValue && (
            <span>{birthDateLabel} {birthDateValue}</span>
          )}
          <span>{listing.countAvailable} available</span>
        </div>

        {/* Price */}
        {priceText && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <span className="text-[15px] text-accent font-semibold">{priceText}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
