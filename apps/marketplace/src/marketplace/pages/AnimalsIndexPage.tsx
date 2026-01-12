// apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx
// Animals browse page - listing-centric view with real API support
// Supports both offspring group listings and program animal listings (individual animals)
import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimalListingCard } from "../components/AnimalListingCard";
import { formatCents } from "../../utils/format";
import {
  getAnimalListings,
  getPublicOffspringGroups,
  type PublicOffspringGroupListing,
} from "../../api/client";

import type { PublicAnimalListingDTO } from "../../api/types";

// View type for tab switching
type ViewType = "all" | "offspring" | "animals";

/**
 * Animals index page - browse available animals.
 * Shows both offspring group listings and program animal listings.
 */
export function AnimalsIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offspringGroupListings, setOffspringGroupListings] = React.useState<
    PublicOffspringGroupListing[]
  >([]);
  const [animalListings, setAnimalListings] = React.useState<
    PublicAnimalListingDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

      // Fetch both types in parallel
      const [offspringResult, animalResult] = await Promise.allSettled([
        getPublicOffspringGroups({ search: search || undefined }),
        getAnimalListings({ search: search || undefined }),
      ]);

      if (!dead) {
        // Handle offspring groups result
        if (offspringResult.status === "fulfilled") {
          setOffspringGroupListings(offspringResult.value.items || []);
        } else {
          console.error("Failed to fetch offspring groups:", offspringResult.reason);
          setOffspringGroupListings([]);
        }

        // Handle animal listings result
        if (animalResult.status === "fulfilled") {
          setAnimalListings(animalResult.value?.items || []);
        } else {
          console.error("Failed to fetch animal listings:", animalResult.reason);
          setAnimalListings([]);
        }

        setLoading(false);
      }
    };

    fetchData();
    return () => {
      dead = true;
    };
  }, [search]);

  // Filter listings by view
  const filteredOffspringListings = view === "animals" ? [] : offspringGroupListings;
  const filteredAnimalListings =
    view === "offspring"
      ? []
      : animalListings.filter((a) => {
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

  const totalListings = filteredOffspringListings.length + filteredAnimalListings.length;
  const hasAnyListings = offspringGroupListings.length > 0 || animalListings.length > 0;

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
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-10 px-4 rounded-portal-sm bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>

        {/* View tabs */}
        <div className="flex gap-1 p-1 rounded-portal-sm bg-portal-card border border-border-subtle">
          {[
            { key: "all", label: "All" },
            { key: "animals", label: "Program Animals" },
            { key: "offspring", label: "Offspring Groups" },
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

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-portal border border-border-subtle bg-portal-card p-5 animate-pulse"
            >
              <div className="h-5 bg-border-default rounded w-3/4 mb-3" />
              <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
              <div className="h-4 bg-border-default rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : totalListings === 0 ? (
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
          <h2 className="text-lg font-semibold text-white mb-2">
            {search ? "No listings match your search" : "No animals available yet"}
          </h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            {search
              ? "Try a different search term or browse all breeders."
              : "Browse breeders to see their programs and upcoming offspring."}
          </p>
          <Link
            to="/breeders"
            className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse breeders
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Program animal listings */}
          {filteredAnimalListings.map((listing) => (
            <AnimalListingCard key={`animal-${listing.id}`} listing={listing} />
          ))}
          {/* Offspring group listings */}
          {filteredOffspringListings.map((listing) => (
            <OffspringGroupCard
              key={`og-${listing.id}`}
              listing={listing}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Offspring group card for offspring group listings.
 */
function OffspringGroupCard({
  listing,
}: {
  listing: PublicOffspringGroupListing;
}) {
  // Format price range
  let priceText: string | null = null;
  if (listing.priceMinCents != null) {
    if (
      listing.priceMaxCents != null &&
      listing.priceMaxCents !== listing.priceMinCents
    ) {
      priceText = `${formatCents(listing.priceMinCents)} - ${formatCents(listing.priceMaxCents)}`;
    } else {
      priceText = formatCents(listing.priceMinCents);
    }
  }

  // Birth date display
  const birthDateLabel = listing.actualBirthOn ? "Born" : "Expected";
  const birthDateValue = listing.actualBirthOn || listing.expectedBirthOn;
  const formattedBirthDate = birthDateValue
    ? new Date(birthDateValue).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  // Build link - need breeder slug
  const breederSlug = listing.breeder?.slug;
  const listingLink =
    breederSlug && listing.listingSlug
      ? `/programs/${breederSlug}/offspring-groups/${listing.listingSlug}`
      : null;

  const CardContent = (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
      {/* Offspring Group badge */}
      <div className="mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400">
          Offspring Group
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-white mb-2 line-clamp-1">
        {listing.title || `${listing.breed || listing.species} Offspring`}
      </h3>

      {/* Breed and species */}
      <div className="text-sm text-text-secondary mb-1">
        {listing.breed || listing.species}
      </div>

      {/* Breeder attribution */}
      {listing.breeder && (
        <div className="text-[13px] text-text-tertiary mb-3">
          {listing.breeder.name}
          {listing.breeder.location && (
            <>
              <span className="mx-1">·</span>
              <span>{listing.breeder.location}</span>
            </>
          )}
        </div>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-secondary">
        {formattedBirthDate && (
          <span>
            {birthDateLabel} {formattedBirthDate}
          </span>
        )}
        <span>{listing.availableCount} available</span>
      </div>

      {/* Price */}
      {priceText && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <span className="text-[15px] text-accent font-semibold">{priceText}</span>
        </div>
      )}
    </div>
  );

  if (listingLink) {
    return (
      <Link to={listingLink} className="block">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
