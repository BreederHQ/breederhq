// apps/marketplace/src/marketplace/components/AnimalListingCard.tsx
// Shared component for rendering program animal listing cards.
// Used by AnimalsIndexPage, BreederPage, and any other page displaying animal listings.
// @stable - Single source of truth for animal listing card rendering.

import * as React from "react";
import { Link } from "react-router-dom";
import { formatCents } from "../../utils/format";
import type { PublicAnimalListingDTO, AnimalListingIntent } from "../../api/types";

/**
 * Intent display labels - canonical mapping for all card renders.
 */
export const INTENT_LABELS: Record<AnimalListingIntent, string> = {
  STUD: "Stud Service",
  BROOD_PLACEMENT: "Brood Placement",
  REHOME: "Rehome",
  SHOWCASE: "Showcase",
};

/**
 * Intent badge color classes.
 */
const INTENT_BADGE_CLASSES: Record<AnimalListingIntent, string> = {
  STUD: "bg-purple-500/15 text-purple-400",
  BROOD_PLACEMENT: "bg-pink-500/15 text-pink-400",
  REHOME: "bg-green-500/15 text-green-400",
  SHOWCASE: "bg-gray-500/15 text-gray-400",
};

export interface AnimalListingCardProps {
  listing: PublicAnimalListingDTO;
  /** Override the link destination (default: /programs/:slug/animals/:urlSlug) */
  linkTo?: string;
  /** Hide the breeder/program attribution line */
  hideProgram?: boolean;
}

/**
 * Program animal listing card for individual animal listings.
 * Single source of truth for rendering animal listing cards across the marketplace.
 */
export function AnimalListingCard({
  listing,
  linkTo,
  hideProgram = false,
}: AnimalListingCardProps) {
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
  const intentBadgeClass = listing.intent ? INTENT_BADGE_CLASSES[listing.intent] : "";

  // Default link destination
  const href = linkTo ?? `/programs/${listing.programSlug}/animals/${listing.urlSlug}`;

  return (
    <Link to={href} className="block">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {/* Intent badge */}
        {intentLabel && (
          <div className="mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${intentBadgeClass}`}>
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
        {!hideProgram && (
          <div className="text-[13px] text-text-tertiary mb-3">
            {listing.programName}
          </div>
        )}

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
