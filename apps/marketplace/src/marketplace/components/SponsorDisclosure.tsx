// apps/marketplace/src/marketplace/components/SponsorDisclosure.tsx
// Subtle sponsor disclosure tooltip for boosted/sponsored items
import * as React from "react";

interface SponsorDisclosureProps {
  disclosureText: string;
}

/**
 * "Why am I seeing this?" tooltip for sponsored/boosted items.
 * Shows a subtle info icon that reveals disclosure text on hover.
 */
export function SponsorDisclosure({ disclosureText }: SponsorDisclosureProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Why am I seeing this?"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Why am I seeing this?</span>
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1 w-64 p-3 rounded-portal-sm bg-portal-card border border-border-default shadow-lg">
          <p className="text-xs text-text-secondary leading-relaxed">
            {disclosureText}
          </p>
        </div>
      )}
    </div>
  );
}
