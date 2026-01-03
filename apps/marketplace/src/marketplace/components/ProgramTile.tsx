// apps/marketplace/src/marketplace/components/ProgramTile.tsx
// Buyer-facing breeder tile with "View litters" CTA
import { Link } from "react-router-dom";
import { SponsorDisclosure } from "./SponsorDisclosure";

interface ProgramTileProps {
  slug: string;
  name: string;
  location: string | null;
  photoUrl: string | null;
  isBoosted?: boolean;
  sponsorDisclosureText?: string;
}

/**
 * Breeder card with buyer-facing language.
 * Shows breeder name, location, and "View litters" CTA.
 */
export function ProgramTile({ slug, name, location, photoUrl, isBoosted = false, sponsorDisclosureText }: ProgramTileProps) {
  return (
    <Link
      to={`/programs/${slug}`}
      className={`group flex flex-col min-h-[200px] rounded-portal border bg-portal-card overflow-hidden shadow-portal transition-all hover:border-border-default hover:bg-portal-card-hover hover:-translate-y-0.5 hover:shadow-portal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        isBoosted ? "border-accent/30" : "border-border-subtle"
      }`}
    >
      {/* Image area */}
      <div className="h-[100px] bg-gradient-to-br from-portal-card-hover to-border-default overflow-hidden flex-shrink-0 relative">
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
            <span className="text-2xl font-semibold text-text-tertiary">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Boosted badge */}
        {isBoosted && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/90 text-white">
              Boosted
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-[15px] font-semibold text-white leading-snug line-clamp-2">
          {name}
        </h3>
        <p className="text-[13px] text-text-tertiary mt-1 truncate">
          {location || "Location not specified"}
        </p>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[13px] font-medium text-accent group-hover:text-accent-hover transition-colors">
            View litters →
          </span>
          {isBoosted && sponsorDisclosureText && (
            <div onClick={(e) => e.preventDefault()}>
              <SponsorDisclosure disclosureText={sponsorDisclosureText} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
