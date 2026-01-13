// apps/marketplace/src/marketplace/pages/SavedListingsPage.tsx
// Shows user's saved/favorited listings

import * as React from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "../components/Breadcrumb";
import { useSavedListings } from "../../hooks/useSavedListings";
import { formatCents } from "../../utils/format";
import type { SavedListingItem } from "../../api/client";

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SavedCardProps {
  item: SavedListingItem;
  onRemove: () => void;
}

function SavedCard({ item, onRemove }: SavedCardProps) {
  const listing = item.listing;
  if (!listing) return null;

  // Determine the link based on listing type
  let href = "#";
  if (item.listingType === "offspring_group" && listing.breederSlug && listing.slug) {
    href = `/programs/${listing.breederSlug}/offspring-groups/${listing.slug}`;
  } else if (item.listingType === "animal" && listing.breederSlug && listing.slug) {
    href = `/programs/${listing.breederSlug}/animals/${listing.slug}`;
  } else if (item.listingType === "service" && listing.slug) {
    href = `/services/${listing.slug}`;
  }

  // Format price
  let priceDisplay: string | null = null;
  if (listing.priceCents != null) {
    priceDisplay = formatCents(listing.priceCents);
  } else if (listing.priceMinCents != null) {
    if (listing.priceMaxCents != null && listing.priceMaxCents !== listing.priceMinCents) {
      priceDisplay = `${formatCents(listing.priceMinCents)} - ${formatCents(listing.priceMaxCents)}`;
    } else {
      priceDisplay = formatCents(listing.priceMinCents);
    }
  }

  const isUnavailable = !listing.isAvailable || listing.status !== "published";

  return (
    <div className={`group relative ${isUnavailable ? "opacity-60" : ""}`}>
      <Link to={href} className="block">
        <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden transition-all hover:border-border-default hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-border-default">
            {listing.coverImageUrl ? (
              <img
                src={listing.coverImageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Type badge */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
              {item.listingType === "offspring_group" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/90 text-white">
                  Litter
                </span>
              )}
              {item.listingType === "service" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/90 text-white">
                  Service
                </span>
              )}
              {isUnavailable && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/90 text-white">
                  Unavailable
                </span>
              )}
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
              aria-label="Remove from saved"
            >
              <HeartIcon className="w-4 h-4" filled />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-[15px] font-semibold text-white mb-1 line-clamp-1 group-hover:text-accent transition-colors">
              {listing.title}
            </h3>

            {listing.breed && (
              <p className="text-sm text-text-secondary mb-1">{listing.breed}</p>
            )}

            {listing.breederName && (
              <p className="text-[13px] text-text-tertiary mb-2">{listing.breederName}</p>
            )}

            <div className="flex items-center justify-between">
              {priceDisplay && (
                <span className="text-[15px] font-semibold text-accent">{priceDisplay}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-border-default" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-border-default rounded w-3/4" />
        <div className="h-3 bg-border-default rounded w-1/2" />
        <div className="h-3 bg-border-default rounded w-1/3" />
        <div className="flex justify-between">
          <div className="h-4 bg-border-default rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function SavedListingsPage() {
  const { savedItems, loading, toggleSave, refresh } = useSavedListings();

  const handleRemove = async (item: SavedListingItem) => {
    await toggleSave(item.listingType, item.listingId);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Saved Listings" },
        ]}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Saved Listings</h1>
          <p className="text-text-secondary mt-1">
            Your favorited animals, programs, and services
          </p>
        </div>
        {savedItems.length > 0 && (
          <button
            type="button"
            onClick={refresh}
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && savedItems.length === 0 && (
        <div className="rounded-lg border border-border-subtle bg-portal-card p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
            <HeartIcon className="w-8 h-8 text-text-tertiary" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No saved listings yet</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            When you find animals, programs, or services you're interested in,
            save them here to easily find them later.
          </p>
          <Link
            to="/animals"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            Browse Animals
          </Link>
        </div>
      )}

      {/* Saved Items Grid */}
      {!loading && savedItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {savedItems.map((item) => (
            <SavedCard
              key={`${item.listingType}-${item.listingId}`}
              item={item}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedListingsPage;
