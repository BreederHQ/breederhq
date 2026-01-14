// apps/marketplace/src/marketplace/components/AnimalProgramTile.tsx
// Animal Program card for displaying grouped programs in the marketplace

import { Link } from "react-router-dom";
import { SponsorDisclosure } from "./SponsorDisclosure";
import { DefaultCoverImage } from "../../shared/DefaultCoverImage";
import type { PublicAnimalProgramSummaryDTO } from "../../api/types";
import { Users } from "lucide-react";

interface AnimalProgramTileProps {
  program: PublicAnimalProgramSummaryDTO;
}

/**
 * Animal Program card for marketplace display.
 * Shows program name, template type badge, participant count, and breeder info.
 */
export function AnimalProgramTile({ program }: AnimalProgramTileProps) {
  const isBoosted = program.boosted || false;
  const sponsorDisclosureText = program.sponsorDisclosureText;

  // Template type badge config
  const templateLabels: Record<string, { label: string; color: string }> = {
    STUD_SERVICES: { label: "Stud Services", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    GUARDIAN: { label: "Guardian", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    TRAINED: { label: "Trained", color: "bg-green-500/20 text-green-300 border-green-500/30" },
    REHOME: { label: "Rehome", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    CO_OWNERSHIP: { label: "Co-Ownership", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    CUSTOM: { label: "Custom", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  };

  const templateConfig = templateLabels[program.templateType] || {
    label: program.templateType,
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  };

  // Price display
  const priceDisplay = (() => {
    if (program.priceModel === "fixed" && program.priceCents) {
      return `$${(program.priceCents / 100).toLocaleString()}`;
    } else if (program.priceModel === "range" && program.priceMinCents && program.priceMaxCents) {
      return `$${(program.priceMinCents / 100).toLocaleString()} - $${(program.priceMaxCents / 100).toLocaleString()}`;
    } else {
      return "Contact for pricing";
    }
  })();

  return (
    <Link
      to={`/animal-programs/${program.slug}`}
      className={`group flex flex-col min-h-[240px] rounded-portal border bg-portal-card overflow-hidden shadow-portal transition-all hover:border-border-default hover:bg-portal-card-hover hover:-translate-y-0.5 hover:shadow-portal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        isBoosted ? "border-accent/30" : "border-border-subtle"
      }`}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {program.coverImageUrl ? (
          <img
            src={program.coverImageUrl}
            alt={program.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <DefaultCoverImage />
        )}
        {/* Boosted badge */}
        {isBoosted && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/90 text-white">
              Boosted
            </span>
          </div>
        )}
        {/* Template type badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${templateConfig.color}`}>
            {templateConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-[15px] font-semibold text-white leading-snug line-clamp-2">
          {program.name}
        </h3>
        {program.headline && (
          <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">
            {program.headline}
          </p>
        )}

        <div className="mt-auto pt-3 space-y-2">
          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
            <Users size={14} />
            <span>{program.participantCount} {program.participantCount === 1 ? 'animal' : 'animals'}</span>
          </div>

          {/* Breeder and pricing */}
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-tertiary truncate flex-1">
              {program.breeder.name}
            </span>
            <span className="text-accent font-medium ml-2">
              {priceDisplay}
            </span>
          </div>

          {/* View program CTA */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[13px] font-medium text-accent group-hover:text-accent-hover transition-colors">
              View program →
            </span>
            {isBoosted && sponsorDisclosureText && (
              <div onClick={(e) => e.preventDefault()}>
                <SponsorDisclosure disclosureText={sponsorDisclosureText} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
