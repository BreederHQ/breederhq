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
 * Uses standard Tailwind classes only - no design system dependencies.
 */
export function ProgramCard({ slug, name, location, photoUrl }: Props) {
  return (
    <Link
      to={`/programs/${slug}`}
      className="block rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
    >
      {/* Image area - fixed height */}
      <div className="h-36 bg-black/30 overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sm opacity-40">Program</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold leading-snug line-clamp-2">
          {name}
        </h3>
        {location && (
          <p className="text-sm opacity-70 mt-1 truncate">{location}</p>
        )}
      </div>
    </Link>
  );
}
