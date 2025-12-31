// apps/marketplace/src/components/ListingCard.tsx
import * as React from "react";
import type { PublicOffspringGroupSummary, PublicAnimalSummary } from "../types";

type ListingCardProps = {
  type: "offspring-group" | "animal";
  programSlug: string;
  item: PublicOffspringGroupSummary | PublicAnimalSummary;
  onClick: () => void;
};

export function ListingCard({ type, item, onClick }: ListingCardProps) {
  const isOffspringGroup = type === "offspring-group";
  const offspringItem = item as PublicOffspringGroupSummary;
  const animalItem = item as PublicAnimalSummary;

  const subtitle = isOffspringGroup
    ? offspringItem.status || (offspringItem.expectedDate ? `Expected: ${formatDate(offspringItem.expectedDate)}` : "")
    : [animalItem.breed, animalItem.sex?.toLowerCase()].filter(Boolean).join(" • ");

  const badge = isOffspringGroup
    ? offspringItem.offspringCount != null ? `${offspringItem.offspringCount} offspring` : null
    : animalItem.status;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-hairline bg-surface hover:border-[hsl(var(--brand-orange))]/40 transition-colors p-3 flex gap-3"
    >
      {/* Photo placeholder */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center">
        {(item.photoUrl) ? (
          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-50">{isOffspringGroup ? "🐾" : "🐕"}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-primary truncate">{item.name}</div>
        {subtitle && (
          <div className="text-xs text-secondary mt-0.5 truncate">{subtitle}</div>
        )}
        {badge && (
          <div className="mt-1.5">
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-surface-strong/70 text-secondary border border-hairline">
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0 self-center text-secondary">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
