// apps/marketplace/src/core/components/ListingCard.tsx
import * as React from "react";
import { Link } from "react-router-dom";

interface Props {
  programSlug: string;
  listingSlug: string;
  title: string | null;
  species: string;
  breed: string | null;
  actualBirthOn: string | null;
  expectedBirthOn: string | null;
  countAvailable: number;
  priceRange: { min: number; max: number } | null;
}

/**
 * Format cents to USD display string.
 */
function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

/**
 * Format ISO date string to "MMM d, yyyy" format.
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00"); // Parse as local date
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Card component for an offspring group listing.
 * Links to the listing detail page.
 */
export function ListingCard({
  programSlug,
  listingSlug,
  title,
  species,
  breed,
  actualBirthOn,
  expectedBirthOn,
  countAvailable,
  priceRange,
}: Props) {
  // Format title with fallback
  const displayTitle = title || "Untitled listing";

  // Format species/breed meta line
  const metaParts: string[] = [species];
  if (breed) {
    metaParts.push(breed);
  }
  const metaLine = metaParts.join(" · ");

  // Format birth date line
  let birthLine: string | null = null;
  if (actualBirthOn) {
    birthLine = `Born ${formatDate(actualBirthOn)}`;
  } else if (expectedBirthOn) {
    birthLine = `Expected ${formatDate(expectedBirthOn)}`;
  }

  // Format availability
  const availabilityLine = `${countAvailable} available`;

  // Format price
  let priceLine: string | null = null;
  if (priceRange) {
    if (priceRange.min === priceRange.max) {
      priceLine = formatPrice(priceRange.min);
    } else {
      priceLine = `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`;
    }
  }

  return (
    <Link
      to={`/programs/${programSlug}/offspring-groups/${listingSlug}`}
      className="flex items-center justify-between p-4 rounded-lg border border-hairline bg-surface-1 hover:bg-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-primary truncate">
          {displayTitle}
        </h3>
        <p className="text-sm text-secondary mt-0.5">{metaLine}</p>
        {birthLine && (
          <p className="text-sm text-secondary mt-0.5">{birthLine}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="text-primary font-medium">{availabilityLine}</span>
          {priceLine && (
            <span className="text-secondary">{priceLine}</span>
          )}
        </div>
      </div>
      {/* Chevron */}
      <div className="ml-4 text-secondary" aria-hidden="true">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
