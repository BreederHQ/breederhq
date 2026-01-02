// apps/marketplace/src/marketplace/components/ProgramTile.tsx
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
      className="group flex flex-col min-h-[220px] rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    >
      {/* Image area */}
      <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex-shrink-0">
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
            <span className="text-2xl font-semibold text-white/20">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
          {name}
        </h3>
        <p className="text-sm text-white/50 mt-1 truncate">
          {location || "Location not specified"}
        </p>
        <div className="mt-auto pt-3">
          <span className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
            View program &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
