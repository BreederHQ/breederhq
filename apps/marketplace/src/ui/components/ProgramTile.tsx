// apps/marketplace/src/ui/components/ProgramTile.tsx
import * as React from "react";
import { Link } from "react-router-dom";

interface ProgramTileProps {
  slug: string;
  name: string;
  location: string | null;
  photoUrl: string | null;
}

/**
 * Program card for the programs grid.
 * Entire card is a link to program profile.
 */
export function ProgramTile({ slug, name, location, photoUrl }: ProgramTileProps) {
  return (
    <Link
      to={`/programs/${slug}`}
      className="group block rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    >
      {/* Image area - fixed height h-40 */}
      <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-medium text-white/30">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
          {name}
        </h3>
        {location && (
          <p className="text-sm text-white/60 mt-1 truncate">{location}</p>
        )}
      </div>
    </Link>
  );
}
