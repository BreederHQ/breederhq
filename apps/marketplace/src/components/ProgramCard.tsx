// apps/marketplace/src/components/ProgramCard.tsx
import * as React from "react";
import type { PublicProgramSummary } from "../types";

type ProgramCardProps = {
  program: PublicProgramSummary;
  onClick: () => void;
};

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  const location = program.location || "";

  const details = [
    program.species.length > 0 ? program.species.join(", ") : null,
    program.breed,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-hairline bg-surface hover:border-[hsl(var(--brand-orange))]/40 transition-colors p-4 flex gap-4"
    >
      {/* Photo */}
      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-surface-strong/50 border border-hairline overflow-hidden flex items-center justify-center">
        {program.photoUrl ? (
          <img src={program.photoUrl} alt={program.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-50">🏠</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-primary truncate">{program.name}</div>
        {details && (
          <div className="text-sm text-secondary mt-0.5 truncate">{details}</div>
        )}
        {location && (
          <div className="text-xs text-secondary/70 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0 self-center text-secondary">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}
