// apps/marketplace/src/core/components/ProgramCard.tsx
import * as React from "react";
import { Link } from "react-router-dom";

interface Props {
  slug: string;
  name: string;
  location: string | null;
  photoUrl: string | null;
}

/**
 * Card component for a program in the Programs Index grid.
 * Entire card is clickable and links to the program profile.
 */
export function ProgramCard({ slug, name, location, photoUrl }: Props) {
  // Generate initials for placeholder
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <Link
      to={`/programs/${slug}`}
      className="block rounded-lg border border-hairline bg-surface-1 overflow-hidden transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
    >
      {/* Photo or placeholder */}
      <div className="aspect-[4/3] bg-surface-2 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl font-semibold text-secondary select-none">
            {initials || "?"}
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-primary truncate">{name}</h3>
        {location && (
          <p className="text-sm text-secondary mt-1 truncate">{location}</p>
        )}
      </div>
    </Link>
  );
}
