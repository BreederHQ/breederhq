// apps/marketplace/src/marketplace/components/ProgramTile.tsx
import { Link } from "react-router-dom";

interface ProgramTileProps {
  slug: string;
  name: string;
  location: string | null;
  photoUrl: string | null;
}

/**
 * Compact program card for the programs grid.
 * Entire card is a link to program profile.
 */
export function ProgramTile({ slug, name, location, photoUrl }: ProgramTileProps) {
  return (
    <Link
      to={`/programs/${slug}`}
      className="group flex flex-col min-h-[180px] rounded-lg border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
    >
      {/* Image area - shorter */}
      <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex-shrink-0">
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
            <span className="text-xl font-semibold text-white/20">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content - tighter padding */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
          {name}
        </h3>
        <p className="text-xs text-white/50 mt-0.5 truncate">
          {location || "Location not specified"}
        </p>
        <div className="mt-auto pt-2">
          <span className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
