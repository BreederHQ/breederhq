// apps/marketplace/src/marketplace/components/TrustBar.tsx
// Trust bar showing aggregate marketplace stats - builds credibility for new visitors

import * as React from "react";

interface TrustBarProps {
  stats?: {
    breederCount: number;
    animalCount: number;
    reviewCount: number;
  };
  loading?: boolean;
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="4" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="7" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="17" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  }
  return `${count}+`;
}

export function TrustBar({ stats, loading }: TrustBarProps) {
  // Default stats for cold-start (update these as real data grows)
  const displayStats = stats || {
    breederCount: 0,
    animalCount: 0,
    reviewCount: 0,
  };

  // Don't show trust bar if all stats are zero (true cold start)
  // Instead show the "Join early" messaging
  const hasStats = displayStats.breederCount > 0 || displayStats.animalCount > 0;

  if (loading) {
    return (
      <div className="flex justify-center gap-8 md:gap-12 py-4 border-y border-border-subtle bg-portal-card/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-5 h-5 bg-border-default rounded" />
            <div className="h-4 w-24 bg-border-default rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Cold start variant - no stats yet
  if (!hasStats) {
    return (
      <div className="flex justify-center py-4 border-y border-border-subtle bg-portal-card/50">
        <p className="text-sm text-text-secondary">
          <span className="text-[hsl(var(--brand-orange))] font-medium">New marketplace</span>
          {" · "}Verified breeders and service providers joining daily
        </p>
      </div>
    );
  }

  // Normal variant with stats
  return (
    <div
      className="flex flex-wrap justify-center gap-6 md:gap-12 py-4 border-y border-border-subtle bg-portal-card/50"
      role="region"
      aria-label="Marketplace statistics"
    >
      {displayStats.breederCount > 0 && (
        <div className="flex items-center gap-2">
          <ShieldIcon className="w-5 h-5 text-green-400" />
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-white">{formatCount(displayStats.breederCount)}</span>
            {" "}Verified Programs
          </span>
        </div>
      )}

      {displayStats.animalCount > 0 && (
        <div className="flex items-center gap-2">
          <PawIcon className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-white">{formatCount(displayStats.animalCount)}</span>
            {" "}Available Animals
          </span>
        </div>
      )}

      {displayStats.reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-white">{formatCount(displayStats.reviewCount)}</span>
            {" "}Buyer Reviews
          </span>
        </div>
      )}
    </div>
  );
}

export default TrustBar;
