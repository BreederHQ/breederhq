// apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx
// Animals browse page - listing-centric view with demo mode support
// Supports both offspring group listings (litters) and program animal listings (individual animals)
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { getAllMockListings, simulateDelay, getBoostedItem, removeBoostedItem } from "../../demo/mockData";
import { SponsorDisclosure } from "../components/SponsorDisclosure";
import { formatCents } from "../../utils/format";
import { getAnimalListings } from "../../api/client";

import type { PublicOffspringGroupListingDTO, PublicAnimalListingDTO, AnimalListingIntent } from "../../api/types";

// Intent display labels
const INTENT_LABELS: Record<AnimalListingIntent, string> = {
  STUD: "Stud Service",
  BROOD_PLACEMENT: "Brood Placement",
  REHOME: "Rehome",
  SHOWCASE: "Showcase",
};

// View type for tab switching
type ViewType = "all" | "litters" | "animals";

/**
 * Animals index page - browse available animals.
 * Shows both offspring group listings (litters) and program animal listings.
 * In demo mode: shows aggregated listings from all mock breeders.
 * In real mode: fetches from API + can fall back to demo.
 */
export function AnimalsIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [litterListings, setLitterListings] = React.useState<PublicOffspringGroupListingDTO[]>([]);
  const [animalListings, setAnimalListings] = React.useState<PublicAnimalListingDTO[]>([]);
  const [boostedListing, setBoostedListing] = React.useState<PublicOffspringGroupListingDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const demoMode = isDemoMode();

  // Read filter from URL
  const urlSearch = searchParams.get("q") || "";
  const urlView = (searchParams.get("view") as ViewType) || "all";
  const [search, setSearch] = React.useState(urlSearch);
  const [view, setView] = React.useState<ViewType>(urlView);

  // Sync URL on filter change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (view !== "all") params.set("view", view);
    setSearchParams(params, { replace: true });
  }, [search, view, setSearchParams]);

  // Fetch listings
  React.useEffect(() => {
    let dead = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always try to fetch program animal listings from API
        const animalResponse = await getAnimalListings({ search: search || undefined });
        if (!dead) {
          setAnimalListings(animalResponse?.items || []);
        }
      } catch (err) {
        // Silently fail for animal listings - they may not be available yet
        if (!dead) setAnimalListings([]);
      }

      // Demo mode litter listings
      if (demoMode) {
        await simulateDelay(200);
        let all = getAllMockListings();

        // Get boosted item (before filtering)
        const boosted = getBoostedItem(all, "animals");
        if (!dead) setBoostedListing(boosted);

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

        if (!dead) setLitterListings(all);
      } else {
        // Real mode - no litter listings from demo
        if (!dead) setLitterListings([]);
      }

      if (!dead) setLoading(false);
    };

    fetchData();
    return () => { dead = true; };
  }, [demoMode, search]);

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  // Filter listings by view
  const filteredLitterListings = view === "animals" ? [] : litterListings;
  const filteredAnimalListings = view === "litters" ? [] : animalListings.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.headline && a.headline.toLowerCase().includes(q)) ||
      (a.animalBreed && a.animalBreed.toLowerCase().includes(q)) ||
      a.programName.toLowerCase().includes(q) ||
      a.animalName.toLowerCase().includes(q)
    );
  });

  const totalListings = filteredLitterListings.length + filteredAnimalListings.length;
  const hasAnyListings = litterListings.length > 0 || animalListings.length > 0;

  // Real mode with no listings: show coming soon state
  if (!demoMode && !hasAnyListings && !loading) {
    return (
      <div className="space-y-6">

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
          <h2 className="text-lg font-semibold text-white mb-2">No animals available yet</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Browse animals through individual breeders or check back later.
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

  // Main listings view
  return (
    <div className="space-y-5">

      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Animals
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Browse available animals and view details.
        </p>
      </div>

      {/* Search filter and view tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by breed, name, or breeder..."
            className="w-full h-10 px-4 rounded-portal-sm bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>

        {/* View tabs */}
        <div className="flex gap-1 p-1 rounded-portal-sm bg-portal-card border border-border-subtle">
          {[
            { key: "all", label: "All" },
            { key: "animals", label: "Program Animals" },
            { key: "litters", label: "Litters" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key as ViewType)}
              className={`px-3 py-1.5 text-sm rounded-portal-xs transition-colors ${
                view === tab.key
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[13px] text-text-tertiary">
        {loading ? (
          <span className="inline-block h-3.5 w-20 bg-border-default rounded animate-pulse" />
        ) : (
          `${totalListings} listing${totalListings === 1 ? "" : "s"}`
        )}
      </div>

      {/* Boosted listing - pinned at top when not searching */}
      {!loading && boostedListing && !search && view !== "animals" && (
        <div className="mb-4">
          <LitterListingCard listing={boostedListing} isBoosted />
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
      ) : totalListings === 0 ? (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <p className="text-sm text-text-tertiary">No listings match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Program animal listings */}
          {filteredAnimalListings.map((listing) => (
            <AnimalListingCard key={`animal-${listing.id}`} listing={listing} />
          ))}
          {/* Litter listings */}
          {filteredLitterListings.map((listing) => (
            <LitterListingCard key={`litter-${listing.programSlug}-${listing.slug}`} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Litter listing card for offspring group listings.
 */
function LitterListingCard({ listing, isBoosted = false }: { listing: PublicOffspringGroupListingDTO; isBoosted?: boolean }) {
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

        {/* Litter badge */}
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400">
            Litter
          </span>
        </div>

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

/**
 * Program animal listing card for individual animal listings.
 */
function AnimalListingCard({ listing }: { listing: PublicAnimalListingDTO }) {
  // Format price based on price model
  let priceDisplay: string | null = null;
  if (listing.priceModel === "fixed" && listing.priceCents != null) {
    priceDisplay = formatCents(listing.priceCents);
  } else if (listing.priceModel === "range" && listing.priceMinCents != null && listing.priceMaxCents != null) {
    priceDisplay = `${formatCents(listing.priceMinCents)} - ${formatCents(listing.priceMaxCents)}`;
  } else if (listing.priceModel === "inquire") {
    priceDisplay = listing.priceText || "Contact for pricing";
  }

  // Format location
  const locationParts = [listing.locationCity, listing.locationRegion, listing.locationCountry].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : null;

  // Intent label
  const intentLabel = listing.intent ? INTENT_LABELS[listing.intent] : null;

  return (
    <Link
      to={`/programs/${listing.programSlug}/animals/${listing.urlSlug}`}
      className="block"
    >
      <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {/* Intent badge */}
        {intentLabel && (
          <div className="mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              listing.intent === "STUD"
                ? "bg-purple-500/15 text-purple-400"
                : listing.intent === "BROOD_PLACEMENT"
                  ? "bg-pink-500/15 text-pink-400"
                  : listing.intent === "REHOME"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-gray-500/15 text-gray-400"
            }`}>
              {intentLabel}
            </span>
          </div>
        )}

        {/* Photo and title row */}
        <div className="flex gap-3 mb-3">
          {listing.primaryPhotoUrl && (
            <div className="w-16 h-16 flex-shrink-0 rounded-portal-sm overflow-hidden bg-border-default">
              <img
                src={listing.primaryPhotoUrl}
                alt={listing.animalName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-[15px] font-semibold text-white mb-1 line-clamp-1">
              {listing.title || listing.animalName}
            </h3>

            {/* Headline */}
            {listing.headline && (
              <p className="text-sm text-text-secondary line-clamp-2">
                {listing.headline}
              </p>
            )}
          </div>
        </div>

        {/* Breed and species */}
        <div className="text-sm text-text-secondary mb-1">
          {listing.animalBreed || listing.animalSpecies}
          {listing.animalSex && ` · ${listing.animalSex}`}
        </div>

        {/* Breeder attribution */}
        <div className="text-[13px] text-text-tertiary mb-3">
          {listing.programName}
        </div>

        {/* Location */}
        {locationText && (
          <div className="text-[13px] text-text-secondary mb-2">
            {locationText}
          </div>
        )}

        {/* Price */}
        {priceDisplay && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <span className="text-[15px] text-accent font-semibold">{priceDisplay}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
